import { momentumPercent } from "../utils/progressStats";

function Bar({ label, value, total, colorClass }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="raw-label">{label}</span>
        <span className="font-mono text-xs text-fg tabular-nums">{value}/{total}</span>
      </div>
      <div className="h-2.5 bg-line/20 overflow-hidden">
        <div className={`h-full transition-all duration-300 ${colorClass}`} style={{ width: `${pct}%` }} />
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
  tracks,
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

  // Domain-derived track bars (passed in from App). Only render non-empty tracks
  // so a Mathematics syllabus never shows a hardcoded "DSA parallel" bar.
  const visibleTracks =
    Array.isArray(tracks) && tracks.length
      ? tracks.filter((t) => (t.total || 0) > 0)
      : [
          { label: "Core route", value: coreDone, total: coreTotal, colorClass: "bg-accent" },
          { label: "DSA parallel", value: dsaDone, total: dsaTotal, colorClass: "bg-success" },
          { label: "Staff-level", value: bonusDone, total: bonusTotal, colorClass: "bg-warn" },
        ].filter((t) => t.total > 0);

  const overall = visibleTracks.length
    ? Math.round(
        visibleTracks.reduce((a, t) => a + (t.value || 0), 0) /
          visibleTracks.reduce((a, t) => a + (t.total || 0), 0) *
          100
      )
    : 0;

  return (
    <section className="raw-card p-4 sm:p-5 space-y-5 animate-fade-in" aria-label="Insights">
      <h2 className="raw-h text-h3 uppercase tracking-tight">Insights</h2>

      {visibleTracks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {visibleTracks.map((t) => (
            <Bar
              key={t.label}
              label={t.label}
              value={t.value || 0}
              total={t.total || 0}
              colorClass={t.colorClass || "bg-accent"}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="raw-label">Overall completion</span>
            <span className="font-mono text-xs text-fg tabular-nums">{overall}%</span>
          </div>
          <div className="h-2.5 bg-line/20 overflow-hidden">
            <div className="h-full bg-success transition-all duration-300" style={{ width: `${overall}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="raw-label">90-day pace</span>
            <span className="font-mono text-xs text-fg tabular-nums">{pace}%</span>
          </div>
          <div className="h-2.5 bg-line/20 overflow-hidden">
            <div className="h-full bg-accent transition-all duration-300" style={{ width: `${pace}%` }} />
          </div>
        </div>
      </div>

      {/* 14-day activity sparkline */}
      <div>
        <div className="raw-label mb-2">Last 14 days</div>
        <div className="flex items-end gap-1 h-12">
          {last14.map((v, i) => (
            <div
              key={i}
              className={`flex-1 transition-colors ${v ? "bg-success" : "bg-line/20"}`}
              style={{ height: v ? "100%" : "20%" }}
              title={v ? "active" : "rest"}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-6 font-mono">
        <div>
          <div className="raw-stat text-2xl">{lvl.level}</div>
          <div className="raw-tag mt-1">level</div>
        </div>
        <div>
          <div className="raw-stat text-2xl">{xp}</div>
          <div className="raw-tag mt-1">xp</div>
        </div>
        <div>
          <div className="raw-stat text-2xl">{momentum}%</div>
          <div className="raw-tag mt-1">weekly momentum</div>
        </div>
      </div>
    </section>
  );
}
