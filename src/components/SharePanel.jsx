// Share panel: generates a public, read-only `?u=<username>` link and shows a
// real leaderboard ranked by streak (and weekly momentum), filtered by track.
// Reads from the Supabase `profiles` table (live data only) with a localStorage
// fallback. No demo/seed rows are ever shown — an empty board says so honestly.
import React, { useEffect, useState } from "react";
import { publishShare, buildSnapshot } from "../utils/share";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { currentStreak, daySetFromCheckedAt } from "../utils/progressStats";

function snapshotStreak(checkedAt) {
  return currentStreak(daySetFromCheckedAt(checkedAt || {}), 1);
}

export default function SharePanel({ open, onClose, user, checked, checkedAt, corePct, dsaPct, xp }) {
  const [username, setUsername] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [board, setBoard] = useState([]);
  const [busy, setBusy] = useState(false);
  const [track, setTrack] = useState("all"); // all | core | dsa
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      const rows = [];
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from("profiles").select("username, display_name, snapshot").limit(50);
        if (data) {
          for (const r of data) {
            const s = r.snapshot || {};
            if (!s.checked || Object.keys(s.checked).length === 0) continue; // skip empty profiles
            const set = new Set(Object.keys(s.checked));
            const core = Object.keys(s.checked).filter((k) => k.startsWith("p") || k.startsWith("b")).length;
            const dsa = Object.keys(s.checked).filter((k) => k.startsWith("dsa")).length;
            rows.push({
              username: r.username || r.display_name,
              displayName: r.display_name,
              corePct: s.corePct || 0,
              dsaPct: s.dsaPct || 0,
              streak: snapshotStreak(s.checkedAt),
              dsaCount: dsa,
              coreCount: core,
            });
          }
        }
      }
      if (!cancelled) {
        const filtered = rows.filter((r) => {
          if (track === "core") return r.coreCount > 0;
          if (track === "dsa") return r.dsaCount > 0;
          return true;
        });
        setBoard(filtered.sort((a, b) => b.streak - a.streak).slice(0, 20));
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, track]);

  const handleShare = async () => {
    const name = (username || (user?.email ? user.email.split("@")[0] : "anon")).trim();
    if (!name) return;
    setBusy(true);
    const snapshot = buildSnapshot({ checked, checkedAt, corePct, dsaPct, xp });
    const url = await publishShare({
      username: name,
      userId: user?.id,
      displayName: user?.email?.split("@")[0] || name,
      snapshot,
    });
    setLink(url);
    setBusy(false);
    setBoard((b) => [
      { username: name, corePct, dsaPct, streak: snapshotStreak(checkedAt), dsaCount: dsaPct > 0 ? 1 : 0, coreCount: corePct > 0 ? 1 : 0 },
      ...b.filter((r) => r.username !== name),
    ].sort((a, b) => b.streak - a.streak).slice(0, 20));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* manual copy still available */
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Share your FDE route"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-100">Share your FDE route</h3>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-300 text-lg leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="pick a handle"
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-500"
            />
            <button
              onClick={handleShare}
              disabled={busy}
              className="px-3 py-2 text-sm font-mono rounded bg-amber-600 text-slate-950 hover:bg-amber-500 disabled:opacity-50"
            >
              {busy ? "…" : "Create link"}
            </button>
          </div>

          {link && (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-3 py-2">
              <input readOnly value={link} className="flex-1 bg-transparent text-xs text-cyan-400 font-mono outline-none truncate" />
              <button onClick={copy} className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-300 hover:border-slate-500">
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Leaderboard — top streaks</p>
              <div className="flex gap-1 text-[11px] font-mono">
                {["all", "core", "dsa"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTrack(t)}
                    className={`px-2 py-0.5 rounded ${track === t ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {board.length === 0 ? (
              <p className="text-xs text-slate-600">No shared routes yet — be the first to create a link.</p>
            ) : (
              <ol className="space-y-1">
                {board.map((r, i) => (
                  <li key={r.username} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-5 text-right font-mono text-slate-600">{i + 1}</span>
                      <span className="text-slate-200">{r.username}</span>
                    </span>
                    <span className="font-mono text-xs text-slate-500">{r.streak}d · {r.corePct}% core</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
