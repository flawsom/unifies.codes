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
      <div className="raw-card-sm p-4 text-center animate-fade-in">
        <p className="text-sm text-warn font-mono">
          Set your <span className="font-bold">MISSION START</span> date to unlock your daily focus plan.
        </p>
      </div>
    );
  }

  const start = new Date(startDate);
  const now = new Date();
  const planDay = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1);
  if (planDay > 90) {
    return (
      <div className="raw-card-sm p-4 text-center animate-fade-in">
        <p className="text-sm text-success font-mono">🎉 You've completed the 90-day route. Keep the streak alive and tackle the Beyond-Day-90 track!</p>
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
    <section className="raw-card p-4 sm:p-5 animate-fade-in" aria-label="Daily focus">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="min-w-0">
          <p className="raw-label text-warn tracking-widest">Day {planDay} of 90</p>
          <h2 className="raw-h text-h2 mt-0.5 truncate">{phase.title} · Week {week.week}</h2>
          <p className="text-xs text-muted">{week.title}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-lg text-fg tabular-nums">
            {week.items.length - unchecked.length}/{week.items.length}
          </div>
          <div className="raw-tag">done this week</div>
        </div>
      </div>

      {suggested ? (
        <button
          onClick={() => onToggle(suggested.id)}
          className="raw-card-sm w-full text-left p-3 hover:shadow-hard transition-shadow"
        >
          <span className="raw-label text-warn">Suggested next</span>
          <div className="text-sm text-fg mt-1">{suggested.text}</div>
          {suggested.resource && (
            <span className="text-xs font-mono text-accent underline underline-offset-2">
              {suggested.resource.label} →
            </span>
          )}
        </button>
      ) : (
        <p className="text-sm text-success font-mono">✅ Week complete — jump to the next phase or push the DSA parallel track.</p>
      )}

      <ul className="mt-4 space-y-1.5">
        {week.items.map((item) => (
          <li key={item.id} className="flex items-center gap-2.5 text-sm">
            <button
              onClick={() => onToggle(item.id)}
              aria-pressed={checked[item.id] || false}
              className="raw-check"
              aria-label={checked[item.id] ? `Uncheck ${item.text}` : `Check ${item.text}`}
            />
            <span className={checked[item.id] ? "text-faint line-through" : "text-fg"}>{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
