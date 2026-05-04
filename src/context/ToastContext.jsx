import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, variant = "info") => {
    const id = ++idSeq;
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const success = useCallback((m) => push(m, "success"), [push]);
  const error = useCallback((m) => push(m, "error"), [push]);
  const info = useCallback((m) => push(m, "info"), [push]);

  const value = useMemo(() => ({ success, error, info, toasts }), [success, error, info, toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-fade-in rounded-2xl border px-5 py-3 text-sm font-medium shadow-xl backdrop-blur-md transition ${
              t.variant === "success"
                ? "border-emerald-500/40 bg-emerald-950/80 text-emerald-100"
                : t.variant === "error"
                  ? "border-rose-500/40 bg-rose-950/80 text-rose-100"
                  : "border-white/15 bg-slate-900/85 text-slate-100"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
