import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const iconMap = {
  home: (
    <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 10v10h5v-6h4v6h5V10" /></>
  ),
  overview: (
    <><rect x="3" y="3" width="7" height="8" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="15" width="7" height="6" rx="1.5" /></>
  ),
  certs: (
    <><circle cx="12" cy="8" r="5" /><path d="m8.5 12.5-1.2 7 4.7-2.5 4.7 2.5-1.2-7" /></>
  ),
  enrollments: (
    <><path d="M9 4h6l1 2h3v15H5V6h3l1-2Z" /><path d="M9 11h6" /><path d="M9 15h6" /></>
  ),
  vouchers: (
    <><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z" /><path d="M9 9h6" /><path d="M9 15h4" /></>
  ),
  uploads: (
    <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>
  ),
  notifications: (
    <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path d="M10 21h4" /></>
  ),
  profile: (
    <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>
  ),
  settings: (
    <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a8 8 0 0 0 .1-1l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 6.5h-4L10.6 9a8 8 0 0 0-1.7 1L6.5 9l-2 3.5 2 1.5a8 8 0 0 0 .1 2l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.4 2.5h4l.4-2.5a8 8 0 0 0 1.7-1l2.4 1 2-3.5-2.2-2Z" /></>
  ),
  apps: (
    <><path d="M7 3h7l5 5v13H7V3Z" /><path d="M14 3v5h5" /><path d="M10 13h6" /><path d="M10 17h4" /></>
  ),
  drives: (
    <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4" /><path d="M16 3v4" /><path d="M4 10h16" /></>
  ),
  eligibility: (
    <><path d="M12 3 20 7v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" /><path d="m9 12 2 2 4-5" /></>
  ),
  results: (
    <><path d="M4 20V4" /><path d="M4 20h16" /><rect x="7" y="11" width="3" height="6" rx="1" /><rect x="12" y="7" width="3" height="10" rx="1" /><rect x="17" y="13" width="3" height="4" rx="1" /></>
  ),
  admin: (
    <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M14 18a5 5 0 0 1 7 2" /></>
  ),
  support: (
    <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" /><path d="M9 9h6" /><path d="M9 13h4" /></>
  ),
};

function Icon({ name, active }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 transition ${
        active
          ? "bg-slate-950 text-cyan-300 ring-cyan-300/20"
          : "bg-white/10 text-slate-200 ring-white/10 group-hover:bg-cyan-300/15 group-hover:text-cyan-100"
      }`}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {iconMap[name] || iconMap.overview}
      </svg>
    </span>
  );
}

function Section({ title, items, onNavigate }) {
  return (
    <div className="space-y-1">
      <div className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{title}</div>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} onClick={() => onNavigate?.()}>
          {({ isActive }) => (
            <span
              className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-white text-slate-950 shadow-sm shadow-cyan-950/20"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon name={item.icon} active={isActive} />
              <span className="truncate">{item.label}</span>
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );
}

export function Sidebar({ onNavigate }) {
  const { user, isPrivileged, logout, authTransition } = useAuth();

  const userJourney = [
    { to: "/home", label: "Home", icon: "home" },
    { to: "/dashboard", label: "Overview", icon: "overview" },
    { to: "/certifications", label: "Certifications", icon: "certs" },
    { to: "/enrollments", label: "My Enrollments", icon: "enrollments" },
    { to: "/vouchers", label: "My Vouchers", icon: "vouchers" },
    { to: "/support", label: "Support", icon: "support" },
    { to: "/uploads", label: "Uploads", icon: "uploads" },
  ];

  const userAccount = [
    { to: "/notifications", label: "Notifications", icon: "notifications" },
    { to: "/profile", label: "Profile", icon: "profile" },
    { to: "/settings", label: "Settings", icon: "settings" },
  ];

  const roleOps = {
    admin: [
      { to: "/dashboard", label: "Overview", icon: "overview" },
      { to: "/admin-brd/registrations", label: "Applications", icon: "apps" },
      { to: "/admin-brd/drives", label: "Drives", icon: "drives" },
      { to: "/admin-brd/eligibility", label: "Eligibility", icon: "eligibility" },
      { to: "/admin-brd/results", label: "Results", icon: "results" },
      { to: "/vouchers", label: "Vouchers", icon: "vouchers" },
      { to: "/uploads", label: "Documents", icon: "uploads" },
      { to: "/admin-brd/support", label: "Support", icon: "support" },
    ],
    coordinator: [
      { to: "/dashboard", label: "Overview", icon: "overview" },
      { to: "/admin-brd/drives", label: "Drives", icon: "drives" },
      { to: "/admin-brd/registrations", label: "Applications", icon: "apps" },
      { to: "/admin-brd/results", label: "Results", icon: "results" },
      { to: "/admin-brd/support", label: "Support", icon: "support" },
      { to: "/vouchers", label: "Vouchers", icon: "vouchers" },
    ],
    approver: [
      { to: "/dashboard", label: "Overview", icon: "overview" },
      { to: "/admin-brd/eligibility", label: "Approvals", icon: "eligibility" },
      { to: "/uploads", label: "Documents", icon: "uploads" },
      { to: "/admin-brd/support", label: "Exceptions", icon: "support" },
    ],
    read_only: [
      { to: "/dashboard", label: "Leadership View", icon: "overview" },
      { to: "/admin-brd/registrations", label: "Applications", icon: "apps" },
      { to: "/admin-brd/drives", label: "Drives", icon: "drives" },
      { to: "/admin-brd/results", label: "Results", icon: "results" },
      { to: "/vouchers", label: "Vouchers", icon: "vouchers" },
      { to: "/uploads", label: "Documents", icon: "uploads" },
    ],
  };

  const roleSystem = {
    admin: [
      { to: "/certifications", label: "Certificates", icon: "certs" },
      { to: "/admin", label: "Users", icon: "admin" },
      { to: "/notifications", label: "Notifications", icon: "notifications" },
      { to: "/settings", label: "Settings", icon: "settings" },
    ],
    coordinator: [
      { to: "/notifications", label: "Notifications", icon: "notifications" },
      { to: "/settings", label: "Settings", icon: "settings" },
    ],
    approver: [
      { to: "/notifications", label: "Notifications", icon: "notifications" },
      { to: "/settings", label: "Settings", icon: "settings" },
    ],
    read_only: [
      { to: "/notifications", label: "Notifications", icon: "notifications" },
      { to: "/settings", label: "Settings", icon: "settings" },
    ],
  };
  const activeOps = roleOps[user?.role] || roleOps.read_only;
  const activeSystem = roleSystem[user?.role] || roleSystem.read_only;

  return (
    <aside className="mch-sidebar relative flex h-full w-72 shrink-0 flex-col overflow-hidden text-white shadow-2xl shadow-slate-950/25">
      <div className="mch-accent-strip absolute inset-x-0 top-0 h-1" />
      <div className="border-b border-white/10 p-5 pt-6">
        <div className="flex items-center gap-3">
          <div className="mch-brand-mark flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black shadow-lg shadow-cyan-950/30">M</div>
          <div>
            <div className="text-lg font-bold tracking-tight">Maverick</div>
          <p className="text-xs text-slate-400">{isPrivileged ? `${user?.role || "admin"} Dashboard` : "Certification Portal"}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {isPrivileged ? (
          <>
            <Section title={user?.role === "read_only" ? "View Access" : "Workspace"} items={activeOps} onNavigate={onNavigate} />
            <Section title="Account" items={activeSystem} onNavigate={onNavigate} />
          </>
        ) : (
          <>
            <Section title="Certification Journey" items={userJourney} onNavigate={onNavigate} />
            <Section title="Account" items={userAccount} onNavigate={onNavigate} />
          </>
        )}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3 shadow-inner shadow-white/5">
          <div className="truncate text-sm font-semibold text-white">{user?.full_name || user?.email}</div>
          <div className="mt-1 truncate text-xs text-slate-400">{user?.email}</div>
          <div className="mt-2 inline-flex rounded-full bg-cyan-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-100 ring-1 ring-cyan-300/20">
            {user?.role}
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={authTransition?.type === "logout"}
          className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
        >
          {authTransition?.type === "logout" ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
