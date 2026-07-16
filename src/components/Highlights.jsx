// components/Highlights.jsx
// Shows what the user's curriculum already covered vs what Unifies added,
// plus the recommended path. Surfaced only when a plan was analyzed.
import React from "react";

export default function Highlights({ meta }) {
  if (!meta || (!meta.included && !meta.added && (!meta.path || meta.path.length === 0))) {
    return null;
  }
  return (
    <div className="card mt-6" data-testid="highlights">
      <h2 className="font-display text-h3">What's in your plan</h2>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="border-[3px] border-black p-4">
          <h3 className="font-display text-sm uppercase mb-2">Your curriculum included</h3>
          <p className="text-sm">{meta.included}</p>
        </div>
        <div className="border-[3px] border-black p-4 bg-black text-white">
          <h3 className="font-display text-sm uppercase mb-2">Unifies added</h3>
          <p className="text-sm">{meta.added}</p>
        </div>
      </div>
      {meta.path && meta.path.length > 0 && (
        <div className="mt-4">
          <h3 className="font-display text-sm uppercase mb-2">Recommended path</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            {meta.path.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </div>
      )}
      <p className="helper mt-3" data-testid="highlights-via">
        {meta.via === "ai" ? "Structured by Unifies AI." : "Structured by the offline planner (no AI endpoint configured)."}
      </p>
    </div>
  );
}
