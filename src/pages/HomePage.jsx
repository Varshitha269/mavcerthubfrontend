import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { dashboardApi, notificationsApi } from "../services/api.js";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { CardSkeleton } from "../components/Skeleton.jsx";
import { FormattedMessage } from "../components/FormattedMessage.jsx";

const applicationStages = [
  {
    label: "Discover",
    title: "Find the right certification path",
    body: "Explore curated certifications, check eligibility, and compare what each pathway expects before you apply.",
    to: "/certifications",
  },
  {
    label: "Apply",
    title: "Submit your application details",
    body: "Create a registration, attach required information, and keep your certification intent visible in one place.",
    to: "/registrations",
  },
  {
    label: "Prepare",
    title: "Work through guided tasks",
    body: "Use generated tasks, document upload checkpoints, and reminders to move steadily toward approval.",
    to: "/tasks",
  },
  {
    label: "Complete",
    title: "Track voucher and result updates",
    body: "Follow voucher readiness, exam status, certificate proof, and final result updates after completion.",
    to: "/vouchers",
  },
];

const toolTabs = {
  ai: {
    label: "AI Coach",
    kicker: "Personal guidance",
    title: "AI support for choosing, preparing, and validating",
    body: "The AI layer helps explain eligibility, turn your certification goal into tasks, review certificate text, and surface suggested next steps based on your current journey.",
    to: "/certifications",
    actions: ["Eligibility guidance", "Task generation", "Certificate verification", "Suggested learning paths"],
  },
  powerbi: {
    label: "Power BI",
    kicker: "Progress clarity",
    title: "A personal analytics view without admin data exposure",
    body: "Power BI-style views are used for your own progress story: milestones, activity rhythm, voucher readiness, completion trend, and what needs attention next.",
    to: "/dashboard",
    actions: ["Journey timeline", "Progress trend", "Voucher readiness", "Completion signals"],
  },
  automation: {
    label: "Automation",
    kicker: "Workflow engine",
    title: "Approvals, reminders, and document movement",
    body: "Automation keeps the certification process moving by routing application updates, reminders, document reviews, and notifications through the right workflow.",
    to: "/notifications",
    actions: ["Approval routing", "Reminder nudges", "Document review flow", "Status notifications"],
  },
  documents: {
    label: "Documents",
    kicker: "Evidence hub",
    title: "Upload proof once and track review status",
    body: "Your documents and certificate proofs stay connected to the certification journey so admins can review them without exposing platform-wide records to you.",
    to: "/uploads",
    actions: ["Document uploads", "Certificate proof", "Review status", "Secure storage"],
  },
};

function SpotlightCard({ className = "", children }) {
  const [spot, setSpot] = useState({ x: 50, y: 50 });

  return (
    <div
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setSpot({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100,
        });
      }}
      style={{ "--spot-x": `${spot.x}%`, "--spot-y": `${spot.y}%` }}
      className={`mch-spotlight group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.06] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white">{title}</h2>
      {subtitle && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{subtitle}</p>}
    </div>
  );
}

function JourneyCard({ stage, index }) {
  return (
    <Link to={stage.to}>
      <SpotlightCard className="h-full p-5">
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
              {stage.label}
            </span>
            <span className="font-display text-4xl font-black text-white/10 transition group-hover:text-cyan-200/20">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <h3 className="mt-5 font-display text-lg font-bold text-white">{stage.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{stage.body}</p>
          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
            Open step
            <span className="transition group-hover:translate-x-1">-&gt;</span>
          </div>
        </div>
      </SpotlightCard>
    </Link>
  );
}

function QuickAction({ action, index }) {
  return (
    <Link to={action.to}>
      <SpotlightCard className="p-4">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-xs font-black text-indigo-200 ring-1 ring-indigo-300/20">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="truncate text-sm font-semibold text-slate-100">{action.label}</span>
          </div>
          <span className="text-sm font-semibold text-cyan-200 transition group-hover:translate-x-1">Open</span>
        </div>
      </SpotlightCard>
    </Link>
  );
}

function BroadcastPopup({ notification, onClose }) {
  if (!notification) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-lg">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-cyan-300/30 bg-slate-950 shadow-2xl shadow-cyan-950/50 mch-fade-in">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.35),transparent_32%),radial-gradient(circle_at_90%_20%,rgba(168,85,247,0.24),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.2),rgba(2,6,23,0.95))]" />
        <div className="absolute -left-16 -top-16 h-44 w-44 rounded-full border border-cyan-300/20" />
        <div className="absolute -bottom-20 right-8 h-52 w-52 rounded-full border border-indigo-300/20" />
        <div className="absolute left-8 top-8 h-2 w-24 rounded-full bg-cyan-300/70 shadow-lg shadow-cyan-400/30" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/15 hover:text-white"
        >
          Close
        </button>
        <div className="relative z-10 p-6 pt-12 md:p-8 md:pt-14">
          {notification.image_url && <img src={notification.image_url} alt="" className="mb-5 max-h-60 w-full rounded-3xl object-cover ring-1 ring-white/10" />}
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-xs font-black uppercase tracking-[0.08em] text-slate-950 shadow-lg shadow-cyan-950/40">
              {(notification.icon || "info").slice(0, 2)}
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">New announcement</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-200">{notification.icon || "announcement"}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${
                  notification.priority === "high" ? "bg-rose-500/20 text-rose-100" : notification.priority === "low" ? "bg-white/10 text-slate-200" : "bg-amber-500/20 text-amber-100"
                }`}>
                  {notification.priority || "medium"} priority
                </span>
              </div>
            </div>
          </div>
          <h2 className="mt-7 max-w-xl font-display text-4xl font-black tracking-tight text-white md:text-5xl">{notification.title}</h2>
          <FormattedMessage message={notification.message} format={notification.content_format} className="mt-4 max-w-2xl text-base leading-8 text-slate-300" />
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to={(notification.link_url || "/home").replace(/^https?:\/\/[^/]+/, "")}
              onClick={onClose}
              className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:bg-cyan-200"
            >
              Open Home
            </Link>
            <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white">
              Mark as Seen
            </button>
          </div>
          <p className="mt-5 text-xs text-slate-500">This broadcast is also saved under Notifications / Info.</p>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const home = useAsyncData(() => dashboardApi.home().then((r) => r.data), []);
  const notifications = useAsyncData(() => notificationsApi.my().then((r) => r.data), []);
  const [activeTool, setActiveTool] = useState("ai");
  const [dismissedBroadcastId, setDismissedBroadcastId] = useState(null);

  const data = home.data || {};
  const steps = data.getting_started?.length
    ? data.getting_started.map((step, index) => ({
        ...applicationStages[index % applicationStages.length],
        body: step,
      }))
    : applicationStages;
  const quickActions = data.quick_actions?.length ? data.quick_actions : [
    { label: "Browse certifications", to: "/certifications" },
    { label: "Upload documents", to: "/uploads" },
    { label: "View tasks", to: "/tasks" },
    { label: "Open progress view", to: "/dashboard" },
  ];
  const recentActivity = data.recent_activity || [];
  const activeToolConfig = toolTabs[activeTool];
  const broadcastNotification = useMemo(
    () =>
      (notifications.data || []).find(
        (n) =>
          !n.read_at &&
          n.id !== dismissedBroadcastId &&
          n.type === "system" &&
          (n.link_url || "/home").includes("/home")
      ),
    [notifications.data, dismissedBroadcastId]
  );

  const nextPrompt = useMemo(() => {
    if (recentActivity.length) return "Pick up from your latest activity or jump into a guided action below.";
    return "Start by choosing a certification, then let the portal guide eligibility, tasks, uploads, approvals, vouchers, and results.";
  }, [recentActivity.length]);

  if (home.loading && !home.data) return <CardSkeleton />;
  if (home.error) return <Card title="Home"><p className="text-rose-300">{home.error}</p></Card>;

  async function closeBroadcastPopup() {
    if (broadcastNotification?.id) {
      setDismissedBroadcastId(broadcastNotification.id);
      try {
        await notificationsApi.markRead(broadcastNotification.id);
        notifications.reload();
        home.reload();
      } catch {
        // Keep the popup closed locally even if marking read fails.
      }
    }
  }

  return (
    <div className="space-y-7 text-slate-100">
      <BroadcastPopup notification={broadcastNotification} onClose={closeBroadcastPopup} />
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/30 md:p-8">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(6,182,212,0.18),transparent_35%,rgba(99,102,241,0.16)_70%,transparent)]" />
        <div className="relative z-10 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Maverick Certification Hub</p>
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-black tracking-tight text-white md:text-5xl">
              Your certification command center
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              Manage your application journey from discovery to voucher and result tracking. This home page is for your own actions, documents, AI guidance, and progress signals, without admin-only user or platform counts.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/certifications"><Button>Start Certification</Button></Link>
              <Link to="/registrations"><Button variant="ghost">My Application</Button></Link>
              <Link to="/dashboard"><Button variant="ghost">Progress View</Button></Link>
            </div>
          </div>
          <SpotlightCard className="p-5">
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">Next best move</p>
              <h2 className="mt-3 font-display text-2xl font-bold text-white">Stay guided, not overloaded</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{nextPrompt}</p>
              <div className="mt-5 grid gap-2">
                {["Eligibility check", "Task planning", "Document upload", "Voucher readiness"].map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-300/30 hover:text-white">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </SpotlightCard>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SpotlightCard className="p-5 md:p-6">
          <div className="relative z-10">
            <SectionHeading
              eyebrow="My Application"
              title="What this portal is about"
              subtitle="A single workspace for applying to certification drives, proving eligibility, finishing preparation tasks, submitting documents, receiving vouchers, and tracking completion."
            />
            <div className="mt-6 space-y-3">
              {[
                "Keep your certification application status connected to real backend workflow updates.",
                "Use AI-assisted guidance to understand what to do next instead of guessing across pages.",
                "Let uploads, vouchers, notifications, tasks, and results stay tied to your journey.",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-300 transition hover:border-indigo-300/30 hover:bg-white/[0.06]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </SpotlightCard>

        <div>
          <SectionHeading
            eyebrow="Getting Started"
            title="Move through the journey step by step"
            subtitle="Each card opens the page that helps you complete that part of the certification workflow."
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {steps.slice(0, 4).map((stage, index) => (
              <JourneyCard key={`${stage.label}-${index}`} stage={stage} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading
            eyebrow="Quick Actions"
            title="Useful jumps"
            subtitle="Fast paths for the things a learner usually needs next."
          />
          <div className="mt-5 grid gap-3">
            {quickActions.map((action, index) => (
              <QuickAction key={`${action.label}-${action.to}`} action={action} index={index} />
            ))}
          </div>
        </div>

        <SpotlightCard className="p-5 md:p-6">
          <div className="relative z-10">
            <SectionHeading
              eyebrow="AI And Power Platform"
              title="More than labels: tools that support your workflow"
              subtitle="Switch tabs to see what each capability does inside the certification experience."
            />
            <div className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.035] p-1">
              {Object.entries(toolTabs).map(([key, tool]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTool(key)}
                  className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition ${
                    activeTool === key
                      ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/20"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {tool.label}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-5 mch-fade-in">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">{activeToolConfig.kicker}</p>
              <h3 className="mt-3 font-display text-2xl font-bold text-white">{activeToolConfig.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{activeToolConfig.body}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {activeToolConfig.actions.map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10">
                    {item}
                  </div>
                ))}
              </div>
              <Link to={activeToolConfig.to} className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-500">
                Open related page
              </Link>
            </div>
          </div>
        </SpotlightCard>
      </section>

      <section>
        <Card title="Recent Activity" subtitle="Your latest notifications and enrollment changes">
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-400">No activity yet. Start with a certification and this feed will become your timeline.</p>
            ) : (
              recentActivity.map((item, index) => (
                <Link
                  key={`${item.type}-${index}`}
                  to={(item.link_url || "/notifications").replace(/^https?:\/\/[^/]+/, "")}
                  className="block rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.06]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium text-white">{item.title}</h3>
                    <span className="text-[11px] uppercase tracking-wider text-slate-500">{item.type}</span>
                  </div>
                  <FormattedMessage message={item.message} format={item.content_format} className="mt-1 text-sm text-slate-400" />
                </Link>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
