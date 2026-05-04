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
        className={`relative z-[81] w-full ${max} animate-fade-in rounded-2xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-indigo-900/30 backdrop-blur-xl`}
        role="dialog"
        aria-modal="true"
      >
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
