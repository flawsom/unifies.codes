import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabaseClient";
import { useAuth } from "./context/AuthContext";
import AccountBar from "./components/AccountBar";
import GuestBanner from "./components/GuestBanner";
import { DEFAULT_PHASES, DEFAULT_BONUS, DEFAULT_PARALLEL_TRACK, DEFAULT_CURRICULUM, DEFAULT_ALL_ITEMS, SAMPLE_CURRICULA } from "./data/curriculum";
import { analyzeCurriculum, planToCurriculum } from "./utils/analyze";
import CurriculumImport from "./components/CurriculumImport";
import RevisionView from "./components/RevisionView";
import Highlights from "./components/Highlights";
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

const STORAGE_KEY = "unifies-progress-v1";
const STORAGE_AT_KEY = "unifies-checkedAt-v1";
const STORAGE_PLAN_KEY = "unifies-plan-v1";
const STORAGE_SKIP_KEY = "unifies-skipped-v1";

const ITEMS_BY_ID_DEFAULT = Object.fromEntries(DEFAULT_ALL_ITEMS.map((i) => [i.id, i]));

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
  const [hasPlan, setHasPlan] = useState(false); // has the user created/loaded a plan?
  const [showAdmin, setShowAdmin] = useState(false);
  const [skipped, setSkipped] = useState({}); // revision skips: id -> true
  const [checked, setChecked] = useState({});
  const [checkedAt, setCheckedAt] = useState({});
  const [showRevision, setShowRevision] = useState(false);

  // Derive the active item list from the (possibly user-built) curriculum.
  const allItems = useMemo(() => {
    const out = [];
    for (const ph of curriculum.phases || []) {
      for (const w of ph.weeks || []) {
        for (const it of w.items || []) {
          out.push({
            ...it,
            phaseId: ph.id,
            week: w.week ?? null,
            weekTitle: w.title || null,
            phaseTitle: ph.title,
          });
        }
      }
    }
    for (const it of curriculum.bonus?.weeks?.flatMap((w) => w.items || []) || []) {
      out.push({ ...it, phaseId: curriculum.bonus.id, phaseTitle: curriculum.bonus.title });
    }
    for (const it of curriculum.parallelTrack?.items || []) {
      out.push({ ...it, phaseId: curriculum.parallelTrack.id, phaseTitle: curriculum.parallelTrack.title });
    }
    return out;
  }, [curriculum]);

  const itemsById = useMemo(
    () => Object.fromEntries(allItems.map((i) => [i.id, i])),
    [allItems]
  );
  const activeItems = useMemo(
    () => allItems.filter((i) => !skipped[i.id] && !checked[i.id]),
    [allItems, skipped, checked]
  );
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
        const planRaw = localStorage.getItem(STORAGE_PLAN_KEY);
        const skipRaw = localStorage.getItem(STORAGE_SKIP_KEY);
        if (!cancelled) {
          setChecked(raw ? JSON.parse(raw).checked || {} : {});
          setStartDate(raw ? JSON.parse(raw).startDate || "" : "");
          setCheckedAt(rawAt ? JSON.parse(rawAt) : {});
          if (skipRaw) setSkipped(JSON.parse(skipRaw));
          if (planRaw) {
            try {
              setCurriculum(JSON.parse(planRaw));
              setHasPlan(true);
            } catch {
              /* ignore bad plan */
            }
          }
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
        .select("checked, checked_at, start_date, xp, curriculum_json, skipped")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (cancelled) return;
          if (!error && data) {
            applySnapshot(data.checked, data.checked_at, data.start_date);
            if (data.skipped) setSkipped(data.skipped || {});
            if (data.curriculum_json) {
              try {
                setCurriculum(data.curriculum_json);
                setHasPlan(true);
              } catch {
                /* ignore */
              }
            }
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
    const xp = totalXp(checked, activeItems);

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
            curriculum_json: hasPlan ? curriculum : null,
            skipped,
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
      if (hasPlan) localStorage.setItem(STORAGE_PLAN_KEY, JSON.stringify(curriculum));
      localStorage.setItem(STORAGE_SKIP_KEY, JSON.stringify(skipped));
      setSaveState("saved");
      setLastSavedAt(new Date());
    } catch (e) {
      setSaveState("error");
    }
  }, [checked, checkedAt, startDate, loaded, user, sharedUser]);

  // --- Unifies: plan handlers ---
  const handleUsePlan = useCallback(
    (curriculumObj) => {
      setCurriculum(curriculumObj);
      setHasPlan(true);
      setSkipped({});
      if (!startDate) {
        // anchor the plan to today so streaks/heatmap start now
        setStartDate(todayStr());
      }
    },
    [startDate]
  );

  const handleLoadSample = useCallback(
    (key) => {
      const sample = SAMPLE_CURRICULA[key];
      if (sample) {
        // build() returns the full {phases, bonus, parallelTrack} shape directly.
        setCurriculum(sample.build());
        setHasPlan(true);
        setSkipped({});
        if (!startDate) setStartDate(todayStr());
      }
    },
    [startDate]
  );

  // Return to the home / import screen, clearing any built plan.
  const handleReset = useCallback(() => {
    setHasPlan(false);
    setCurriculum(DEFAULT_CURRICULUM);
    setSkipped({});
    setShowRevision(false);
    try {
      localStorage.removeItem(STORAGE_PLAN_KEY);
      localStorage.removeItem(STORAGE_SKIP_KEY);
    } catch {}
    if (window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSkip = useCallback((id) => {
    setSkipped((s) => ({ ...s, [id]: true }));
  }, []);
  const handleRestore = useCallback((id) => {
    setSkipped((s) => {
      const n = { ...s };
      delete n[id];
      return n;
    });
  }, []);

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
            xp: totalXp(checked, activeItems),
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

  // Derived stats (generalized over the user's curriculum; skipped items excluded)
  const coreItems = useMemo(
    () => activeItems.filter((i) => i.track !== "dsa" && i.track !== "bonus"),
    [activeItems]
  );
  const dsaItems = useMemo(
    () => activeItems.filter((i) => i.track === "dsa"),
    [activeItems]
  );
  const bonusItems = useMemo(
    () => activeItems.filter((i) => i.track === "bonus"),
    [activeItems]
  );
  const coreIds = useMemo(() => new Set(coreItems.map((i) => i.id)), [coreItems]);
  const dsaIds = useMemo(() => new Set(dsaItems.map((i) => i.id)), [dsaItems]);
  const bonusIds = useMemo(() => new Set(bonusItems.map((i) => i.id)), [bonusItems]);

  const coreDone = Object.keys(checked).filter((k) => checked[k] && coreIds.has(k)).length;
  const coreTotal = coreIds.size;
  const corePct = coreTotal ? Math.round((coreDone / coreTotal) * 100) : 0;

  const bonusDone = Object.keys(checked).filter(
    (k) => checked[k] && bonusIds.has(k)
  ).length;
  const bonusTotal = bonusIds.size;

  const dsaDone = Object.keys(checked).filter((k) => checked[k] && dsaIds.has(k)).length;
  const dsaTotal = dsaIds.size;
  const dsaPct = dsaTotal ? Math.round((dsaDone / dsaTotal) * 100) : 0;

  const overallTotal = activeItems.length;
  const overallDone = Object.keys(checked).filter((k) => checked[k] && itemsById[k]).length;
  const overallPct = overallTotal ? Math.round((overallDone / overallTotal) * 100) : 0;

  const daySet = useMemo(() => daySetFromCheckedAt(checkedAt), [checkedAt]);
  const streak = useMemo(() => currentStreak(daySet, 1), [daySet]); // grace day
  const longest = useMemo(() => longestStreak(daySet), [daySet]);
  const momentum = useMemo(() => momentumPercent(daySet), [daySet]);
  const heatmap = useMemo(() => buildHeatmap(checkedAt), [checkedAt]);
  const xp = useMemo(() => totalXp(checked, activeItems), [checked, activeItems]);
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
    if (saveState === "offline") return { text: "Offline — changes saved locally, will sync", cls: "text-black" };
    if (saveState === "error") return { text: "Not saving — storage blocked", cls: "text-red-400" };
    if (saveState === "saved" && lastSavedAt)
      return { text: `Saved ✓ ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`, cls: "text-emerald-400" };
    return null;
  }, [saveState, lastSavedAt, sharedUser]);

  // ---- IMPORT GATE: no plan yet, and not viewing a shared profile ----
  if (!hasPlan && !sharedUser && loaded) {
    return (
      <CurriculumImport
        onUsePlan={handleUsePlan}
        onLoadSample={handleLoadSample}
        onHome={handleReset}
      />
    );
  }

  // ---- SHARED (read-only) view ----
  if (sharedUser) {
    const sCorePct = sharedUser.corePct || 0;
    const sDsaPct = sharedUser.dsaPct || 0;
    const sStreak = currentStreak(daySetFromCheckedAt(sharedUser.checkedAt || {}), 1);
    const sHeatmap = buildHeatmap(sharedUser.checkedAt || {});
    const myEnabled = !!(user || localStorage.getItem(STORAGE_KEY));
    return (
      <div className="min-h-screen bg-white text-black font-sans">
        <div className="max-w-4xl mx-auto px-5 py-10">
          <a href="/" className="inline-block mb-4 font-mono text-xs uppercase tracking-widest text-black hover:underline underline-offset-2">← Back to Unifies</a>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 border-[3px] border-black bg-black text-white font-bold flex items-center justify-center">
              {(sharedUser.username || sharedUser.displayName || "?").slice(0, 1).toUpperCase()}
            </span>
            <div>
              <h1 className="text-2xl font-display">{sharedUser.displayName || sharedUser.username}'s Unifies plan</h1>
              <p className="text-xs text-black font-mono uppercase tracking-widest">Read-only shared progress</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-6 font-mono text-sm">
            <span className="text-black">{sCorePct}% core</span>
            <span className="text-black">{sDsaPct}% DSA</span>
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
                <div className="text-black">{sCorePct} vs {sharedCompare.corePct}</div>
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
                        <span className={`mt-1 w-3 h-3 rounded-sm flex-shrink-0 ${sharedUser.checked?.[item.id] ? "bg-black" : "bg-slate-800"}`} />
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
    <div className="min-h-screen bg-white text-black font-sans">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[500] focus:bg-black focus:text-white focus:px-3 focus:py-1 focus:rounded">Skip to content</a>
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
      <div className="app-header border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 py-4 sm:py-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <button
              onClick={handleReset}
              className="text-left focus:outline-none focus:ring-2 focus:ring-black"
              title="Back to home — start a new curriculum"
              aria-label="Back to home"
            >
              <p className="font-mono text-xs tracking-[0.2em] text-black uppercase">Unifies</p>
              <h1 className="text-lg sm:text-2xl font-display tracking-tight text-black leading-tight">Your curriculum, intelligently tracked</h1>
            </button>
            <div className="flex items-center gap-3 sm:gap-5">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="theme-toggle"
                title="Toggle theme"
                aria-label="Toggle color theme"
              >
                {theme === "dark" ? "☀" : "☾"}
              </button>
              <AccountBar onOpenAdmin={() => setShowAdmin(true)} />
              <div className="text-right" title="Percentage of the 5-phase core route you've checked off">
                <div className="font-mono text-3xl font-bold text-black tabular-nums">{corePct}%</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">core route complete</div>
              </div>
            </div>
          </div>

          {/* progress bar */}
          <div className="mt-4 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="h-full bg-black transition-all duration-500" style={{ width: `${corePct}%` }} />
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
            <button onClick={handleReset} className="text-slate-400 hover:text-slate-200 underline underline-offset-2" title="Clear this plan and start a new curriculum">New</button>
            <label className="text-slate-400 hover:text-slate-200 underline underline-offset-2 cursor-pointer">
              Import
              <input type="file" accept="application/json" onChange={onImport} className="hidden" />
            </label>
            <button onClick={() => setShowRevision((v) => !v)} data-testid="revision-toggle" className="text-slate-400 hover:text-slate-200 underline underline-offset-2">
              Revision &amp; skip
            </button>
          </div>
          {importError && <p className="mt-1 text-xs text-red-400 font-mono">{importError}</p>}
        </div>

        {showRevision && (
          <RevisionView
            items={activeItems}
            checked={checked}
            skipped={skipped}
            onSkip={handleSkip}
            onRestore={handleRestore}
            onClose={() => setShowRevision(false)}
          />
        )}

        {/* DEPLOYMENT ROUTE */}
        <div className="max-w-6xl mx-auto px-5 pb-5 overflow-x-auto">
          <div className="flex items-center gap-x-1 min-w-[320px] mx-auto w-max">
            {ALL_PHASES.map((phase, idx) => {
              const pct = phasePct(phase);
              const complete = pct === 100;
              const isOpen = openPhase === phase.id;
              return (
                <React.Fragment key={phase.id}>
                  <button onClick={() => scrollTo(phase.id)} className="flex flex-col items-center gap-2 group flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold transition-colors
                      ${complete ? "bg-black border-black text-white" : isOpen ? "border-cyan-400 text-cyan-400" : "border-black text-slate-500 group-hover:border-slate-500"}`}>
                      {phase.code}
                    </div>
                    <span className={`text-[10px] uppercase tracking-wide w-20 text-center ${isOpen ? "text-cyan-400" : "text-slate-500"}`}>{phase.title}</span>
                  </button>
                  {idx < ALL_PHASES.length - 1 && (
                    <div className={`flex-1 h-px mt-5 ${phasePct(ALL_PHASES[idx]) === 100 ? "bg-black" : "bg-slate-800"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOCUS + INSIGHTS + HEATMAP */}
      {!user && (
        <GuestBanner />
      )}

      <div id="main" className="max-w-6xl mx-auto px-5 pt-8 space-y-6">
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
          <span className={`text-xs font-mono ${goalReached ? "text-emerald-400" : "text-black"}`}>
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

        <Highlights meta={curriculum._meta} />

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
      <div className="max-w-6xl mx-auto px-5 pt-8">
        <div className="raw-card p-4">
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
                    <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-white"><path d="M4.5 8.5L2 6l-1 1 3.5 3.5L11 3l-1-1z" /></svg>
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
      <div className="max-w-6xl mx-auto px-5 py-8 space-y-14">
        {ALL_PHASES.map((phase) => (
          <section key={phase.id} ref={(el) => (refs.current[phase.id] = el)} data-testid="phase-section" data-phase-id={phase.id}>
            <div className="flex items-baseline justify-between border-b border-slate-800 pb-3 mb-6">
              <div>
                <p className="font-mono text-xs text-black tracking-widest">{phase.code}</p>
                <h2 className="text-xl font-bold text-slate-50">{phase.title}</h2>
                <p className="text-xs text-slate-500 mt-1">{phase.sub}</p>
              </div>
              <div className="font-mono text-lg text-slate-400 tabular-nums">{phasePct(phase)}%</div>
            </div>
            <div className="space-y-6">
              {phase.weeks.map((w) => (
                <div key={String(phase.id) + w.week} className="raw-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-xs bg-slate-800 text-cyan-400 px-2 py-0.5 rounded">WEEK {w.week}</span>
                    <h3 className="text-sm font-semibold text-slate-200">{w.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {w.items.map((item) => (
                      <li key={item.id} className="flex items-start gap-3">
                        <button
                          onClick={() => toggle(item.id)}
                          data-testid={`check-${item.id}`}
                          aria-label={checked[item.id] ? `Uncheck ${item.text}` : `Check ${item.text}`}
                          aria-pressed={checked[item.id] || false}
                          className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors
                            ${checked[item.id] ? "bg-black border-black" : "border-slate-600 hover:border-slate-400"}`}
                        >
                          {checked[item.id] && (
                            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-white"><path d="M4.5 8.5L2 6l-1 1 3.5 3.5L11 3l-1-1z" /></svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${checked[item.id] ? "text-slate-500 line-through" : skipped[item.id] ? "text-slate-400 line-through decoration-2" : "text-slate-200"}`}>{item.text}{skipped[item.id] && <span className="ml-2 text-[10px] uppercase tracking-widest border border-slate-500 px-1">skipped</span>}</p>
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
          <div className="bg-black/10 border border-black rounded-lg p-4 text-center">
            <p className="text-sm text-black">Set your <span className="font-mono">MISSION START</span> date above to track your daily streak and momentum.</p>
          </div>
        )}

        <div className="text-center text-xs text-slate-600 font-mono pt-6 border-t border-slate-800">
          {coreDone}/{coreTotal} core · {dsaDone}/{dsaTotal} DSA · {bonusDone}/{bonusTotal} staff · LVL {lvl.level} · {xp} XP · press ⌘K to jump to any item
        </div>

        {/* FOOTER: social links */}
        <footer className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-center gap-3 text-xs">
          <a
            href="https://github.com/flawsom"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-colors"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" /></svg>
            GitHub
          </a>
          <a
            href="https://www.instagram.com/vibes.him"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.95c-3.15 0-3.53.01-4.77.07-.92.04-1.42.2-1.75.33-.44.17-.75.37-1.08.7-.33.33-.53.64-.7 1.08-.13.33-.29.83-.33 1.75C3.06 8.47 3.05 8.85 3.05 12s.01 3.53.07 4.77c.04.92.2 1.42.33 1.75.17.44.37.75.7 1.08.33.33.64.53 1.08.7.33.13.83.29 1.75.33 1.24.06 1.62.07 4.77.07s3.53-.01 4.77-.07c.92-.04 1.42-.2 1.75-.33.44-.17.75-.37 1.08-.7.33-.33.53-.64.7-1.08.13-.33.29-.83.33-1.75.06-1.24.07-1.62.07-4.77s-.01-3.53-.07-4.77c-.04-.92-.2-1.42-.33-1.75a2.9 2.9 0 0 0-.7-1.08 2.9 2.9 0 0 0-1.08-.7c-.33-.13-.83-.29-1.75-.33-1.24-.06-1.62-.07-4.77-.07zm0 3.32a4.57 4.57 0 1 1 0 9.14 4.57 4.57 0 0 1 0-9.14zm0 7.54a2.97 2.97 0 1 0 0-5.94 2.97 2.97 0 0 0 0 5.94zm5.83-7.78a1.07 1.07 0 1 1-2.14 0 1.07 1.07 0 0 1 2.14 0z" /></svg>
            Instagram
          </a>
        </footer>

        {/* MOBILE FAB — quick jump to any item (req: P2 #11). Hidden on >=sm. */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="fab raw-btn raw-btn-accent h-14 w-14 items-center justify-center"
          aria-label="Open quick jump"
          title="Jump to any item (⌘K)"
          data-testid="mobile-fab"
        >
          <span className="text-xl leading-none">⌘</span>
        </button>
      </div>
    </div>
  );
}
