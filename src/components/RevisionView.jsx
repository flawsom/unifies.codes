import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

function CautionBox({ onAcknowledge, acknowledged, setAcknowledged }) {
  if (acknowledged) return null;
  return (
    <div className="alert-warn mb-4">
      <p className="text-sm">
        <strong>Caution before you skip.</strong> Skipping marks an item as done
        without proof. If it shows up later in an interview or on the job, you
        won't have the reps. Only skip what you could teach or build cold right
        now.
      </p>
      <button className="btn-sm mt-3" onClick={onAcknowledge}>
        I understand — show skip buttons
      </button>
    </div>
  );
}

export default function RevisionView({
  items,
  onSkip,
  onRevision,
  onClose,
}) {
  const { user } = useAuth();
  const [confirmId, setConfirmId] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);

  // Group items by phase, preserving source order.
  const groups = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const key = it.phaseTitle || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    return Array.from(map.entries());
  }, [items]);

  const confirmItem = items.find((i) => i.id === confirmId);

  return (
    <div className="revision-modal" role="dialog" aria-modal="true">
      <div className="revision-modal__card">
        <div className="revision-modal__head">
          <div>
            <h2 className="text-xl font-bold">Revision &amp; skip</h2>
            <p className="text-sm text-muted mt-1">
              Go through what you haven't checked off. Confident you've already
              mastered something? Skip it — but read the caution first.
            </p>
          </div>
          <button className="btn-sm" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        {!user && (
          <p className="alert-info mt-3 text-sm">
            Sign in with Google to keep your skips &amp; revisions synced across
            devices.
          </p>
        )}

        <CautionBox
          acknowledged={acknowledged}
          setAcknowledged={setAcknowledged}
          onAcknowledge={() => setAcknowledged(true)}
        />

        <div className="revision-modal__body mt-2">
          {groups.length === 0 && (
            <p className="text-muted text-sm py-6 text-center">
              Nothing left to revise — every active item is checked or skipped. 🎉
            </p>
          )}

          {groups.map(([phase, groupItems]) => (
            <section key={phase} className="revision-group">
              <h3 className="revision-group__title">{phase}</h3>
              <ul className="revision-list">
                {groupItems.map((it) => (
                  <li
                    key={it.id}
                    className="revision-row"
                    data-testid="revision-item"
                  >
                    <button
                      className="revision-row__label"
                      onClick={() => onRevision(it.id)}
                      title="Mark as revised"
                    >
                      <span className="pr-4">{it.text}</span>
                    </button>

                    {confirmId === it.id ? (
                      <span className="revision-row__confirm">
                        <span className="text-sm text-muted">
                          Skip <strong>{it.text}</strong>?
                        </span>
                        <button
                          className="btn-danger-sm"
                          onClick={() => {
                            onSkip(it.id);
                            setConfirmId(null);
                          }}
                        >
                          Yes, skip
                        </button>
                        <button
                          className="btn-sm"
                          onClick={() => setConfirmId(null)}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : acknowledged ? (
                      <button
                        className="btn-sm revision-row__skip"
                        onClick={() => setConfirmId(it.id)}
                      >
                        I know this — skip
                      </button>
                    ) : (
                      <span className="revision-row__skip revision-row__skip--locked text-faint text-sm">
                        skip locked
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="revision-modal__foot mt-4 text-sm text-muted">
          Tip: click an item name to log a revision without skipping it.
        </div>
      </div>
    </div>
  );
}
