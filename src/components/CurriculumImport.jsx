// components/CurriculumImport.jsx
// First-run / accessible entry: paste or upload a curriculum, then let Unifies
// (AI or offline planner) structure it. Shows the gap analysis before saving.
import React, { useState, useRef, useCallback } from "react";
import { analyzeCurriculum, planToCurriculum } from "../utils/analyze";
import { SAMPLE_CURRICULA } from "../data/curriculum";
import AccountBar from "./AccountBar";

export default function CurriculumImport({ initialText = "", onUsePlan, onLoadSample, onHome }) {
  const [text, setText] = useState(initialText);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState(null); // {plan, curriculum, via, rateLimited}
  const fileRef = useRef(null);

  const run = useCallback(
    async (raw) => {
      if (!raw.trim()) {
        setStatus("Paste your curriculum or upload a file first.");
        return;
      }
      setBusy(true);
      setStatus("");
      try {
        const { plan, via, rateLimited } = await analyzeCurriculum(raw, {
          onStatus: setStatus,
        });
        setPreview({ plan, curriculum: planToCurriculum(plan), via, rateLimited });
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const txt = await file.text();
    setText(txt);
    run(txt);
  };

  return (
    <div className="min-h-screen bg-bg text-fg px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            onClick={() => onHome && onHome()}
            className="font-mono text-xs tracking-[0.2em] uppercase text-black hover:underline underline-offset-2"
            aria-label="Back to home"
          >
            Unifies
          </button>
          <AccountBar />
        </div>

        <div className="card mt-6" data-testid="onboarding-card">
          <h2 className="font-display text-h3">New to Unifies? Here's how it works</h2>
          <ol className="mt-3 space-y-2 text-sm list-decimal list-inside">
            <li>
              <strong>Paste your curriculum</strong> (or upload a file, or load the FAANG/FDE
              sample). Unifies reads whatever you bring — a syllabus, a job description, your
              own notes.
            </li>
            <li>
              <strong>Unifies structures it</strong> with an AI (or a built-in offline planner)
              and fills the gaps: it adds foundational basics for true beginners and
              advanced/staff-level depth, then shows what <em>you</em> included vs what Unifies added.
            </li>
            <li>
              <strong>Track it</strong> — check off items, build streaks, see insights, and use
              Revision &amp; skip when you already know something.
            </li>
          </ol>
          <p className="mt-3 text-xs text-slate-500">
            No account needed — your plan is saved on this device. Continue with Google (top
            right) to sync across devices and unlock shareable profiles.
          </p>
        </div>

        <div className="card mt-8">
          <label className="label" htmlFor="cur-input">
            Your curriculum (plain text, markdown, or CSV)
          </label>
          <textarea
            id="cur-input"
            className="input font-mono w-full"
            rows={12}
            placeholder={
              "e.g.\n\nPhase 1: Python\n- Variables and types\n- Functions\n- Object oriented programming\n\nPhase 2: Web\n- HTTP and REST\n- Build a small API"
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            data-testid="curriculum-input"
          />
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              className="btn btn-md"
              onClick={() => run(text)}
              disabled={busy}
              data-testid="analyze-btn"
            >
              {busy ? "Analyzing…" : "Analyze with Unifies AI"}
            </button>
            <button
              className="btn btn-secondary btn-md"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              Upload file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.markdown,.csv,.json,text/plain"
              className="hidden"
              onChange={onFile}
              data-testid="curriculum-file"
            />
            <button
              className="btn btn-ghost btn-md"
              onClick={() => onLoadSample && onLoadSample("fde")}
            >
              Load FAANG/FDE sample
            </button>
          </div>
          {status && (
            <p className="helper" data-testid="analyze-status">
              {status}
            </p>
          )}
        </div>

        {preview && (
          <div className="card mt-6" data-testid="analysis-preview">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-display text-h3">Gap analysis</h2>
              <span className="chip chip-active">
                {preview.via === "ai" ? "Structured by AI" : "Offline planner"}
                {preview.rateLimited ? " (rate-limited)" : ""}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="raw-card p-4">
                <h3 className="font-display text-sm uppercase mb-2">Your curriculum included</h3>
                <p className="text-sm">{preview.plan.included}</p>
                <p className="mt-3 text-sm">
                  <strong>{preview.plan.items.filter((i) => i.source === "user").length}</strong>{" "}
                  items you provided
                  {preview.plan.phases.filter((p) => p.id.startsWith("p")).length > 0 && (
                    <>
                      {" "}
                      across{" "}
                      <strong>
                        {preview.plan.phases.filter((p) => p.id.startsWith("p")).length}
                      </strong>{" "}
                      parts
                    </>
                  )}
                </p>
              </div>
              <div className="raw-card p-4">
                <h3 className="font-display text-sm uppercase mb-2">Unifies added</h3>
                <p className="text-sm">{preview.plan.added}</p>
                <p className="mt-3 text-sm">
                  <strong>{preview.plan.items.filter((i) => i.source === "app").length}</strong>{" "}
                  items added (foundations + advanced gaps)
                </p>
              </div>
            </div>

            {preview.plan.path.length > 0 && (
              <div className="mt-4">
                <h3 className="font-display text-sm uppercase mb-2">Recommended path</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  {preview.plan.path.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="mt-6">
              <button
                className="btn btn-md"
                onClick={() => onUsePlan && onUsePlan(preview.curriculum)}
                data-testid="use-plan-btn"
              >
                Use this plan →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
