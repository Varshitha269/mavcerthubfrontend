import React, { useState } from "react";
import { adminApi, aiApi, communicationsApi } from "../services/api.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { CardSkeleton } from "../components/Skeleton.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const panel = "rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-xl shadow-black/20";

export function SupportAdminPage() {
  const toast = useToast();
  const { user } = useAuth();
  const data = useAsyncData(() => communicationsApi.adminSupport().then((r) => r.data), []);
  const emailLogs = useAsyncData(() => adminApi.emailLogs().then((r) => r.data), []);
  const [busyId, setBusyId] = useState(null);
  const [aiBusyId, setAiBusyId] = useState(null);
  const [draft, setDraft] = useState(null);

  async function decide(row, status) {
    setBusyId(row.id);
    try {
      await communicationsApi.decideSupport(row.id, {
        status,
        resolution: status === "resolved" ? "Request approved and updated." : "Request reviewed.",
      });
      toast.success("Support request updated");
      data.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Unable to update support request");
    } finally {
      setBusyId(null);
    }
  }

  async function generateDraft(row) {
    setAiBusyId(row.id);
    try {
      const { data: result } = await aiApi.reminderMessage({
        type: row.type || "support",
        audience: row.email,
        context: `Role: ${user?.role}. Support request #${row.id}. Status: ${row.status}. Registration: ${row.registration_id || "not linked"}. Requested slot: ${row.requested_slot || "none"}. Message: ${row.message || ""}`,
      });
      setDraft({ row, ...result });
      toast.success("AI support draft generated");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Unable to generate AI draft");
    } finally {
      setAiBusyId(null);
    }
  }

  if (data.loading && !data.data) return <CardSkeleton />;
  const rows = data.data || [];
  const canResolve = user?.role === "admin" || user?.role === "coordinator";
  const canDraft = user?.role !== "read_only";
  const logs = emailLogs.data || [];
  const recentLogs = logs.slice(0, 8);
  const deliveryStats = {
    sent: logs.filter((log) => log.success).length,
    failed: logs.filter((log) => !log.success).length,
    throttled: logs.filter((log) => /TooManyRequests|thrott/i.test(log.error || "")).length,
  };
  const stats = {
    open: rows.filter((r) => r.status === "open").length,
    review: rows.filter((r) => r.status === "in_review").length,
    resolved: rows.filter((r) => r.status === "resolved").length,
    reschedule: rows.filter((r) => r.type === "reschedule").length,
  };
  const roleCopy = {
    admin: "Admin monitors SLA, failure patterns, escalations, and broadcast follow-ups.",
    coordinator: "Coordinator resolves registration help, slot changes, and candidate follow-ups.",
    approver: "Approver uses support context for eligibility exceptions and document disputes.",
    read_only: "Read-only users monitor support volume and SLA risk without changing records.",
  }[user?.role] || "Support queue for certification workflow requests.";

  function friendlyEmailStatus(log) {
    if (log.success) return { label: "Sent", detail: "Email was accepted by the provider.", cls: "bg-emerald-500/10 text-emerald-200" };
    const error = log.error || "";
    if (/TooManyRequests|thrott/i.test(error)) {
      return { label: "Delayed", detail: "Azure throttled this email. The system will retry later.", cls: "bg-amber-500/10 text-amber-200" };
    }
    if (/module named 'azure\.communication'|No module named/i.test(error)) {
      return { label: "Setup Needed", detail: "Email package/configuration was missing when this attempt ran.", cls: "bg-rose-500/10 text-rose-200" };
    }
    return { label: "Failed", detail: "Email could not be delivered. Check provider configuration or recipient address.", cls: "bg-rose-500/10 text-rose-200" };
  }

  return (
    <div className="space-y-6 text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-cyan-500/20 before:via-fuchsia-500/10 before:to-transparent">
        <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">BRD Support Desk</p>
        <h2 className="mt-3 font-display text-3xl font-bold">Support and Reschedule Requests</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">{roleCopy}</p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Open", stats.open],
          ["In Review", stats.review],
          ["Resolved", stats.resolved],
          ["Reschedule", stats.reschedule],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-center shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:border-cyan-300/30">
            <div className="font-display text-3xl font-bold text-white">{value}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      <section className={`${panel} grid gap-4 lg:grid-cols-3`}>
        {[
          ["STATUS", "User asks for application or eligibility state. Reply with latest registration status and next step."],
          ["HELP", "User reports an issue, rejection, missing mail, voucher, upload, or workflow confusion."],
          ["RESCHEDULE", "User requests a new slot. Coordinator can update slot when resolved."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4 transition hover:-translate-y-1">
            <div className="font-display text-lg font-bold text-white">{title}</div>
            <p className="mt-2 text-sm leading-6 text-cyan-50/80">{body}</p>
          </div>
        ))}
      </section>

      <section className={panel}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-white">Request Queue</h3>
            <p className="mt-1 text-sm text-slate-400">Use AI Draft to prepare candidate replies, then resolve/reject after action.</p>
          </div>
          {draft && <button onClick={() => setDraft(null)} className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200">Clear AI Draft</button>}
        </div>
        {draft && (
          <div className="mb-4 rounded-2xl border border-fuchsia-300/20 bg-fuchsia-400/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-fuchsia-200">AI Draft for request #{draft.row.id}</p>
            <h4 className="mt-2 font-semibold text-white">{draft.subject}</h4>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-fuchsia-50">{draft.message}</p>
          </div>
        )}
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Registration</th>
                <th className="px-4 py-3">Slot</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data.data || []).map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-slate-300">{row.email}</td>
                  <td className="px-4 py-3 font-semibold text-white">{row.type}</td>
                  <td className="px-4 py-3 text-slate-400">#{row.registration_id || "-"}</td>
                  <td className="px-4 py-3 text-slate-400">{row.requested_slot || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-xs font-semibold text-cyan-100">{row.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {canResolve && <button disabled={busyId === row.id || row.status === "resolved"} onClick={() => decide(row, "resolved")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Resolve</button>}
                      {canResolve && <button disabled={busyId === row.id || row.status === "rejected"} onClick={() => decide(row, "rejected")} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 disabled:opacity-50">Reject</button>}
                      {canDraft && <button disabled={aiBusyId === row.id} onClick={() => generateDraft(row)} className="rounded-lg border border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-1.5 text-xs font-semibold text-fuchsia-100 disabled:opacity-50">{aiBusyId === row.id ? "AI..." : "AI Draft"}</button>}
                      {!canResolve && !canDraft && <span className="text-xs text-slate-500">View only</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data.data || []).length === 0 && <p className="p-5 text-sm text-slate-400">No support requests yet.</p>}
        </div>
      </section>

      <section className={panel}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-white">Email Delivery Health</h3>
            <p className="mt-1 text-sm text-slate-400">BRD SLA monitoring belongs here, not in the learner panel.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">{deliveryStats.sent} sent</span>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-200">{deliveryStats.throttled} delayed</span>
            <span className="rounded-full bg-rose-500/10 px-3 py-1 text-rose-200">{deliveryStats.failed} failed</span>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {recentLogs.map((log) => {
            const status = friendlyEmailStatus(log);
            return (
              <div key={log.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{log.subject}</div>
                    <p className="mt-1 truncate text-xs text-slate-500">{log.to_email}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}>{status.label}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{status.detail}</p>
              </div>
            );
          })}
          {recentLogs.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">No email attempts logged yet.</p>}
        </div>
      </section>
    </div>
  );
}
