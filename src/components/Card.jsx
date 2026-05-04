import React from "react";

export function Card({ title, subtitle, children, className = "", actions }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl p-6 shadow-xl shadow-black/20 backdrop-blur-xl transition duration-300 ${className}`}
      style={{
        border: "1px solid var(--color-border)",
        backgroundColor: "var(--color-bg-surface)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full blur-2xl transition group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, var(--color-bg-card-glow), transparent)` }}
      />
      {(title || subtitle || actions) && (
        <div className="relative mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-lg font-semibold tracking-tight text-white">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
