// Insights dashboard: deep analytics over the user's real progress.
// Pure presentation — all numbers come from props (live data only).
import React from "react";
import { momentumPercent } from "../utils/progressStats";

function Bar({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-slate-300">{value}/{total}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Insights({
  coreDone,
  coreTotal,
  dsaDone,
  dsaTotal,
  bonusDone,
  bonusTotal,
  daySet,
  dayInfo,
  xp,
  lvl,
  startDate,
}) {
  const momentum = momentumPercent(daySet);
  const last14 = (() => {
    const days = Array.from(daySet).sort().slice(-14);
    const out = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      out.push(daySet.has(key) ? 1 : 0);
    }
    return out;
  })();

  const pace = dayInfo
    ? Math.min(100, Math.round((dayInfo.elapsed / 90) * 100))
    : 0;
  const overall = Math.round(
    ((coreDone + dsaDone + bonusDone) / (coreTotal + dsaTotal + bonusTotal)) * 100
  );

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-5">
      <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Insights</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Bar label="Core route" value={coreDone} total={coreTotal} color="#f59e0b" />
        <Bar label="DSA parallel" value={dsaDone} total={dsaTotal} color="#22d3ee" />
        <Bar label="Staff-level" value={bonusDone} total={bonusTotal} color="#a78bfa" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Overall completion</span>
            <span className="font-mono text-slate-300">{overall}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${overall}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">90-day pace</span>
            <span className="font-mono text-slate-300">{pace}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-fuchsia-500" style={{ width: `${pace}%` }} />
          </div>
        </div>
      </div>

      {/* 14-day activity sparkline */}
      <div>
        <div className="text-xs text-slate-400 mb-2">Last 14 days</div>
        <div className="flex items-end gap-1 h-12">
          {last14.map((v, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm ${v ? "bg-emerald-500" : "bg-slate-800"}`}
              style={{ height: v ? "100%" : "20%" }}
              title={v ? "active" : "rest"}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-6 font-mono text-sm">
        <div>
          <div className="text-2xl font-bold text-fuchsia-400">{lvl.level}</div>
          <div className="text-[11px] uppercase text-slate-500">level</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-200">{xp}</div>
          <div className="text-[11px] uppercase text-slate-500">xp</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-emerald-400">{momentum}%</div>
          <div className="text-[11px] uppercase text-slate-500">weekly momentum</div>
        </div>
      </div>
    </div>
  );
}
