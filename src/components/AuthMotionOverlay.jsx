import React from "react";

export function AuthMotionOverlay({ show, mode = "login", title, subtitle }) {
  if (!show) return null;

  const isLogout = mode === "logout";
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-slate-950/80 px-4 backdrop-blur-xl">
      <div className="mch-auth-bg" aria-hidden="true">
        <span className="mch-auth-orbit mch-auth-orbit-a" />
        <span className="mch-auth-orbit mch-auth-orbit-b" />
        <span className="mch-auth-orbit mch-auth-orbit-c" />
        <span className="mch-auth-grid-flow" />
      </div>
      <div className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-white/[0.07] p-7 text-center shadow-2xl shadow-black/35">
        <div className={`mch-auth-loader ${isLogout ? "mch-auth-loader-out" : ""} mx-auto`}>
          <span />
          <span />
          <span />
        </div>
        <h2 className="mt-5 font-display text-xl font-bold text-white">
          {title || (isLogout ? "Signing out securely" : "Signing you in")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {subtitle || (isLogout ? "Closing your session and clearing access safely." : "Preparing your certification workspace.")}
        </p>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="mch-auth-progress h-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
