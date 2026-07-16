// components/RevisionView.jsx
// Revision mode: walk through what you haven't done yet. If you already know an
// item, you may voluntarily skip it — but only with a clear caution disclaimer,
// because skipped items leave your tracker and can't be tested or counted.
import React, { useState, useMemo } from "react";

export default function RevisionView({ items, checked, skipped, onSkip, onRestore, onClose }) {
  const [confirmItem, setConfirmItem] = useState(null); // item pending skip confirmation

  const remaining = useMemo(
    () => items.filter((i) => !checked[i.id] && !skipped[i.id]),
    [items, checked, skipped]
  );
  const skippedList = useMemo(
    () => items.filter((i) => skipped[i.id]),
    [items, skipped]
  );

  return (
    <div className="card mt-6" data-testid="revision-view">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-h3">Revision &amp; skip</h2>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="text-sm mt-2">
        Go through what you haven't checked off. Confident you've already mastered
        something? You can skip it — but read the caution first.
      </p>

      {remaining.length === 0 ? (
        <p className="helper mt-4">Nothing left to revise — nice work.</p>
      ) : (
        <ul className="mt-4">
          {remaining.map((it) => (
            <li key={it.id} className="list-row" data-testid="revision-item">
              <span className="pr-4">{it.text}</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmItem(it)}
                data-testid={`skip-${it.id}`}
              >
                I know this — skip
              </button>
            </li>
          ))}
        </ul>
      )}

      {skippedList.length > 0 && (
        <div className="mt-6 border-t-[3px] border-black pt-4">
          <h3 className="font-display text-sm uppercase">Skipped (you said you know these)</h3>
          <ul className="mt-2">
            {skippedList.map((it) => (
              <li key={it.id} className="list-row">
                <span className="pr-4 line-through decoration-2">{it.text}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => onRestore && onRestore(it.id)}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirmItem && (
        <div
          className="fixed inset-0 bg-white/90 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm skip"
          data-testid="skip-confirm"
        >
          <div className="card card-elevated max-w-md">
            <h3 className="font-display text-h3">Caution before you skip</h3>
            <p className="text-sm mt-3">
              You're about to skip <strong>{confirmItem.text}</strong>.
            </p>
            <ul className="text-sm mt-3 list-disc list-inside space-y-1">
              <li>Skipped items leave your active tracker and your streak.</li>
              <li>They are <strong>not</strong> counted toward completion.</li>
              <li>You won't be prompted to practise or test them.</li>
              <li>Only skip if you're genuinely confident you've mastered it.</li>
            </ul>
            <p className="text-sm mt-3">
              If you're unsure, just leave it — checking it later is always better
              than skipping something you half-know.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                className="btn btn-destructive btn-md"
                onClick={() => {
                  onSkip && onSkip(confirmItem.id);
                  setConfirmItem(null);
                }}
                data-testid="confirm-skip"
              >
                Skip it anyway
              </button>
              <button
                className="btn btn-secondary btn-md"
                onClick={() => setConfirmItem(null)}
              >
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
