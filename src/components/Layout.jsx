import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.jsx";
import { AiChatWidget } from "./AiChatWidget.jsx";

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen text-slate-100" style={{ backgroundColor: "var(--color-bg-body)" }}>
      <div
        className="pointer-events-none fixed inset-0 opacity-90"
        style={{ background: "var(--gradient-bg)" }}
      />
      <div className="relative flex min-h-screen w-full">
        <div className={`${mobileOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 transition md:static md:translate-x-0`}>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </div>
        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 md:hidden"
            style={{ backgroundColor: "var(--color-bg-overlay)" }}
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <main className="relative flex min-h-screen flex-1 flex-col">
          <header
            className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 py-3 backdrop-blur-md md:px-8"
            style={{
              borderBottom: "1px solid var(--color-border)",
              backgroundColor: "var(--color-bg-header)",
            }}
          >
            <button
              type="button"
              className="rounded-lg p-2 md:hidden"
              style={{ border: "1px solid var(--color-border)" }}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="font-display text-lg font-semibold text-white md:text-xl">Dashboard</h1>
            <div className="w-10 md:w-0" />
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="mx-auto max-w-6xl animate-fade-in">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      <AiChatWidget />
    </div>
  );
}
