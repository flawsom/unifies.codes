// Focus view ("Today"): a daily digest derived from the mission-start date.
// Shows where you are in the 90-day plan, the current week's items, and a
// suggested next unchecked item. Pure live-data computation.
import React from "react";

// Map a 1-based plan day to the phase + week index in the curriculum.
function locate(planDay, PHASES) {
  // Each phase is 3 weeks except the last (p5) which is 1 week.
  const plan = [
    { phase: 0, weeks: 3 },
    { phase: 1, weeks: 3 },
    { phase: 2, weeks: 3 },
    { phase: 3, weeks: 3 },
    { phase: 4, weeks: 1 },
  ];
  let day = planDay;
  for (const p of plan) {
    if (day <= p.weeks * 7) {
      const weekInPhase = Math.ceil(day / 7);
      return { phaseIndex: p.phase, weekIndex: weekInPhase - 1 };
    }
    day -= p.weeks * 7;
  }
  return { phaseIndex: PHASES.length - 1, weekIndex: 0 };
}

export default function FocusView({ PHASES, BONUS, checked, startDate, onToggle, onJump }) {
  if (!startDate) {
    return (
      <div className="bg-slate-900/60 border border-amber-700/40 rounded-lg p-4 text-center">
        <p className="text-sm text-amber-300">
          Set your <span className="font-mono">MISSION START</span> date to unlock your daily focus plan.
        </p>
      </div>
    );
  }

  const start = new Date(startDate);
  const now = new Date();
  const planDay = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1);
  if (planDay > 90) {
    return (
      <div className="bg-slate-900/60 border border-emerald-700/40 rounded-lg p-4 text-center">
        <p className="text-sm text-emerald-300">🎉 You've completed the 90-day route. Keep the streak alive and tackle the Beyond-Day-90 track!</p>
      </div>
    );
  }

  const allPhases = [...PHASES, BONUS];
  const { phaseIndex, weekIndex } = locate(planDay, PHASES);
  const phase = allPhases[phaseIndex];
  const week = phase?.weeks[Math.min(weekIndex, phase.weeks.length - 1)];
  if (!week) return null;

  const unchecked = week.items.filter((i) => !checked[i.id]);
  const suggested = unchecked[0];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p className="font-mono text-xs text-amber-400 tracking-widest uppercase">Day {planDay} of 90</p>
          <h2 className="text-lg font-bold text-slate-50">
            {phase.title} · Week {week.week}
          </h2>
          <p className="text-xs text-slate-500">{week.title}</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg text-cyan-400">
            {week.items.length - unchecked.length}/{week.items.length}
          </div>
          <div className="text-[11px] uppercase text-slate-500">done this week</div>
        </div>
      </div>

      {suggested ? (
        <button
          onClick={() => onToggle(suggested.id)}
          className="w-full text-left bg-amber-500/10 border border-amber-600/40 rounded p-3 hover:bg-amber-500/20 transition"
        >
          <span className="text-[11px] uppercase text-amber-400 font-mono">Suggested next</span>
          <div className="text-sm text-slate-100 mt-1">{suggested.text}</div>
          {suggested.resource && (
            <span className="text-xs font-mono text-cyan-400 underline underline-offset-2">
              {suggested.resource.label} →
            </span>
          )}
        </button>
      ) : (
        <p className="text-sm text-emerald-300">✅ Week complete — jump to the next phase or push the DSA parallel track.</p>
      )}

      <ul className="mt-3 space-y-1">
        {week.items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            <button
              onClick={() => onToggle(item.id)}
              aria-pressed={checked[item.id] || false}
              className={`w-3.5 h-3.5 rounded-sm flex-shrink-0 ${checked[item.id] ? "bg-amber-500" : "border border-slate-600 hover:border-slate-400"}`}
              aria-label={checked[item.id] ? `Uncheck ${item.text}` : `Check ${item.text}`}
            />
            <span className={checked[item.id] ? "text-slate-500 line-through" : "text-slate-300"}>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
