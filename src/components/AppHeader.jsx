// AppHeader — the sticky top bar of the main dashboard.
// Contains navigation, progress overview, gamification stats, and tool buttons.
import { useMemo } from "react";
import ThemeToggle from "./ThemeToggle";
import AccountBar from "./AccountBar";
import { levelFromXp } from "../utils/progressStats";

export default function AppHeader({
  // onReset: navigates to home/landing (brand/title click)
  // onResetPlan: clears the current plan and starts fresh ("New" button)
  onReset,
  theme,
  onThemeChange,
  onOpenAdmin,
  corePct,
  xp,
  lvl,
  dayInfo,
  startDate,
  onStartDateChange,
  saveStatus,
  momentum,
  onExport,
  onExportCsv,
  onResetPlan,
  onImport,
  importError,
  onToggleRevision,
  showRevision,
}) {
  return (
    <div className="app-header border-b border-line sticky top-0 z-10 bg-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-5 py-4 sm:py-5">
        {/* Top row: brand + stats */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <button
            onClick={onReset}
            className="text-left focus:outline-none focus:ring-2 focus:ring-accent"
            title="Back to home — start a new curriculum"
            aria-label="Back to home"
          >
            <p className="font-mono text-xs tracking-[0.2em] text-fg uppercase">Unifies</p>
            <h1 className="text-lg sm:text-2xl font-display tracking-tight text-fg leading-tight">
              Your curriculum, intelligently tracked
            </h1>
          </button>
          <div className="flex items-center gap-3 sm:gap-5">
            <ThemeToggle theme={theme} onChange={onThemeChange} />
            <AccountBar onOpenAdmin={onOpenAdmin} />
            <div className="text-right" title="Percentage of the core route you've checked off">
              <div className="font-mono text-3xl font-bold text-fg tabular-nums">{corePct}%</div>
              <div className="text-xs text-muted uppercase tracking-wide">core route complete</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-line/20 overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${corePct}%` }}
          />
        </div>

        {/* Gamification bar */}
        <div className="mt-2 flex items-center gap-3 font-mono text-xs">
          <span className="text-accent font-bold">LVL {lvl.level}</span>
          <div className="flex-1 h-1.5 bg-line/20 overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${lvl.pct}%` }}
            />
          </div>
          <span className="text-muted">{xp} XP</span>
        </div>

        {/* Controls row */}
        <div className="mt-4 flex items-center gap-4 flex-wrap font-mono text-xs">
          <label className="flex items-center gap-2 text-muted">
            MISSION START:
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="bg-surface border border-line px-2 py-1 text-fg"
            />
          </label>
          {dayInfo && (
            <>
              <span className="text-accent font-semibold">DAY {dayInfo.elapsed} / 90</span>
              <span className="text-muted">{dayInfo.remaining} days remaining</span>
            </>
          )}
          {saveStatus && (
            <span className={saveStatus.cls}>{saveStatus.text}</span>
          )}
          <span className="text-success ml-auto font-semibold">{momentum}% weekly momentum</span>
          <button
            onClick={onExport}
            className="text-muted hover:text-fg underline underline-offset-2 transition-colors"
          >
            Export
          </button>
          <button
            onClick={onExportCsv}
            className="text-muted hover:text-fg underline underline-offset-2 transition-colors"
          >
            CSV
          </button>
          <button
            onClick={onResetPlan}
            className="text-muted hover:text-fg underline underline-offset-2 transition-colors"
            title="Clear this plan and start a new curriculum"
          >
            New
          </button>
          <label className="text-muted hover:text-fg underline underline-offset-2 cursor-pointer transition-colors">
            Import
            <input
              type="file"
              accept="application/json"
              onChange={onImport}
              className="hidden"
            />
          </label>
          <button
            onClick={() => onToggleRevision(!showRevision)}
            data-testid="revision-toggle"
            className={`underline underline-offset-2 transition-colors ${
              showRevision ? "text-accent" : "text-muted hover:text-fg"
            }`}
          >
            Revision &amp; skip
          </button>
        </div>

        {importError && (
          <p className="mt-1 text-xs text-danger font-mono">{importError}</p>
        )}
      </div>
    </div>
  );
}
