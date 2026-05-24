import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext.jsx";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { adminApi, dashboardApi } from "../services/api.js";
import { CardSkeleton } from "../components/Skeleton.jsx";
import { ActivityHeatmap } from "../components/ActivityHeatmap.jsx";

const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];
const surface = "rounded-2xl border border-white/10 bg-white/[0.03] shadow-xl shadow-black/20 backdrop-blur-xl";
const tooltipStyle = { background: "#0f172a", border: "1px solid #ffffff20", color: "#fff" };

function ShellHeader({ label, title, subtitle, actions }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 text-white shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">{label}</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{subtitle}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  );
}

function SummaryCard({ label, value, hint, accent = "blue" }) {
  const accents = {
    blue: "bg-indigo-500/15 text-indigo-200 ring-indigo-400/20",
    green: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/20",
    amber: "bg-amber-500/15 text-amber-200 ring-amber-400/20",
    violet: "bg-fuchsia-500/15 text-fuchsia-200 ring-fuchsia-400/20",
    rose: "bg-rose-500/15 text-rose-200 ring-rose-400/20",
    cyan: "bg-cyan-500/15 text-cyan-200 ring-cyan-400/20",
  };
  return (
    <div className={`${surface} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <div className="mt-3 font-display text-3xl font-bold tracking-tight text-white">{value}</div>
        </div>
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold ring-1 ${accents[accent]}`}>
          {String(label).slice(0, 2)}
        </span>
      </div>
      {hint && <p className="mt-3 text-sm text-slate-400">{hint}</p>}
    </div>
  );
}

function Panel({ title, subtitle, children, action }) {
  return (
    <section className={`${surface} p-5`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold text-white">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ChartPanel({ title, subtitle, children }) {
  return (
    <Panel title={title} subtitle={subtitle}>
      <div className="h-[310px]">{children}</div>
    </Panel>
  );
}

function MiniBars({ rows }) {
  const max = Math.max(1, ...rows.map((row) => row.value || 0));
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-200">{row.name}</span>
            <span className="font-display text-lg font-bold text-white">{row.value || 0}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full"
              style={{ width: `${((row.value || 0) / max) * 100}%`, backgroundColor: PALETTE[index % PALETTE.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SegmentedTabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1 shadow-xl shadow-black/10">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
            active === key
              ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-sm"
              : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function StatusPill({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-500/15 text-slate-200",
    green: "bg-emerald-500/15 text-emerald-200",
    amber: "bg-amber-500/15 text-amber-200",
    red: "bg-rose-500/15 text-rose-200",
    blue: "bg-indigo-500/15 text-indigo-200",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function EmptyText({ children }) {
  return <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">{children}</p>;
}

function ActionLink({ to, children }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-indigo-400/40 hover:bg-white/[0.06] hover:text-white"
    >
      {children}
    </Link>
  );
}

function AdminOverview() {
  const overview = useAsyncData(() => adminApi.brdOverview().then((r) => r.data), []);
  const heatmap = useAsyncData(() => adminApi.activityHeatmap().then((r) => r.data), []);
  const [tab, setTab] = useState("overview");

  if (overview.loading && !overview.data) return <CardSkeleton />;
  const data = overview.data || {};
  const metrics = data.metrics || {};
  const charts = data.charts || {};

  const adminLinks = [
    ["Applications", "/admin-brd/registrations"],
    ["Drives", "/admin-brd/drives"],
    ["Documents", "/uploads"],
    ["Vouchers", "/vouchers"],
    ["Results", "/admin-brd/results"],
    ["Users", "/admin"],
    ["AI Hub", "/ai"],
    ["Reports", "/dashboard"],
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <ShellHeader
        label="Admin Workspace"
        title="Certification Operations Dashboard"
        // subtitle="A Figma-style control center for applications, drives, eligibility tests, vouchers, Activity, documents, analytics, and admin audit events. Every number below is read from your backend APIs."
        actions={
          <>
            <Link to="/admin-brd/registrations" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30">Applications</Link>
            <Link to="/admin-brd/drives" className="rounded-xl border border-white/20 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white">Manage Drives</Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Active Users" value={metrics.active_users ?? 0} hint="Enabled platform accounts" accent="blue" />
        <SummaryCard label="Certifications" value={metrics.active_certifications ?? 0} hint="Active enrollment portfolio" accent="cyan" />
        <SummaryCard label="Reviews" value={metrics.pending_reviews ?? 0} hint="Admin review queue" accent="amber" />
        <SummaryCard label="Vouchers" value={metrics.issued_vouchers ?? 0} hint={`${metrics.used_vouchers ?? 0} redeemed`} accent="violet" />
        <SummaryCard label="Eligible" value={metrics.eligible_users ?? 0} hint={`${metrics.avg_test_score ?? 0}% average score`} accent="green" />
        <SummaryCard label="Success" value={`${metrics.success_rate ?? 0}%`} hint="Completed enrollments" accent="rose" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Drive Total" value={metrics.total_drives ?? 0} hint="All certification drives" accent="blue" />
        <SummaryCard label="Drive Active" value={metrics.open_drives ?? 0} hint={`${metrics.drive_active_rate ?? 0}% active rate`} accent="green" />
        <SummaryCard label="Completed" value={metrics.completed_drives ?? 0} hint={`${metrics.drive_completion_rate ?? 0}% completion rate`} accent="cyan" />
        <SummaryCard label="Drive Regs" value={metrics.drive_registrations ?? 0} hint="Drive applications" accent="violet" />
        <SummaryCard label="Pass Rate" value={`${metrics.drive_pass_rate ?? 0}%`} hint={`${metrics.drive_assessments ?? 0} assessed`} accent="amber" />
      </div>

      <SegmentedTabs
        active={tab}
        onChange={setTab}
        tabs={[
          ["overview", "Overview"],
          ["applications", "Applications"],
          ["eligibility", "Eligibility"],
          ["github", "Activity"],
          ["insights", "AI & Reports"],
        ]}
      />

      {tab === "overview" && (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <ChartPanel title="Users Per Certification" subtitle="Real enrollment counts grouped by certification">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.users_per_certification || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={80} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="users" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <Panel title="Admin Modules">
            <div className="grid gap-3 sm:grid-cols-2">
              {adminLinks.map(([label, to]) => <ActionLink key={label} to={to}>{label}</ActionLink>)}
            </div>
          </Panel>

          <ChartPanel title="Voucher Status" subtitle="Voucher lifecycle distribution from DB">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.voucher_status || []} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                  {(charts.voucher_status || []).map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Drive Status Mix" subtitle="Open, planned, completed, and closed drives">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.drive_status || []} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                  {(charts.drive_status || []).map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Drive Registration Volume" subtitle="Top drives by user applications">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.drive_activity || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={80} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="registrations" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <Panel title="Exam Eligibility Outcomes" subtitle="Counts from eligibility tests before users enroll for exams">
            <MiniBars rows={charts.eligibility_tests || []} />
          </Panel>

          <Panel title="Drive Result Outcomes" subtitle="Assessment results for completed and conducted drives">
            <MiniBars rows={charts.drive_results || []} />
          </Panel>

          <Panel title="Audit Stream" subtitle="Latest admin-side audit events">
            <ActivityRows rows={data.admin_activity || []} />
          </Panel>
        </div>
      )}

      {tab === "applications" && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Application Status" subtitle="Current admin review queue">
            {(data.review_queue || []).length === 0 ? (
              <EmptyText>No pending reviews in the database.</EmptyText>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Certification</th>
                      <th className="px-4 py-3">Progress</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.review_queue.map((row) => (
                      <tr key={row.id} className="transition hover:bg-white/[0.03]">
                        <td className="px-4 py-3 text-slate-300">{row.user}</td>
                        <td className="px-4 py-3 font-medium text-white">{row.certification}</td>
                        <td className="px-4 py-3 text-slate-400">{row.progress_percent}%</td>
                        <td className="px-4 py-3"><StatusPill tone="amber">{row.status}</StatusPill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Workflow Queue" subtitle="BRD operational sequence">
            <div className="space-y-3">
              {["Review applications", "Approve documents", "Assign vouchers", "Update results", "Monitor analytics"].map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-sm font-bold text-indigo-200">{index + 1}</span>
                  <span className="text-sm font-semibold text-slate-200">{step}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === "eligibility" && (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <ChartPanel title="Eligibility Tests" subtitle="Stored user test outcomes">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.eligibility_tests || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <Panel title="Recent Test Attempts" subtitle="Certificate-specific user readiness attempts">
            {(data.eligibility_activity || []).length === 0 ? (
              <EmptyText>No eligibility attempts are stored yet.</EmptyText>
            ) : (
              <div className="space-y-3">
                {data.eligibility_activity.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h4 className="truncate font-semibold text-white">{item.certification}</h4>
                        <p className="truncate text-sm text-slate-400">{item.user}</p>
                      </div>
                      <StatusPill tone={item.passed ? "green" : "amber"}>{item.score}%</StatusPill>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === "github" && (
        <Panel title="Activity" subtitle="Contribution calendar across users, enrollments, tasks, vouchers, and eligibility tests">
          <ActivityHeatmap heatmapData={heatmap.data?.heatmap || {}} />
        </Panel>
      )}

      {tab === "insights" && (
        <div className="grid gap-6 xl:grid-cols-3">
          {(data.tooling || []).map((tool) => (
            <Panel key={tool.name} title={tool.name} subtitle="BRD platform capability">
              <p className="text-sm leading-6 text-slate-400">{tool.use}</p>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityRows({ rows }) {
  if (!rows.length) return <EmptyText>No admin activity yet.</EmptyText>;
  return (
    <div className="max-h-[420px] space-y-3 overflow-auto pr-1">
      {rows.map((item) => (
        <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-semibold text-white">{item.action}</h4>
            <StatusPill tone="blue">{item.entity}</StatusPill>
          </div>
          <p className="mt-2 text-xs text-slate-500">User #{item.actor_user_id || "system"} - {new Date(item.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

function UserOverview() {
  const dash = useAsyncData(() => dashboardApi.me().then((r) => r.data), []);
  const charts = useAsyncData(() => dashboardApi.charts().then((r) => r.data), []);
  const heatmap = useAsyncData(() => dashboardApi.heatmap().then((r) => r.data), []);
  const [tab, setTab] = useState("overview");

  const d = dash.data || {};
  const status = d.charts?.certification_status || {};
  const total = d.enrollments?.total || 0;
  const completed = status.completed || 0;
  const pieData = [
    { name: "Completed", value: status.completed || 0 },
    { name: "Pending", value: status.pending || 0 },
    { name: "In Progress", value: status.in_progress || 0 },
    { name: "Not Started", value: status.not_started || 0 },
  ].filter((x) => x.value > 0);
  const currentCerts = d.current_certifications || [];
  const nextCert = currentCerts[0];
  const insight = useMemo(() => {
    if (!total) return "Browse certifications and take the eligibility test to start your journey.";
    if (completed === total) return "All enrolled certifications are complete. Check available certifications for the next goal.";
    return `${Math.max(0, total - completed)} certification${total - completed === 1 ? "" : "s"} still need attention.`;
  }, [completed, total]);

  if (dash.loading && !dash.data) return <CardSkeleton />;

  return (
    <div className="space-y-6 text-slate-100">
      <ShellHeader
        label="User Dashboard"
        title="Personal Progress View"
        subtitle="A private view for your certification movement, current application state, activity rhythm, and AI-style guidance. Admin-only user and platform counts stay out of this workspace."
        actions={
          <>
            <Link to="/certifications" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30">Browse Certifications</Link>
            <Link to="/uploads" className="rounded-xl border border-white/20 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white">Upload Docs</Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["Application Focus", nextCert ? `Continue ${nextCert.title}` : "Choose a certification to begin"],
          ["Preparation Flow", "Use tasks, uploads, and reminders to keep the journey moving"],
          ["AI Guidance", insight],
        ].map(([label, body]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.06]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">{label}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
          </div>
        ))}
      </div>

      <SegmentedTabs
        active={tab}
        onChange={setTab}
        tabs={[
          ["overview", "Overview"],
          ["certifications", "Current Certifications"],
          ["github", "Activity"],
          ["insights", "AI Insights"],
        ]}
      />

      {tab === "overview" && (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <ChartPanel title="Monthly Trend" subtitle="Enrollment and completion trend from your account">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.data?.monthly_progress || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="enrollments" stroke="#6366f1" fill="#6366f155" />
                <Area type="monotone" dataKey="completed" stroke="#10b981" fill="#10b98155" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>

          <Panel title="Application Status" subtitle="Your certification portfolio">
            <div className="h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={105} paddingAngle={4}>
                    {pieData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Next Certification" subtitle="Most recent active certification">
            {nextCert ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-white">{nextCert.title}</h4>
                    <p className="mt-1 text-sm text-slate-400">{nextCert.provider}</p>
                  </div>
                  <StatusPill tone="blue">{nextCert.status}</StatusPill>
                </div>
                <div className="mt-4 h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.min(100, nextCert.progress || 0)}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {nextCert.progress || 0}% complete
                  {nextCert.target_completion_date ? ` - Target: ${nextCert.target_completion_date}` : " - No target date set"}
                </p>
              </div>
            ) : (
              <EmptyText>No active certification is stored for your account.</EmptyText>
            )}
          </Panel>

          <Panel title="Quick Actions" subtitle="Common certification tasks">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Take eligibility test", "/certifications"],
                ["Track enrollments", "/enrollments"],
                ["Upload documents", "/uploads"],
                ["View vouchers", "/vouchers"],
              ].map(([label, to]) => <ActionLink key={label} to={to}>{label}</ActionLink>)}
            </div>
          </Panel>
        </div>
      )}

      {tab === "certifications" && (
        <Panel title="Current Certifications" subtitle="Active certification records from your dashboard API">
          {currentCerts.length === 0 ? (
            <EmptyText>No active certifications yet. Enroll from the certifications page after passing the eligibility test.</EmptyText>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {currentCerts.map((cert) => (
                <Link key={cert.enrollment_id || cert.id} to={`/learning/${cert.enrollment_id}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-indigo-400/40 hover:bg-white/[0.06]">
                  <StatusPill tone="blue">{cert.status}</StatusPill>
                  <h4 className="mt-3 font-semibold text-white">{cert.title}</h4>
                  <p className="mt-1 text-sm text-slate-400">{cert.provider}</p>
                  <div className="mt-4 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.min(100, cert.progress || 0)}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{cert.progress || 0}% complete</p>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === "github" && (
        <Panel title="Activity" subtitle="Your contribution calendar from enrollments, completions, tasks, and vouchers">
          <ActivityHeatmap heatmapData={heatmap.data?.heatmap || {}} />
        </Panel>
      )}

      {tab === "insights" && (
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Panel title="AI Insight Panel" subtitle="Derived from your real dashboard metrics">
            <p className="text-sm leading-6 text-slate-400">{insight}</p>
          </Panel>
          <Panel title="Recommended Next Steps" subtitle="No generated sample data; these are workflow links">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Browse", "/certifications"],
                ["Tasks", "/tasks"],
                ["Notifications", "/notifications"],
              ].map(([label, to]) => <ActionLink key={label} to={to}>{label}</ActionLink>)}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminOverview /> : <UserOverview />;
}
