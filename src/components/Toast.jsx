// Lightweight toast + celebration system (no dependencies).
// Provides <ToastProvider> and useToast() -> { notify, celebrate }.
import React, { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext) || { notify: () => {}, celebrate: () => {} };
}

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const notify = useCallback(
    (message, opts = {}) => {
      const id = ++idSeq;
      setToasts((t) => [...t, { id, message, kind: opts.kind || "info", celebrate: false }]);
      setTimeout(() => remove(id), opts.duration || 3200);
    },
    [remove]
  );

  const celebrate = useCallback(
    (message) => {
      const id = ++idSeq;
      setToasts((t) => [...t, { id, message, kind: "celebrate", celebrate: true }]);
      setTimeout(() => remove(id), 4200);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ notify, celebrate }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[400] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-2 rounded-lg shadow-lg text-sm font-medium border ${
              t.kind === "celebrate"
                ? "bg-amber-500 text-slate-950 border-amber-400 animate-pop"
                : t.kind === "error"
                ? "bg-red-600 text-white border-red-500"
                : "bg-slate-800 text-slate-100 border-slate-700"
            }`}
            role="status"
          >
            {t.celebrate && <span className="mr-1">🎉</span>}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
