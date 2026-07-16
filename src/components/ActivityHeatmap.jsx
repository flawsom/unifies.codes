// GitHub-style activity heatmap + streak counter.
// `columns` is an array of week-columns, each an array of { date, count } cells
// (produced by buildHeatmap() in utils/progressStats). `streak` / `longest` are
// real consecutive-day counts derived from checkedAt timestamps.
import React, { useState } from "react";

const LEVELS = [
  "bg-slate-900 border-slate-800", // 0
  "bg-emerald-900 border-emerald-800", // 1
  "bg-emerald-700 border-emerald-600", // 2
  "bg-emerald-500 border-emerald-400", // 3
  "bg-emerald-400 border-emerald-300", // 4+
];

function level(count) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export default function ActivityHeatmap({ columns, streak, longest, onShare, readOnly = false }) {
  const [hover, setHover] = useState(null);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="font-mono text-3xl font-bold text-emerald-400 tabular-nums">{streak}</div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">day streak</div>
          </div>
          <div>
            <div className="font-mono text-3xl font-bold text-slate-200 tabular-nums">{longest}</div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">longest streak</div>
          </div>
        </div>
        {!readOnly && onShare && (
          <button
            onClick={onShare}
            className="text-xs font-mono px-3 py-1.5 rounded border border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-slate-950 transition-colors"
          >
            Share progress ↗
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-[640px]">
          {/* month labels */}
          <div className="flex gap-[3px] pl-7">
            {columns.map((col, i) => {
              const first = col[0];
              const d = new Date(first.date + "T00:00:00");
              const prev = i > 0 ? new Date(columns[i - 1][0].date + "T00:00:00") : null;
              const showMonth =
                i === 0 || (prev && d.getMonth() !== prev.getMonth());
              return (
                <div key={i} className="w-[11px] text-[9px] text-slate-600 font-mono">
                  {showMonth ? MONTHS[d.getMonth()] : ""}
                </div>
              );
            })}
          </div>

          <div className="flex gap-[3px]">
            {/* day-of-week labels */}
            <div className="flex flex-col gap-[3px] w-6 mr-1">
              {DAY_LABELS.map((l, i) => (
                <div key={i} className="h-[11px] text-[9px] text-slate-600 font-mono leading-[11px]">
                  {l}
                </div>
              ))}
            </div>

            {columns.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((cell) => (
                  <div
                    key={cell.date}
                    className={`w-[11px] h-[11px] rounded-[2px] border ${LEVELS[level(cell.count)]} hover:ring-1 hover:ring-amber-400 transition`}
                    onMouseEnter={() => setHover(cell)}
                    onMouseLeave={() => setHover(null)}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* legend + tooltip */}
          <div className="flex items-center justify-between mt-1 pl-7 font-mono text-[10px] text-slate-600">
            <span className="h-4">
              {hover
                ? `${hover.count} item${hover.count === 1 ? "" : "s"} on ${hover.date}`
                : "Less"}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-[11px] h-[11px] rounded-[2px] border bg-slate-900 border-slate-800" />
              <span className="w-[11px] h-[11px] rounded-[2px] border bg-emerald-900 border-emerald-800" />
              <span className="w-[11px] h-[11px] rounded-[2px] border bg-emerald-700 border-emerald-600" />
              <span className="w-[11px] h-[11px] rounded-[2px] border bg-emerald-500 border-emerald-400" />
              <span className="w-[11px] h-[11px] rounded-[2px] border bg-emerald-400 border-emerald-300" />
              <span className="ml-1">More</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
