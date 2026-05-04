import React from "react";

const variants = {
  primary:
    "bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110 active:scale-[0.98]",
  ghost:
    "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 hover:border-white/20 active:scale-[0.98]",
  danger:
    "border border-rose-500/40 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25 active:scale-[0.98]",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  loading = false,
  disabled,
  type = "button",
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-45 ${variants[variant] || variants.primary} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  );
}
