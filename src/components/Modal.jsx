import React, { useEffect } from "react";
import { Button } from "./Button.jsx";

export function Modal({ open, title, children, onClose, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const max = size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-sm" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative z-[81] max-h-[88vh] w-full ${max} animate-fade-in overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-indigo-900/30 backdrop-blur-xl`}
        role="dialog"
        aria-modal="true"
      >
        {onClose && (
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12" />
              <path d="M18 6 6 18" />
            </svg>
          </button>
        )}
        {title && <h3 className="font-display text-xl font-semibold text-white">{title}</h3>}
        <div className={title ? "mt-4" : ""}>{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
        {!footer && onClose && (
          <div className="mt-6 flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
