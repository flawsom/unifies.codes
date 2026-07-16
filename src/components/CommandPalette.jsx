// Command palette: ⌘K (or Ctrl+K) opens a fuzzy search over every curriculum
// item. Selecting one jumps to its section. Uses real Unicode characters in
// JSX/text (⌘, →, —) — not \u escapes, which only work inside JS string literals.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";

export default function CommandPalette({ open, onClose, items, checked, onSelect }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const trapRef = useFocusTrap(open);

  // Reset state each time it opens.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const scored = items
      .map((item) => {
        const hay = `${item.text} ${item.phaseTitle} ${item.weekTitle || ""}`.toLowerCase();
        const idx = hay.indexOf(q);
        // exact-ish prefix/first-word matches rank higher; -1 (no match) drops out
        let score = -1;
        if (!q) score = 0;
        else if (idx === 0) score = 3;
        else if (idx > 0) score = 1;
        return { item, score };
      })
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((r) => r.item);
    return scored;
  }, [query, items]);

  // Keep the active index in range as results change.
  useEffect(() => {
    if (active >= results.length) setActive(0);
  }, [results, active]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active];
      if (item) onSelect(item);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
      data-testid="command-palette-overlay"
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        data-testid="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-2 px-4 border-b border-slate-800">
          <span className="text-slate-500 font-mono text-sm">⌘K</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to any item — phase, week, or topic…"
            className="flex-1 bg-transparent py-3 text-slate-100 placeholder-slate-600 outline-none text-sm"
            data-testid="command-palette-input"
          />
          <span className="text-[10px] text-slate-600 font-mono">ESC</span>
        </div>

        <ul ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-600">No matches</li>
          )}
          {results.map((item, i) => (
            <li key={item.id}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => onSelect(item)}
                className={`w-full text-left px-4 py-2 flex items-center gap-3 ${
                  i === active ? "bg-black/10" : ""
                }`}
                data-testid="command-palette-item"
                data-item-id={item.id}
              >
                <span
                  className={`w-3 h-3 rounded-sm flex-shrink-0 ${
                    checked[item.id] ? "bg-black" : "bg-slate-800"
                  }`}
                />
                <span className="flex-1 min-w-0">
                  <span className={`text-sm block truncate ${checked[item.id] ? "text-slate-500 line-through" : "text-slate-200"}`}>
                    {item.text}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {item.phaseTitle}
                    {item.weekTitle ? ` → ${item.weekTitle}` : ""}
                  </span>
                </span>
                {i === active && <span className="text-[10px] text-slate-500 font-mono">↵</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
