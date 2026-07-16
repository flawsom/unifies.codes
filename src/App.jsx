import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabaseClient";
import { useAuth } from "./context/AuthContext";
import AccountBar from "./components/AccountBar";
import { DEFAULT_PHASES, DEFAULT_BONUS, DEFAULT_PARALLEL_TRACK, DEFAULT_CURRICULUM, allItems } from "./data/curriculum";
import {
  todayStr,
  daySetFromCheckedAt,
  currentStreak,
  longestStreak,
  activeLast7,
  buildHeatmap,
  totalXp,
  levelFromXp,
  momentumPercent,
} from "./utils/progressStats";
import ActivityHeatmap from "./components/ActivityHeatmap";
import CommandPalette from "./components/CommandPalette";
import Insights from "./components/Insights";
import FocusView from "./components/FocusView";
import ShortcutsHelp from "./components/ShortcutsHelp";
import { ToastProvider, useToast } from "./components/Toast";
import { resolveSharedUser, buildSnapshot } from "./utils/share";
import { useTheme } from "./hooks/useTheme";
import { useNotifications } from "./hooks/useNotifications";
import { exportProgress, exportCsv, parseImport } from "./utils/io";

// Code-split the heavier panels so the initial bundle stays small.
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const SharePanelLazy = lazy(() => import("./components/SharePanel"));

const STORAGE_KEY = "fde-tracker-v1";
const STORAGE_AT_KEY = "fde-tracker-checkedAt-v1";

const itemsById = Object.fromEntries(allItems.map((i) => [i.id, i]));

export default function DeploymentTracker() {
  const { isSupabaseConfigured: authConfigured, authLoading, user } = useAuth();
  const [theme, setTheme] = useTheme();
  const { celebrate, notify } = useToast();

  // Read-only shared profile (?u=username)
  const [sharedUser, setSharedUser] = useState(null);
  const [sharedCompare, setSharedCompare] = useState(null); // resolved "vs" target
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get("u");
    if (u) {
      resolveSharedUser(u).then(setSharedUser).catch(() => setSharedUser(null));
    }
  }, []);

  // Curriculum (topics)
  const [curriculum, setCurriculum] = useState(DEFAULT_CURRICULUM);
  const [showAdmin, setShowAdmin] = useState(false);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    supabase
      .from("curriculum")
      .select("data")
      .eq("id", 1)
      .single()
      .then(({ data, error }) => {
        if (!cancelled && !error && data?.data) setCurriculum(data.data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const PHASES = curriculum.phases || DEFAULT_PHASES;
  const BONUS = curriculum.bonus || DEFAULT_BONUS;
  const PARALLEL_TRACK = curriculum.parallelTrack || DEFAULT_PARALLEL_TRACK;
  const ALL_PHASES = useMemo(() => [...PHASES, BONUS], [PHASES, BONUS]);
  const CORE_IDS = useMemo(
    () => new Set(PHASES.flatMap((p) => p.weeks.flatMap((w) => w.items.map((i) => i.id)))),
    [PHASES]
  );
  const DSA_IDS = useMemo(() => new Set(PARALLEL_TRACK.items.map((i) => i.id)), [PARALLEL_TRACK]);

  // Progress state
  const [checked, setChecked] = useState({});
  const [checkedAt, setCheckedAt] = useState({});
  const [startDate, setStartDate] = useState("");
  const [openPhase, setOpenPhase] = useState("p1");
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error | offline
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [importError, setImportError] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    try {
      return Number(localStorage.getItem("fde-tracker-goal")) || 5;
    } catch {
      return 5;
    }
  });
  const prevLevel = useRef(0);
  const refs = useRef({});

  // Offline queue: pending mutations while Supabase is unreachable.
  const pendingRef = useRef(false);

  // Load
  useEffect(() => {
    if (authConfigured && authLoading) return;
    let cancelled = false;
    setLoaded(false);

    const loadGuest = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const rawAt = localStorage.getItem(STORAGE_AT_KEY);
        if (!cancelled) {
          setChecked(raw ? JSON.parse(raw).checked || {} : {});
          setStartDate(raw ? JSON.parse(raw).startDate || "" : "");
          setCheckedAt(rawAt ? JSON.parse(rawAt) : {});
        }
      } catch (e) {
        /* no saved state */
      }
    };

    const applySnapshot = (c, at, sd) => {
      if (cancelled) return;
      setChecked(c || {});
      setCheckedAt(at || {});
      setStartDate(sd || "");
    };

    if (sharedUser) {
      applySnapshot(sharedUser.checked, sharedUser.checkedAt, sharedUser.startDate);
      setLoaded(true);
      return () => {
        cancelled = true;
      };
    }

    if (user && supabase) {
      supabase
        .from("progress")
        .select("checked, checked_at, start_date, xp")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (cancelled) return;
          if (!error && data) {
            applySnapshot(data.checked, data.checked_at, data.start_date);
          } else {
            applySnapshot({}, {}, "");
          }
        })
        .finally(() => !cancelled && setLoaded(true));
    } else {
      loadGuest();
      setLoaded(true);
    }

    return () => {
      cancelled = true;
    };
  }, [user, authConfigured, authLoading, sharedUser]);

  // Persist (with offline queue + visible save status)
  useEffect(() => {
    if (!loaded || sharedUser) return;
    const xp = totalXp(checked, allItems);

    if (user && supabase) {
      setSaveState("saving");
      const handle = setTimeout(() => {
        supabase
          .from("progress")
          .upsert({
            user_id: user.id,
            checked,
            checked_at: checkedAt,
            start_date: startDate,
            xp,
            updated_at: new Date().toISOString(),
          })
          .then(({ error }) => {
            if (error) {
              pendingRef.current = true;
              setSaveState("offline");
            } else {
              pendingRef.current = false;
              setSaveState("saved");
              setLastSavedAt(new Date());
            }
          })
          .catch(() => {
            pendingRef.current = true;
            setSaveState("offline");
          });
      }, 600);
      return () => clearTimeout(handle);
    }

    // Guest: localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ checked, startDate }));
      localStorage.setItem(STORAGE_AT_KEY, JSON.stringify(checkedAt));
      setSaveState("saved");
      setLastSavedAt(new Date());
    } catch (e) {
      setSaveState("error");
    }
  }, [checked, checkedAt, startDate, loaded, user, sharedUser]);

  // Flush offline queue when connection returns.
  useEffect(() => {
    if (!user || !supabase) return;
    const onOnline = () => {
      if (pendingRef.current) {
        setSaveState("saving");
        supabase
          .from("progress")
          .upsert({
            user_id: user.id,
            checked,
            checked_at: checkedAt,
            start_date: startDate,
            xp: totalXp(checked, allItems),
            updated_at: new Date().toISOString(),
          })
          .then(({ error }) => {
            if (!error) {
              pendingRef.current = false;
              setSaveState("saved");
              setLastSavedAt(new Date());
            }
          });
      }
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [checked, checkedAt, startDate, user]);

  const toggle = (id) => {
    if (sharedUser) return;
    const nowIso = new Date().toISOString();
    setChecked((c) => {
      const next = { ...c };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
    setCheckedAt((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = nowIso;
      return next;
    });
  };

  // Derived stats
  const coreDone = useMemo(
    () => Object.keys(checked).filter((k) => checked[k] && CORE_IDS.has(k)).length,
    [checked]
  );
  const coreTotal = CORE_IDS.size;
  const corePct = Math.round((coreDone / coreTotal) * 100);

  const bonusDone = Object.keys(checked).filter(
    (k) => checked[k] && !CORE_IDS.has(k) && !DSA_IDS.has(k)
  ).length;
  const bonusTotal = BONUS.weeks.flatMap((w) => w.items).length;

  const dsaDone = Object.keys(checked).filter((k) => checked[k] && DSA_IDS.has(k)).length;
  const dsaTotal = PARALLEL_TRACK.items.length;
  const dsaPct = Math.round((dsaDone / dsaTotal) * 100);

  const daySet = useMemo(() => daySetFromCheckedAt(checkedAt), [checkedAt]);
  const streak = useMemo(() => currentStreak(daySet, 1), [daySet]); // grace day
  const longest = useMemo(() => longestStreak(daySet), [daySet]);
  const momentum = useMemo(() => momentumPercent(daySet), [daySet]);
  const heatmap = useMemo(() => buildHeatmap(checkedAt), [checkedAt]);
  const xp = useMemo(() => totalXp(checked, allItems), [checked]);
  const lvl = useMemo(() => levelFromXp(xp), [xp]);

  // Weekly goal: distinct days active in the trailing 7 days vs target.
  const weeklyActive = useMemo(() => activeLast7(daySet), [daySet]);
  const goalReached = weeklyActive >= weeklyGoal;
  const { enabled: notifyEnabled, supported: notifySupported, enable: enableNotify } =
    useNotifications(goalReached);

  // Celebrate on level-up (compare to previous render).
  useEffect(() => {
    if (lvl.level > prevLevel.current && prevLevel.current !== 0) {
      celebrate(`Level ${lvl.level} reached — ${xp} XP!`);
    }
    prevLevel.current = lvl.level;
  }, [lvl.level, xp, celebrate]);

  // Celebrate when a phase hits 100%.
  const prevPhasePct = useRef({});
  useEffect(() => {
    for (const phase of ALL_PHASES) {
      const p = phasePct(phase);
      if (p === 100 && prevPhasePct.current[phase.id] !== 100) {
        celebrate(`${phase.title} complete! 🏆`);
      }
      prevPhasePct.current[phase.id] = p;
    }
  }, [checked]);

  const dayInfo = useMemo(() => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const now = new Date();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
    return { elapsed: Math.max(diff, 0), remaining: Math.max(90 - diff, 0) };
  }, [startDate]);

  const phasePct = (phase) => {
    const ids = phase.weeks.flatMap((w) => w.items.map((i) => i.id));
    const done = ids.filter((id) => checked[id]).length;
    return ids.length ? Math.round((done / ids.length) * 100) : 0;
  };

  const scrollTo = (id) => {
    setOpenPhase(id);
    refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onPaletteSelect = (item) => {
    setPaletteOpen(false);
    const phaseId = item.phaseId === "dsa" ? "dsa" : item.phaseId;
    scrollTo(phaseId);
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "?" || e.key === "/")) {
        e.preventDefault();
        setShowShortcuts((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Import handler
  const onImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseImport(reader.result);
        if (!parsed) {
          setImportError("Not a valid FDE progress file.");
          return;
        }
        setChecked(parsed.checked);
        setCheckedAt(parsed.checkedAt);
        setStartDate(parsed.startDate);
        setImportError("");
      } catch {
        setImportError("Could not parse file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const saveStatus = useMemo(() => {
    if (sharedUser) return null;
    if (saveState === "saving") return { text: "Saving…", cls: "text-slate-500" };
    if (saveState === "offline") return { text: "Offline — changes saved locally, will sync", cls: "text-amber-400" };
    if (saveState === "error") return { text: "Not saving — storage blocked", cls: "text-red-400" };
    if (saveState === "saved" && lastSavedAt)
      return { text: `Saved ✓ ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`, cls: "text-emerald-400" };
    return null;
  }, [saveState, lastSavedAt, sharedUser]);

  // ---- SHARED (read-only) view ----
  if (sharedUser) {
    const sCorePct = sharedUser.corePct || 0;
    const sDsaPct = sharedUser.dsaPct || 0;
    const sStreak = currentStreak(daySetFromCheckedAt(sharedUser.checkedAt || {}), 1);
    const sHeatmap = buildHeatmap(sharedUser.checkedAt || {});
    const myEnabled = !!(user || localStorage.getItem(STORAGE_KEY));
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        <div className="max-w-4xl mx-auto px-5 py-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center">
              {(sharedUser.username || sharedUser.displayName || "?").slice(0, 1).toUpperCase()}
            </span>
            <div>
              <h1 className="text-2xl font-bold">{sharedUser.displayName || sharedUser.username}'s FDE Route</h1>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Read-only shared progress</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-6 font-mono text-sm">
            <span className="text-amber-400">{sCorePct}% core</span>
            <span className="text-cyan-400">{sDsaPct}% DSA</span>
            <span className="text-emerald-400">{sStreak}-day streak</span>
            <span className="text-slate-400">{activeLast7(daySetFromCheckedAt(sharedUser.checkedAt || {}))}/7 active</span>
            {myEnabled && (
              <button
                onClick={() => {
                  const other = {
                    corePct,
                    dsaPct,
                    streak,
                    username: "you",
                  };
                  setSharedCompare(other);
                }}
                className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-300 hover:border-slate-500"
              >
                Compare with me
              </button>
            )}
          </div>
          {sharedCompare && (
            <div className="mt-3 grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-slate-900 border border-slate-800 rounded p-2">
                <div className="text-slate-500">Core %</div>
                <div className="text-amber-400">{sCorePct} vs {sharedCompare.corePct}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded p-2">
                <div className="text-slate-500">DSA %</div>
                <div className="text-cyan-400">{sDsaPct} vs {sharedCompare.dsaPct}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded p-2">
                <div className="text-slate-500">Streak</div>
                <div className="text-emerald-400">{sStreak} vs {sharedCompare.streak}</div>
              </div>
            </div>
          )}
          <div className="mt-6">
            <ActivityHeatmap columns={sHeatmap} streak={sStreak} longest={longestStreak(daySetFromCheckedAt(sharedUser.checkedAt || {}))} readOnly />
          </div>
          <div className="mt-8 space-y-6">
            {ALL_PHASES.map((phase) => {
              const ids = phase.weeks.flatMap((w) => w.items.map((i) => i.id));
              const done = ids.filter((id) => sharedUser.checked?.[id]).length;
              const pct = ids.length ? Math.round((done / ids.length) * 100) : 0;
              return (
                <section key={phase.id}>
                  <div className="flex items-baseline justify-between border-b border-slate-800 pb-3 mb-4">
                    <h2 className="text-lg font-bold text-slate-50">{phase.title}</h2>
                    <span className="font-mono text-slate-400">{pct}%</span>
                  </div>
                  <div className="space-y-2">
                    {phase.weeks.flatMap((w) => w.items).map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <span className={`mt-1 w-3 h-3 rounded-sm flex-shrink-0 ${sharedUser.checked?.[item.id] ? "bg-amber-500" : "bg-slate-800"}`} />
                        <p className={`text-sm ${sharedUser.checked?.[item.id] ? "text-slate-500 line-through" : "text-slate-300"}`}>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
          <p className="mt-10 text-center text-xs text-slate-600 font-mono">
            This is a read-only view · build your own at this app
          </p>
        </div>
      </div>
    );
  }

  // ---- MAIN app ----
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[500] focus:bg-amber-500 focus:text-slate-950 focus:px-3 focus:py-1 focus:rounded">Skip to content</a>
      {showAdmin && (
        <React.Suspense fallback={null}>
          <AdminPanel defaultCurriculum={DEFAULT_CURRICULUM} onClose={() => setShowAdmin(false)} />
        </React.Suspense>
      )}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={allItems}
        checked={checked}
        onSelect={onPaletteSelect}
      />
      <ShortcutsHelp open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <div className="border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-5 py-5">
          <div className="flex items-baseline justify-between flex-wrap gap-3">
            <div>
              <p className="font-mono text-xs tracking-[0.2em] text-amber-400 uppercase">Deployment Log</p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-50">FDE Readiness — 90 Day Route</h1>
            </div>
            <div className="flex items-center gap-5">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono"
                title="Toggle theme"
                aria-label="Toggle color theme"
              >
                {theme === "dark" ? "☀" : "☾"}
              </button>
              <AccountBar onOpenAdmin={() => setShowAdmin(true)} />
              <div className="text-right" title="Percentage of the 5-phase core route you've checked off">
                <div className="font-mono text-3xl font-bold text-amber-400 tabular-nums">{corePct}%</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">core route complete</div>
              </div>
            </div>
          </div>

          {/* progress bar */}
          <div className="mt-4 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${corePct}%` }} />
          </div>

          {/* gamification bar */}
          <div className="mt-2 flex items-center gap-3 font-mono text-xs">
            <span className="text-fuchsia-400">LVL {lvl.level}</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-900 overflow-hidden">
              <div className="h-full bg-fuchsia-500" style={{ width: `${lvl.pct}%` }} />
            </div>
            <span className="text-slate-500">{xp} XP</span>
          </div>

          {/* day counter + save status + tools */}
          <div className="mt-4 flex items-center gap-4 flex-wrap font-mono text-xs">
            <label className="flex items-center gap-2 text-slate-400">
              MISSION START:
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
              />
            </label>
            {dayInfo && (
              <>
                <span className="text-cyan-400">DAY {dayInfo.elapsed} / 90</span>
                <span className="text-slate-500">{dayInfo.remaining} days remaining</span>
              </>
            )}
            {saveStatus && <span className={saveStatus.cls}>{saveStatus.text}</span>}
            <span className="text-emerald-400 ml-auto">{momentum}% weekly momentum</span>
            <button onClick={() => exportProgress({ startDate, checked, checkedAt })} className="text-slate-400 hover:text-slate-200 underline underline-offset-2">Export</button>
            <button onClick={() => exportCsv({ checked, checkedAt, itemsById })} className="text-slate-400 hover:text-slate-200 underline underline-offset-2">CSV</button>
            <label className="text-slate-400 hover:text-slate-200 underline underline-offset-2 cursor-pointer">
              Import
              <input type="file" accept="application/json" onChange={onImport} className="hidden" />
            </label>
          </div>
          {importError && <p className="mt-1 text-xs text-red-400 font-mono">{importError}</p>}
        </div>

        {/* DEPLOYMENT ROUTE */}
        <div className="max-w-4xl mx-auto px-5 pb-5 overflow-x-auto">
          <div className="flex items-center min-w-[600px]">
            {ALL_PHASES.map((phase, idx) => {
              const pct = phasePct(phase);
              const complete = pct === 100;
              const isOpen = openPhase === phase.id;
              return (
                <React.Fragment key={phase.id}>
                  <button onClick={() => scrollTo(phase.id)} className="flex flex-col items-center gap-2 group flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold transition-colors
                      ${complete ? "bg-amber-500 border-amber-500 text-slate-950" : isOpen ? "border-cyan-400 text-cyan-400" : "border-slate-700 text-slate-500 group-hover:border-slate-500"}`}>
                      {phase.code}
                    </div>
                    <span className={`text-[10px] uppercase tracking-wide w-20 text-center ${isOpen ? "text-cyan-400" : "text-slate-500"}`}>{phase.title}</span>
                  </button>
                  {idx < ALL_PHASES.length - 1 && (
                    <div className={`flex-1 h-px mb-6 ${phasePct(ALL_PHASES[idx]) === 100 ? "bg-amber-500" : "bg-slate-800"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOCUS + INSIGHTS + HEATMAP */}
      <div id="main" className="max-w-4xl mx-auto px-5 pt-8 space-y-6">
        <FocusView PHASES={PHASES} BONUS={BONUS} checked={checked} startDate={startDate} onToggle={toggle} onJump={scrollTo} />

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-500 font-mono">Weekly goal:</span>
          <input
            type="number"
            min="1"
            max="7"
            value={weeklyGoal}
            onChange={(e) => {
              const v = Math.max(1, Math.min(7, Number(e.target.value) || 1));
              setWeeklyGoal(v);
              try { localStorage.setItem("fde-tracker-goal", String(v)); } catch {}
            }}
            className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-100"
            aria-label="Weekly active-day goal"
          />
          <span className="text-xs text-slate-500">active days / week</span>
          <span className={`text-xs font-mono ${goalReached ? "text-emerald-400" : "text-amber-400"}`}>
            {weeklyActive}/{weeklyGoal} {goalReached ? "✓" : ""}
          </span>
          {notifySupported && (
            <button
              onClick={async () => {
                const ok = await enableNotify();
                notify(ok ? "Reminders enabled" : "Notifications blocked by browser", { kind: ok ? "info" : "error" });
              }}
              className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-300 hover:border-slate-500"
            >
              {notifyEnabled ? "Reminders on" : "Enable reminders"}
            </button>
          )}
        </div>

        <Insights
          coreDone={coreDone}
          coreTotal={coreTotal}
          dsaDone={dsaDone}
          dsaTotal={dsaTotal}
          bonusDone={bonusDone}
          bonusTotal={bonusTotal}
          daySet={daySet}
          dayInfo={dayInfo}
          xp={xp}
          lvl={lvl}
          startDate={startDate}
        />

        <ActivityHeatmap columns={heatmap} streak={streak} longest={longest} onShare={() => setShowShare(true)} />
        <React.Suspense fallback={null}>
          <SharePanelLazy
            open={showShare}
            onClose={() => setShowShare(false)}
            user={user}
            checked={checked}
            checkedAt={checkedAt}
            corePct={corePct}
            dsaPct={dsaPct}
            xp={xp}
          />
        </React.Suspense>
      </div>

      {/* PARALLEL TRACK */}
      <div className="max-w-4xl mx-auto px-5 pt-8">
        <div className="bg-slate-900/60 border border-cyan-900/50 rounded-lg p-4">
          <div className="flex items-baseline justify-between mb-1">
            <div>
              <p className="font-mono text-xs text-cyan-400 tracking-widest uppercase">Parallel Ops</p>
              <h2 className="text-lg font-bold text-slate-50">{PARALLEL_TRACK.title}</h2>
            </div>
            <div className="font-mono text-lg text-cyan-400 tabular-nums">{dsaPct}%</div>
          </div>
          <p className="text-xs text-slate-500 mb-4">{PARALLEL_TRACK.note}</p>
          <ul className="space-y-2">
            {PARALLEL_TRACK.items.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <button
                  onClick={() => toggle(item.id)}
                  aria-label={checked[item.id] ? `Uncheck ${item.text}` : `Check ${item.text}`}
                  aria-pressed={checked[item.id] || false}
                  className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors
                    ${checked[item.id] ? "bg-cyan-500 border-cyan-500" : "border-slate-600 hover:border-slate-400"}`}
                >
                  {checked[item.id] && (
                    <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-slate-950"><path d="M4.5 8.5L2 6l-1 1 3.5 3.5L11 3l-1-1z" /></svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${checked[item.id] ? "text-slate-500 line-through" : "text-slate-200"}`}>{item.text}</p>
                  {item.resource && (
                    <a href={item.resource.url} target="_blank" rel="noopener noreferrer"
                      className="inline-block mt-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                      {item.resource.label} →
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* PHASE SECTIONS */}
      <div className="max-w-4xl mx-auto px-5 py-8 space-y-14">
        {ALL_PHASES.map((phase) => (
          <section key={phase.id} ref={(el) => (refs.current[phase.id] = el)} data-testid="phase-section" data-phase-id={phase.id}>
            <div className="flex items-baseline justify-between border-b border-slate-800 pb-3 mb-6">
              <div>
                <p className="font-mono text-xs text-amber-400 tracking-widest">{phase.code}</p>
                <h2 className="text-xl font-bold text-slate-50">{phase.title}</h2>
                <p className="text-xs text-slate-500 mt-1">{phase.sub}</p>
              </div>
              <div className="font-mono text-lg text-slate-400 tabular-nums">{phasePct(phase)}%</div>
            </div>
            <div className="space-y-6">
              {phase.weeks.map((w) => (
                <div key={String(phase.id) + w.week} className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-xs bg-slate-800 text-cyan-400 px-2 py-0.5 rounded">WEEK {w.week}</span>
                    <h3 className="text-sm font-semibold text-slate-200">{w.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {w.items.map((item) => (
                      <li key={item.id} className="flex items-start gap-3">
                        <button
                          onClick={() => toggle(item.id)}
                          aria-label={checked[item.id] ? `Uncheck ${item.text}` : `Check ${item.text}`}
                          aria-pressed={checked[item.id] || false}
                          className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors
                            ${checked[item.id] ? "bg-amber-500 border-amber-500" : "border-slate-600 hover:border-slate-400"}`}
                        >
                          {checked[item.id] && (
                            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-slate-950"><path d="M4.5 8.5L2 6l-1 1 3.5 3.5L11 3l-1-1z" /></svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${checked[item.id] ? "text-slate-500 line-through" : "text-slate-200"}`}>{item.text}</p>
                          {item.resource && (
                            <a href={item.resource.url} target="_blank" rel="noopener noreferrer"
                              className="inline-block mt-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                              {item.resource.label} →
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* onboarding nudge if no mission start set */}
        {!startDate && (
          <div className="bg-amber-500/10 border border-amber-600/40 rounded-lg p-4 text-center">
            <p className="text-sm text-amber-300">Set your <span className="font-mono">MISSION START</span> date above to track your 90-day countdown and daily streak.</p>
          </div>
        )}

        <div className="text-center text-xs text-slate-600 font-mono pt-6 border-t border-slate-800">
          {coreDone}/{coreTotal} core · {dsaDone}/{dsaTotal} DSA · {bonusDone}/{bonusTotal} staff · LVL {lvl.level} · {xp} XP · press ⌘K to jump to any item
        </div>
      </div>
    </div>
  );
}
