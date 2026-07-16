// Keyboard shortcuts help, opened with Cmd/Ctrl+?.
import React, { useEffect } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";

const SHORTCUTS = [
  { keys: "⌘ / Ctrl + K", desc: "Open the command palette" },
  { keys: "⌘ / Ctrl + ?", desc: "Show this shortcuts help" },
  { keys: "Esc", desc: "Close any dialog / palette" },
  { keys: "↑ / ↓", desc: "Move selection in the palette" },
  { keys: "Enter", desc: "Open the selected item" },
  { keys: "Tab", desc: "Move between focusable controls (Shift+Tab reverses)" },
];

export default function ShortcutsHelp({ open, onClose }) {
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-100">Keyboard shortcuts</h3>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-300 text-lg leading-none">×</button>
        </div>
        <ul className="p-4 space-y-2">
          {SHORTCUTS.map((s) => (
            <li key={s.keys} className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{s.desc}</span>
              <kbd className="font-mono text-xs bg-slate-800 text-cyan-400 px-2 py-0.5 rounded border border-slate-700">{s.keys}</kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
