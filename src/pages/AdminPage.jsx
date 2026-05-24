import React, { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { adminApi, aiApi, exportsApi, notificationsApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Modal } from "../components/Modal.jsx";
import { Table } from "../components/Table.jsx";
import { CardSkeleton } from "../components/Skeleton.jsx";
import { FormattedMessage } from "../components/FormattedMessage.jsx";

const inputClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50";
const emptyBroadcast = {
  title: "",
  message: "",
  link_url: "/home",
  priority: "medium",
  image_url: "",
  icon: "announcement",
  scheduled_at: "",
  expires_at: "",
  push_enabled: true,
  email_enabled: true,
  audience: "active_users",
  content_format: "plain",
};
const emptyReminder = {
  user_scope: "active",
  user_id: "",
  enrollment_status: "pending",
  include_broadcast_expiry: true,
  broadcast_expiry_days: 7,
};

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : "";
}

function timeOnly(value) {
  const raw = value ? String(value) : "";
  if (!raw.includes("T")) return "";
  return raw.split("T")[1]?.slice(0, 5) || "";
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function currentTime() {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

function defaultPickerTime(mode) {
  return mode === "expiry" ? "23:59" : currentTime();
}

function displayDate(value) {
  const raw = dateOnly(value);
  if (!raw) return "dd-mm-yyyy";
  const [year, month, day] = raw.split("-");
  return `${day}-${month}-${year}`;
}

function displayDateTime(value) {
  if (!dateOnly(value)) return "dd-mm-yyyy --:--";
  return `${displayDate(value)} ${timeOnly(value) || "--:--"}`;
}

function DateTimePicker({ label, value, onChange, mode }) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);
  const selected = dateOnly(value);
  const selectedTime = timeOnly(value);
  const base = selected ? new Date(`${selected}T00:00:00`) : new Date();
  const [cursor, setCursor] = useState(new Date(base.getFullYear(), base.getMonth(), 1));
  const [draftTime, setDraftTime] = useState(selectedTime || defaultPickerTime(mode));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthTitle = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  useEffect(() => {
    if (!open) return undefined;

    function handleOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKey(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const nextBase = selected ? new Date(`${selected}T00:00:00`) : new Date();
    setCursor(new Date(nextBase.getFullYear(), nextBase.getMonth(), 1));
    setDraftTime(selectedTime || defaultPickerTime(mode));
  }, [mode, open, selected, selectedTime]);

  function chooseDate(day) {
    const yyyy = String(year);
    const mm = pad2(month + 1);
    const dd = pad2(day);
    onChange(`${yyyy}-${mm}-${dd}T${draftTime || defaultPickerTime(mode)}`);
    setOpen(false);
  }

  function applyTime() {
    if (!selected) return;
    onChange(`${selected}T${draftTime || defaultPickerTime(mode)}`);
    setOpen(false);
  }

  function clearValue() {
    onChange("");
    setOpen(false);
  }

  return (
    <div ref={pickerRef} className="relative">
      <label className="text-xs text-slate-500">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${inputClass} flex items-center justify-between text-left`}
      >
        <span className={selected ? "text-white" : "text-slate-400"}>{displayDateTime(value)}</span>
        <span className="text-xs text-slate-500">date + time</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 rounded-2xl border border-white/10 bg-slate-950 p-3 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between gap-2">
            <button type="button" className="rounded-lg px-2 py-1 text-slate-300 hover:bg-white/10" onClick={() => setCursor(new Date(year, month - 1, 1))}>
              &lt;
            </button>
            <div className="text-sm font-semibold text-white">{monthTitle}</div>
            <button type="button" className="rounded-lg px-2 py-1 text-slate-300 hover:bg-white/10" onClick={() => setCursor(new Date(year, month + 1, 1))}>
              &gt;
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500">
            {["S", "M", "T", "W", "T", "F", "S"].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <span key={`blank-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const mm = pad2(month + 1);
              const dd = pad2(day);
              const isSelected = selected === `${year}-${mm}-${dd}`;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => chooseDate(day)}
                  className={`rounded-lg py-1.5 text-sm transition ${isSelected ? "bg-cyan-400 text-slate-950" : "text-slate-200 hover:bg-white/10"}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <label className="mt-3 block text-xs font-semibold text-slate-500">
            Time
            <input
              type="time"
              className={`${inputClass} mt-1`}
              value={draftTime}
              onChange={(e) => setDraftTime(e.target.value)}
            />
          </label>
          <div className="mt-3 flex justify-between gap-2">
            <button type="button" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10" onClick={clearValue}>
              Clear
            </button>
            <div className="flex gap-2">
              <button type="button" className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10" onClick={() => setOpen(false)}>
                Close
              </button>
              <button type="button" className="rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50" onClick={applyTime} disabled={!selected}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const users = useAsyncData(() => adminApi.listUsers().then((r) => r.data), []);
  const brd = useAsyncData(() => adminApi.brdOverview().then((r) => r.data), []);
  const dropout = useAsyncData(() => aiApi.adminDropoutRisk().then((r) => r.data), []);

  const [createOpen, setCreateOpen] = useState(false);
  const [create, setCreate] = useState({ email: "", password: "", full_name: "", role: "user", is_active: true });
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [broadcast, setBroadcast] = useState(emptyBroadcast);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminder, setReminder] = useState(emptyReminder);
  const [aiDriveId, setAiDriveId] = useState("");
  const [aiDriveSummary, setAiDriveSummary] = useState(null);
  const [aiDriveReport, setAiDriveReport] = useState(null);
  const [aiReminder, setAiReminder] = useState({ type: "risk", audience: "learners", context: "" });
  const [aiReminderResult, setAiReminderResult] = useState(null);
  const [adminQuery, setAdminQuery] = useState("Show users who passed but have not received voucher");
  const [adminQueryResult, setAdminQueryResult] = useState(null);
  const [fraudResult, setFraudResult] = useState(null);
  const [aiBusy, setAiBusy] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isAdmin) return <Navigate to="/home" replace />;
  if ((users.loading && !users.data) || (brd.loading && !brd.data)) return <CardSkeleton />;

  async function createUser(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.createUser(create);
      toast.success("User created.");
      setCreateOpen(false);
      setCreate({ email: "", password: "", full_name: "", role: "user", is_active: true });
      users.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendBroadcast(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await notificationsApi.broadcast({
        title: broadcast.title,
        message: broadcast.message,
        link_url: broadcast.link_url || null,
        priority: broadcast.priority,
        image_url: broadcast.image_url || null,
        icon: broadcast.icon || null,
        scheduled_at: broadcast.scheduled_at || null,
        expires_at: broadcast.expires_at || null,
        push_enabled: broadcast.push_enabled,
        email_enabled: broadcast.email_enabled,
        audience: broadcast.audience,
        content_format: broadcast.content_format,
      });
      toast.success(
        data.scheduled
          ? `Scheduled for ${data.sent} recipients.`
          : `Broadcast sent to ${data.sent} recipients. Emails sent: ${data.emails_sent ?? 0}.`
      );
      setBroadcastOpen(false);
      setBroadcast(emptyBroadcast);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function exportUsers() {
    setBusy(true);
    try {
      const { data } = await exportsApi.usersCsv();
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "users-certification-activity.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Users export downloaded.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Users export failed");
    } finally {
      setBusy(false);
    }
  }

  async function runReminders(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await adminApi.runReminders({
        ...reminder,
        user_id: reminder.user_id || null,
        broadcast_expiry_days: Number(reminder.broadcast_expiry_days) || 7,
      });
      toast.success(
        `Reminders created. Certificates checked: ${data.checked}, emails sent: ${data.sent}, broadcast reminders: ${data.broadcast_expiry_reminders}.`
      );
      setReminderOpen(false);
      brd.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to run reminders");
    } finally {
      setBusy(false);
    }
  }

  async function loadAiDriveSummary() {
    if (!aiDriveId) {
      toast.error("Enter a Drive ID first.");
      return;
    }
    setAiBusy("summary");
    try {
      const { data } = await aiApi.adminDriveSummary(Number(aiDriveId));
      setAiDriveSummary(data);
      toast.success("AI drive summary loaded.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setAiBusy("");
    }
  }

  async function loadAiDriveReport() {
    if (!aiDriveId) {
      toast.error("Enter a Drive ID first.");
      return;
    }
    setAiBusy("report");
    try {
      const { data } = await aiApi.adminDriveReport(Number(aiDriveId));
      setAiDriveReport(data);
      toast.success("AI drive report generated.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setAiBusy("");
    }
  }

  async function generateAiReminder() {
    setAiBusy("reminder");
    try {
      const { data } = await aiApi.reminderMessage(aiReminder);
      setAiReminderResult(data);
      toast.success("AI reminder message generated.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setAiBusy("");
    }
  }

  async function runNaturalLanguageQuery() {
    if (!adminQuery.trim()) {
      toast.error("Enter an admin query first.");
      return;
    }
    setAiBusy("nl-query");
    try {
      const { data } = await aiApi.adminNaturalLanguageQuery({ query: adminQuery, limit: 25 });
      setAdminQueryResult(data);
      toast.success("Admin query answered.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Admin query failed");
    } finally {
      setAiBusy("");
    }
  }

  async function runFraudScan() {
    setAiBusy("fraud");
    try {
      const { data } = await aiApi.adminFraudDuplicateDetection();
      setFraudResult(data);
      toast.success("Fraud and duplicate scan complete.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Fraud scan failed");
    } finally {
      setAiBusy("");
    }
  }

  const metrics = brd.data?.metrics || {};
  const userRows = users.data || [];
  const userPowerRows = [
    { label: "Active", value: userRows.filter((u) => u.is_active).length },
    { label: "Inactive", value: userRows.filter((u) => !u.is_active).length },
    { label: "Admins", value: userRows.filter((u) => u.role === "admin").length },
    { label: "Learners", value: userRows.filter((u) => u.role === "user").length },
  ];
  const maxUserPower = Math.max(1, ...userPowerRows.map((r) => r.value));
  const fmtDate = (value) => value ? new Date(value).toLocaleString() : "Not recorded";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Admin Console</h2>
          <p className="text-slate-400">Review applications, approve documents, assign vouchers, update results, and monitor analytics.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={exportUsers} loading={busy}>Export Users</Button>
          <Button variant="ghost" onClick={() => setReminderOpen(true)}>Run Reminders</Button>
          <Button variant="ghost" onClick={() => setBroadcastOpen(true)}>Broadcast</Button>
          <Button onClick={() => setCreateOpen(true)}>New User</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Pending Reviews", metrics.pending_reviews ?? 0],
          ["Pending Documents", metrics.pending_documents ?? 0],
          ["Issued Vouchers", metrics.issued_vouchers ?? 0],
          ["Used Vouchers", metrics.used_vouchers ?? 0],
          ["Success Rate", `${metrics.success_rate ?? 0}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
            <div className="mt-2 font-display text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card title="Review Queue" subtitle="Applications waiting for admin review">
          <Table
            columns={[
              { key: "id", label: "Enrollment" },
              { key: "user", label: "User" },
              { key: "certification", label: "Certification" },
              { key: "status", label: "Status" },
              { key: "progress_percent", label: "%" },
            ]}
            rows={brd.data?.review_queue || []}
            emptyMessage="No pending reviews."
          />
        </Card>

        <Card title="Admin Workflows" subtitle="BRD operations">
          <div className="grid gap-3">
            {[
              ["Review applications", "/enrollments"],
              ["Approve documents", "/uploads"],
              ["Assign vouchers", "/vouchers"],
              ["Update results", "/admin-brd/results"],
              ["Power BI analytics", "/dashboard"],
            ].map(([label, to]) => (
              <Link key={label} to={to} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition hover:border-indigo-400/40">
                {label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card title="AI And Power Platform Tools" subtitle="Tools included in the BRD implementation">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(brd.data?.tooling || []).map((tool) => (
            <div key={tool.name} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="font-semibold text-white">{tool.name}</div>
              <p className="mt-2 text-sm text-slate-400">{tool.use}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Power BI-style User Analysis" subtitle="Quick access split and activity signals from user, enrollment, registration, and eligibility data">
        <div className="grid gap-3 md:grid-cols-4">
          {userPowerRows.map((row, index) => (
            <div key={row.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{row.label}</div>
              <div className="mt-2 font-display text-2xl font-bold text-white">{row.value}</div>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${(row.value / maxUserPower) * 100}%`, backgroundColor: ["#10b981", "#ef4444", "#6366f1", "#06b6d4"][index] }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="AI Admin Insights & Reminder Generator" subtitle="Drive risks, one-click report, delay prediction, and message drafting inside the admin console">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-slate-500">Drive ID</label>
                <input className={inputClass} value={aiDriveId} onChange={(e) => setAiDriveId(e.target.value)} />
              </div>
              <Button variant="ghost" loading={aiBusy === "summary"} onClick={loadAiDriveSummary}>AI Summary</Button>
              <Button variant="ghost" loading={aiBusy === "report"} onClick={loadAiDriveReport}>One-click Report</Button>
            </div>
            {aiDriveSummary && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="font-semibold text-white">Drive risk summary</h3>
                <p className="mt-2 text-sm text-slate-400">{aiDriveSummary.summary}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Risks</div>
                    <div className="space-y-2">
                      {(aiDriveSummary.risks || []).map((risk) => <div key={risk} className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{risk}</div>)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Next actions</div>
                    <div className="space-y-2">
                      {(aiDriveSummary.next_actions || []).map((action) => <div key={action} className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">{action}</div>)}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {aiDriveReport && (
              <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4">
                <h3 className="font-semibold text-white">{aiDriveReport.title}</h3>
                <p className="mt-2 text-sm text-indigo-100">{aiDriveReport.executive_summary}</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-slate-500">Reminder type</label>
                <select className={inputClass} value={aiReminder.type} onChange={(e) => setAiReminder({ ...aiReminder, type: e.target.value })}>
                  <option value="risk">Risk</option>
                  <option value="progress">Progress</option>
                  <option value="voucher">Voucher</option>
                  <option value="drive">Drive</option>
                  <option value="upload">Upload</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Audience</label>
                <input className={inputClass} value={aiReminder.audience} onChange={(e) => setAiReminder({ ...aiReminder, audience: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Context</label>
                <textarea className={`${inputClass} min-h-[80px]`} value={aiReminder.context} onChange={(e) => setAiReminder({ ...aiReminder, context: e.target.value })} />
              </div>
            </div>
            <Button loading={aiBusy === "reminder"} onClick={generateAiReminder}>Generate AI Reminder</Button>
            {aiReminderResult && (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-semibold text-white">{aiReminderResult.subject}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{aiReminderResult.message}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card title="AI Dropout / Delay Risk Prediction" subtitle="Learners who may need admin support or reminders">
        <Table
          rows={dropout.data?.risks || []}
          maxHeight={360}
          columns={[
            { key: "user", label: "User" },
            { key: "certification", label: "Certification" },
            { key: "risk_score", label: "Risk", render: (row) => `${row.risk_score}%` },
            { key: "risk_level", label: "Level" },
            { key: "overdue_tasks", label: "Overdue" },
            { key: "recommended_action", label: "Action" },
          ]}
          emptyMessage={dropout.loading ? "Loading AI risk predictions..." : "No medium or high delay risk detected."}
        />
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Natural Language Admin Querying" subtitle="Ask operational questions across registrations, vouchers, drives, and users">
          <div className="mb-4 space-y-3">
            <textarea className={`${inputClass} min-h-[90px]`} value={adminQuery} onChange={(e) => setAdminQuery(e.target.value)} />
            <Button loading={aiBusy === "nl-query"} onClick={runNaturalLanguageQuery}>Ask Admin Query</Button>
          </div>
          {adminQueryResult && <p className="mb-3 text-sm text-slate-400">{adminQueryResult.explanation}</p>}
          <Table
            rows={adminQueryResult?.rows || []}
            maxHeight={320}
            columns={[
              { key: "registration_id", label: "Reg" },
              { key: "drive_id", label: "Drive" },
              { key: "candidate_email", label: "Candidate" },
              { key: "status", label: "Status" },
              { key: "reason", label: "Reason" },
            ]}
            emptyMessage="Ask a query to view matching rows."
          />
        </Card>

        <Card title="Fraud / Duplicate Detection" subtitle="Flags duplicate registrations, repeated attempts, duplicate vouchers, and certificate mismatches">
          <Button className="mb-4" variant="ghost" loading={aiBusy === "fraud"} onClick={runFraudScan}>Run Fraud Scan</Button>
          {fraudResult && <p className="mb-3 text-sm text-slate-400">{fraudResult.summary}</p>}
          <Table
            rows={fraudResult?.flags || []}
            maxHeight={320}
            columns={[
              { key: "type", label: "Type" },
              { key: "severity", label: "Severity" },
              { key: "email", label: "Candidate" },
              { key: "drive_id", label: "Drive" },
              { key: "reason", label: "Reason" },
            ]}
            emptyMessage="Run the scan to view fraud and duplicate signals."
          />
        </Card>
      </div>

      <Card
        title="Users"
        subtitle="Registration date, last recorded login, active status, role, and learning activity"
        actions={<Button variant="ghost" className="!py-1.5 !text-xs" onClick={() => setReminderOpen(true)}>Run Certificate Reminders</Button>}
      >
        <Table
          columns={[
            { key: "id", label: "ID" },
            { key: "email", label: "Email" },
            { key: "full_name", label: "Name" },
            { key: "role", label: "Role" },
            {
              key: "is_active",
              label: "Status",
              render: (u) => (
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.is_active ? "bg-emerald-500/15 text-emerald-200" : "bg-rose-500/15 text-rose-200"}`}>
                  {u.is_active ? "Active" : "Inactive"}
                </span>
              ),
            },
            { key: "created_at", label: "Registered", render: (u) => fmtDate(u.created_at) },
            { key: "last_login_at", label: "Last Login", render: (u) => fmtDate(u.last_login_at) },
            { key: "registration_count", label: "Regs" },
            { key: "enrollment_count", label: "Enrollments" },
            { key: "completed_count", label: "Done" },
            { key: "avg_eligibility_score", label: "Avg Test", render: (u) => u.avg_eligibility_score == null ? "-" : `${u.avg_eligibility_score}%` },
          ]}
          rows={userRows}
        />
      </Card>

      <Modal
        open={reminderOpen}
        title="Run reminders"
        onClose={() => setReminderOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReminderOpen(false)}>Cancel</Button>
            <Button type="submit" form="reminder-form" loading={busy}>Run Now</Button>
          </>
        }
      >
        <form id="reminder-form" onSubmit={runReminders} className="space-y-3">
          <p className="text-sm leading-6 text-slate-400">
            Send reminders for pending or overdue certification enrollments. You can target all active users, inactive users, everyone, or a single user ID. Broadcast expiry reminders are created for announcements that close soon.
          </p>
          <div>
            <label className="text-xs text-slate-500">User audience</label>
            <select className={inputClass} value={reminder.user_scope} onChange={(e) => setReminder({ ...reminder, user_scope: e.target.value })}>
              <option value="active">Active users</option>
              <option value="inactive">Inactive users</option>
              <option value="all">All users</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Particular user ID</label>
            <input className={inputClass} value={reminder.user_id} onChange={(e) => setReminder({ ...reminder, user_id: e.target.value })} placeholder="Leave blank for selected audience" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Certificate enrollment status</label>
            <select className={inputClass} value={reminder.enrollment_status} onChange={(e) => setReminder({ ...reminder, enrollment_status: e.target.value })}>
              <option value="pending">Pending users: selected or in progress</option>
              <option value="selected">Selected only</option>
              <option value="in_progress">In progress only</option>
              <option value="saved_for_later">Saved for later</option>
              <option value="all">All enrollments</option>
            </select>
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm font-semibold text-slate-200">
            <input
              type="checkbox"
              checked={reminder.include_broadcast_expiry}
              onChange={(e) => setReminder({ ...reminder, include_broadcast_expiry: e.target.checked })}
            />
            Include broadcasts with expiration dates
          </label>
          <div>
            <label className="text-xs text-slate-500">Broadcast expires within days</label>
            <input
              className={inputClass}
              type="number"
              min="1"
              max="60"
              value={reminder.broadcast_expiry_days}
              onChange={(e) => setReminder({ ...reminder, broadcast_expiry_days: e.target.value })}
              disabled={!reminder.include_broadcast_expiry}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={createOpen}
        title="Create user"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" form="adm-user" loading={busy}>Create</Button>
          </>
        }
      >
        <form id="adm-user" onSubmit={createUser} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Email</label>
            <input className={inputClass} type="email" value={create.email} onChange={(e) => setCreate({ ...create, email: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-slate-500">Password</label>
            <input className={inputClass} type="password" value={create.password} onChange={(e) => setCreate({ ...create, password: e.target.value })} required minLength={6} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Full name</label>
            <input className={inputClass} value={create.full_name} onChange={(e) => setCreate({ ...create, full_name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Role</label>
            <select className={inputClass} value={create.role} onChange={(e) => setCreate({ ...create, role: e.target.value })}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
        </form>
      </Modal>

      <Modal
        open={broadcastOpen}
        title="Broadcast notification"
        onClose={() => setBroadcastOpen(false)}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBroadcastOpen(false)}>Cancel</Button>
            <Button variant="ghost" onClick={() => setPreviewOpen(true)}>Preview</Button>
            <Button type="submit" form="bc-form" loading={busy}>Send</Button>
          </>
        }
      >
        <form id="bc-form" onSubmit={sendBroadcast} className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">Title</label>
            <input className={inputClass} value={broadcast.title} onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-slate-500">Priority Level</label>
            <select className={inputClass} value={broadcast.priority} onChange={(e) => setBroadcast({ ...broadcast, priority: e.target.value })}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Audience Selector</label>
            <select className={inputClass} value={broadcast.audience} onChange={(e) => setBroadcast({ ...broadcast, audience: e.target.value })}>
              <option value="active_users">All active users</option>
              <option value="learners">Learners only</option>
              <option value="admins">Admins only</option>
              <option value="all_users">All users including inactive</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Broadcast Icon</label>
            <select className={inputClass} value={broadcast.icon} onChange={(e) => setBroadcast({ ...broadcast, icon: e.target.value })}>
              <option value="announcement">Announcement</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="certificate">Certificate</option>
              <option value="voucher">Voucher</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Broadcast Image URL</label>
            <input className={inputClass} value={broadcast.image_url} onChange={(e) => setBroadcast({ ...broadcast, image_url: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <DateTimePicker
              label="Schedule Broadcast"
              value={broadcast.scheduled_at}
              mode="schedule"
              onChange={(value) => setBroadcast({ ...broadcast, scheduled_at: value })}
            />
          </div>
          <div>
            <DateTimePicker
              label="Expiry Date"
              value={broadcast.expires_at}
              mode="expiry"
              onChange={(value) => setBroadcast({ ...broadcast, expires_at: value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">Markdown / Rich Text Editor</label>
            <select className={`${inputClass} mb-2`} value={broadcast.content_format} onChange={(e) => setBroadcast({ ...broadcast, content_format: e.target.value })}>
              <option value="plain">Plain text</option>
              <option value="markdown">Markdown</option>
              <option value="rich_text">Rich text / HTML</option>
            </select>
            <textarea className={`${inputClass} min-h-[140px]`} value={broadcast.message} onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })} required />
          </div>
          <div className="md:col-span-2 grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 md:grid-cols-2">
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-200">
              <input type="checkbox" checked={broadcast.push_enabled} onChange={(e) => setBroadcast({ ...broadcast, push_enabled: e.target.checked })} />
              Push Notification Toggle
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-200">
              <input type="checkbox" checked={broadcast.email_enabled} onChange={(e) => setBroadcast({ ...broadcast, email_enabled: e.target.checked })} />
              Email Notification Toggle
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">Link URL</label>
            <input className={`${inputClass} opacity-80`} value="/home" readOnly />
            <p className="mt-1 text-xs text-slate-500">Broadcasts automatically open the user's Home tab.</p>
          </div>
        </form>
      </Modal>

      <Modal
        open={previewOpen}
        title="Broadcast preview"
        onClose={() => setPreviewOpen(false)}
        footer={<Button variant="ghost" onClick={() => setPreviewOpen(false)}>Close Preview</Button>}
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          {broadcast.image_url && <img src={broadcast.image_url} alt="" className="mb-4 max-h-48 w-full rounded-xl object-cover" />}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-500/15 px-2.5 py-1 text-xs font-semibold text-cyan-200">{broadcast.icon}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              broadcast.priority === "high" ? "bg-rose-500/15 text-rose-200" : broadcast.priority === "low" ? "bg-slate-500/15 text-slate-200" : "bg-amber-500/15 text-amber-200"
            }`}>
              {broadcast.priority} priority
            </span>
          </div>
          <h3 className="mt-3 font-display text-xl font-bold text-white">{broadcast.title || "Broadcast title"}</h3>
          <FormattedMessage message={broadcast.message || "Broadcast message preview..."} format={broadcast.content_format} className="mt-2 text-sm leading-6 text-slate-300" />
          <div className="mt-4 grid gap-2 text-xs text-slate-500">
            <span>Audience: {broadcast.audience}</span>
            <span>Format: {broadcast.content_format}</span>
            <span>Scheduled: {broadcast.scheduled_at ? displayDateTime(broadcast.scheduled_at) : "Immediately"}</span>
            <span>Expires: {broadcast.expires_at ? displayDateTime(broadcast.expires_at) : "No expiry"}</span>
            <span>Push: {broadcast.push_enabled ? "on" : "off"} / Email: {broadcast.email_enabled ? "on" : "off"}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
