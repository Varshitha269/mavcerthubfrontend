import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { certificationsApi, enrollmentsApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Modal } from "../components/Modal.jsx";
import { Table } from "../components/Table.jsx";
import { CardSkeleton } from "../components/Skeleton.jsx";

const statuses = ["saved_for_later", "selected", "in_progress", "completed", "cancelled"];

const STATUS_STYLES = {
  saved_for_later: { bg: "rgba(245,158,11,0.1)", text: "#fbbf24", label: "Saved for Later" },
  selected: { bg: "rgba(59,130,246,0.1)", text: "#60a5fa", label: "Selected" },
  in_progress: { bg: "rgba(139,92,246,0.1)", text: "#a78bfa", label: "In Progress" },
  completed: { bg: "rgba(16,185,129,0.1)", text: "#34d399", label: "Completed" },
  cancelled: { bg: "rgba(239,68,68,0.1)", text: "#f87171", label: "Cancelled" },
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || {};
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label || status}
    </span>
  );
}

const inputClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50";

export function EnrollmentsPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const mine = useAsyncData(() => enrollmentsApi.my().then((r) => r.data), []);
  const certs = useAsyncData(() => certificationsApi.list().then((r) => r.data), []);
  const [adminUserId, setAdminUserId] = useState("");
  const [adminCertId, setAdminCertId] = useState("");
  const adminList = useAsyncData(async () => {
    if (!isAdmin) return [];
    return enrollmentsApi
      .adminList({
        user_id: adminUserId ? Number(adminUserId) : undefined,
        certification_id: adminCertId ? Number(adminCertId) : undefined,
      })
      .then((r) => r.data);
  }, [isAdmin, adminUserId, adminCertId]);

  const certMap = useMemo(() => Object.fromEntries((certs.data || []).map((c) => [c.id, c])), [certs.data]);

  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({ status: "", progress_percent: "", target_completion_date: "", notes: "" });
  const [busy, setBusy] = useState(false);

  // Split enrollments
  const savedForLater = useMemo(
    () => (mine.data || []).filter((e) => e.status === "saved_for_later"),
    [mine.data]
  );
  const activeEnrollments = useMemo(
    () => (mine.data || []).filter((e) => e.status !== "saved_for_later"),
    [mine.data]
  );

  async function saveEdit(e) {
    e.preventDefault();
    if (!editRow) return;
    setBusy(true);
    try {
      await enrollmentsApi.patch(editRow.id, {
        status: editForm.status || undefined,
        progress_percent: editForm.progress_percent === "" ? undefined : Number(editForm.progress_percent),
        target_completion_date: editForm.target_completion_date || null,
        notes: editForm.notes || null,
      });
      toast.success("Enrollment updated.");
      setEditRow(null);
      mine.reload();
      if (isAdmin) adminList.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function enrollNow(enrollment) {
    setBusy(true);
    try {
      await enrollmentsApi.patch(enrollment.id, { status: "selected" });
      toast.success("You're now enrolled! Start your journey.");
      mine.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (mine.loading && !mine.data) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">My Enrollments</h2>
        <p className="text-slate-400">Track your learning journey and manage certifications</p>
      </div>

      {/* ── Saved for Later ── */}
      {savedForLater.length > 0 && (
        <Card
          title="Saved for Later"
          subtitle={`${savedForLater.length} certification${savedForLater.length !== 1 ? "s" : ""} — ready when you are`}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedForLater.map((e) => {
              const cert = certMap[e.certification_id];
              return (
                <div
                  key={e.id}
                  className="flex flex-col justify-between gap-3 rounded-xl p-4 transition"
                  style={{ backgroundColor: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}
                >
                  <div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-lg">📌</span>
                      <div>
                        <Link to={`/learning/${e.id}`} className="font-medium text-indigo-400 hover:text-indigo-300 text-sm hover:underline">
                          {cert?.title || `Certification #${e.certification_id}`}
                        </Link>
                        <p className="text-xs text-slate-400">{cert?.provider || ""}</p>
                      </div>
                    </div>
                    {cert?.category && (
                      <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: "rgba(245,158,11,0.1)", color: "#fbbf24" }}>
                        {cert.category}
                      </span>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Saved on: {new Date(e.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1 !py-1.5 !text-xs"
                      loading={busy}
                      onClick={() => enrollNow(e)}
                    >
                      Enroll Now
                    </Button>
                    <Button
                      variant="ghost"
                      className="!py-1.5 !px-2 !text-xs"
                      onClick={() => {
                        setEditRow(e);
                        setEditForm({ status: e.status, progress_percent: e.progress_percent, target_completion_date: e.target_completion_date || "", notes: e.notes || "" });
                      }}
                    >
                      ✏️
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Active Enrollments ── */}
      <Card title="Active Enrollments" subtitle={activeEnrollments.length === 0 ? "Go to Certifications to enroll" : `${activeEnrollments.length} enrollment${activeEnrollments.length !== 1 ? "s" : ""}`}>
        <Table
          columns={[
            {
              key: "certification_id",
              label: "Certification",
              render: (row) => (
                <div>
                  <Link to={`/learning/${row.id}`} className="font-medium text-indigo-400 hover:text-indigo-300 text-sm hover:underline">
                    {certMap[row.certification_id]?.title || `#${row.certification_id}`}
                  </Link>
                  <p className="text-xs text-slate-400">{certMap[row.certification_id]?.provider || ""}</p>
                </div>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusBadge status={row.status} />,
            },
            {
              key: "created_at",
              label: "Date Enrolled",
              render: (row) => (
                <span className="text-xs text-slate-400">
                  {new Date(row.created_at).toLocaleDateString()}
                </span>
              ),
            },
            {
              key: "progress_percent",
              label: "Progress",
              render: (row) => (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-bar-bg)" }}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all"
                      style={{ width: `${row.progress_percent || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{row.progress_percent || 0}%</span>
                </div>
              ),
            },
            {
              key: "x",
              label: "",
              render: (row) => (
                <Button
                  variant="ghost"
                  className="!py-1 !text-xs"
                  onClick={() => {
                    setEditRow(row);
                    setEditForm({
                      status: row.status,
                      progress_percent: row.progress_percent,
                      target_completion_date: row.target_completion_date || "",
                      notes: row.notes || "",
                    });
                  }}
                >
                  Edit
                </Button>
              ),
            },
          ]}
          rows={activeEnrollments}
          emptyMessage="No active enrollments. Visit Certifications to enroll!"
        />
      </Card>

      {/* ── Admin view ── */}
      {isAdmin && (
        <Card title="Admin — All Enrollments" subtitle="Optional query filters">
          <div className="mb-4 flex flex-wrap gap-3">
            <div>
              <label className="text-xs text-slate-500">user_id</label>
              <input className={inputClass} value={adminUserId} onChange={(e) => setAdminUserId(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-500">certification_id</label>
              <input className={inputClass} value={adminCertId} onChange={(e) => setAdminCertId(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="ghost" onClick={() => adminList.reload()}>Refresh</Button>
            </div>
          </div>
          {adminList.error && <p className="text-rose-300">{adminList.error}</p>}
          <Table
            columns={[
              { key: "id", label: "ID" },
              { key: "user_id", label: "User" },
              {
                key: "certification_id",
                label: "Certification",
                render: (row) => (
                  <Link to={`/learning/${row.id}`} className="text-indigo-400 hover:underline">
                    {certMap[row.certification_id]?.title || `#${row.certification_id}`}
                  </Link>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (row) => <StatusBadge status={row.status} />,
              },
              {
                key: "created_at",
                label: "Date",
                render: (row) => (
                  <span className="text-xs text-slate-400">
                    {new Date(row.created_at).toLocaleDateString()}
                  </span>
                ),
              },
              { key: "progress_percent", label: "%" },
            ]}
            rows={adminList.data || []}
          />
        </Card>
      )}

      {/* ── Edit modal ── */}
      <Modal
        open={!!editRow}
        title="Update Enrollment"
        onClose={() => setEditRow(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditRow(null)}>Cancel</Button>
            <Button type="submit" form="edit-enroll" loading={busy}>Save</Button>
          </>
        }
      >
        <form id="edit-enroll" onSubmit={saveEdit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Status</label>
            <select className={inputClass} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              {statuses.map((s) => (
                <option key={s} value={s}>{STATUS_STYLES[s]?.label || s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Progress %</label>
            <input className={inputClass} type="number" min={0} max={100} value={editForm.progress_percent} onChange={(e) => setEditForm({ ...editForm, progress_percent: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Target date</label>
            <input className={inputClass} value={editForm.target_completion_date} onChange={(e) => setEditForm({ ...editForm, target_completion_date: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Notes</label>
            <textarea className={`${inputClass} min-h-[72px]`} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
