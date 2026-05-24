import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar.jsx";
import { AiChatWidget } from "./AiChatWidget.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { AuthMotionOverlay } from "./AuthMotionOverlay.jsx";

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, authTransition } = useAuth();
  const location = useLocation();
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <div className="mch-shell flex h-screen overflow-hidden text-slate-100">
      <div className="mch-page-wash pointer-events-none fixed inset-0 opacity-95" />
      <div className="relative flex h-screen w-full">
        <div className={`${mobileOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 transition md:translate-x-0`}>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </div>
        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <main className="relative flex h-screen min-w-0 flex-1 flex-col md:pl-72">
          <header
            className="mch-topbar sticky top-0 z-30 overflow-hidden border-b border-white/10 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur md:px-8"
          >
            <div className="mch-accent-strip absolute inset-x-0 top-0 h-1" />
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-white shadow-sm md:hidden"
                  onClick={() => setMobileOpen((o) => !o)}
                  aria-label="Menu"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{isAdmin ? "Admin Panel" : "User Portal"}</p>
                  <h1 className="text-lg font-bold text-white">Maverick Certification Hub</h1>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 shadow-sm">
                <div className="mch-brand-mark flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-lg shadow-cyan-950/20">
                  {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="hidden min-w-0 sm:block">
                  <div className="truncate text-sm font-semibold text-white">{user?.full_name || user?.email}</div>
                  <div className="text-xs capitalize text-slate-500">{user?.role}</div>
                </div>
              </div>
            </div>
          </header>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="mx-auto max-w-7xl animate-fade-in">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      <AiChatWidget />
      <AuthMotionOverlay show={authTransition?.type === "logout"} mode="logout" />
    </div>
  );
}
