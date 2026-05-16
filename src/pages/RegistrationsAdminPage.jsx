import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { registrationsApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Modal } from "../components/Modal.jsx";
import { Table } from "../components/Table.jsx";

export function RegistrationsAdminPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [filters, setFilters] = useState({ drive_id: "", status: "", q: "" });
  const rows = useAsyncData(
    () =>
      isAdmin
        ? registrationsApi
            .adminList({
              drive_id: filters.drive_id ? Number(filters.drive_id) : undefined,
              status: filters.status || undefined,
              q: filters.q || undefined,
            })
            .then((r) => r.data)
        : Promise.resolve([]),
    [isAdmin, filters.drive_id, filters.status, filters.q]
  );

  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ status: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const stats = useMemo(() => {
    const data = rows.data || [];
    return {
      total: data.length,
      submitted: data.filter((r) => r.status === "submitted").length,
      pending: data.filter((r) => String(r.status || "").includes("pending")).length,
      approved: data.filter((r) => ["eligible", "passed"].includes(r.status)).length,
    };
  }, [rows.data]);

  const inputClass =
    "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50";

  async function save(e) {
    e.preventDefault();
    if (!edit) return;
    setBusy(true);
    try {
      await registrationsApi.adminPatch(edit.id, { status: form.status || null, notes: form.notes || null });
      toast.success("Updated.");
      setEdit(null);
      rows.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">Registrations (Admin)</h2>
        <p className="text-slate-400">This is the Applications tab: every row is a user application for a certification drive before eligibility, approval, voucher, and result tracking.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Applications", stats.total],
          ["Submitted", stats.submitted],
          ["Pending review", stats.pending],
          ["Approved / passed", stats.approved],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
            <div className="mt-2 font-display text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <Card title="What this page is for" subtitle="Application workflow">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ["1. User applies", "A learner registers for a drive from the user registration page."],
            ["2. Admin evaluates", "Use Eligibility to check rules and request manager approval."],
            ["3. Voucher / exam", "Approved users can receive vouchers and attend assessment."],
            ["4. Results close loop", "Results update the application as passed, failed, or no-show."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="font-semibold text-white">{title}</div>
              <p className="mt-2 text-sm leading-5 text-slate-400">{body}</p>
            </div>
          ))}
        </div>
        {(rows.data || []).length === 0 && (
          <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            No applications are stored yet. Create/open a drive in <Link to="/admin-brd/drives" className="font-semibold underline">Drives</Link>, then users can submit applications from the registration page.
          </div>
        )}
      </Card>
      <Card title="Filters" subtitle="These filters apply instantly; no separate submit button is needed.">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs text-slate-500">Drive ID</label>
            <input className={inputClass} value={filters.drive_id} onChange={(e) => setFilters({ ...filters, drive_id: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Status</label>
            <select className={inputClass} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All statuses</option>
              <option value="submitted">submitted</option>
              <option value="eligible_pending_approval">eligible_pending_approval</option>
              <option value="eligible">eligible</option>
              <option value="ineligible">ineligible</option>
              <option value="scheduled">scheduled</option>
              <option value="assessed">assessed</option>
              <option value="passed">passed</option>
              <option value="failed">failed</option>
              <option value="voucher_issued">voucher_issued</option>
              <option value="closed">closed</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Search</label>
            <input className={inputClass} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="email/name/emp_id" />
          </div>
        </div>
        <div className="mt-4">
          <Button variant="ghost" onClick={() => setFilters({ drive_id: "", status: "", q: "" })}>
            Clear Filters
          </Button>
        </div>
      </Card>

      <Card title="Registrations">
        <Table
          columns={[
            { key: "id", label: "ID" },
            { key: "drive_id", label: "Drive" },
            {
              key: "certification_title",
              label: "Certification",
              render: (r) => (
                <div>
                  <div className="font-semibold text-white">{r.certification_title || r.exam_track || `Drive #${r.drive_id}`}</div>
                  <div className="text-xs text-slate-500">{r.certification_provider || r.drive_name || ""}</div>
                </div>
              ),
            },
            { key: "candidate_name", label: "Name" },
            { key: "candidate_email", label: "Email" },
            { key: "status", label: "Status" },
            {
              key: "a",
              label: "",
              render: (r) => (
                <Button
                  variant="ghost"
                  className="!py-1 !text-xs"
                  onClick={() => {
                    setEdit(r);
                    setForm({ status: r.status || "", notes: r.notes || "" });
                  }}
                >
                  Edit
                </Button>
              ),
            },
          ]}
          rows={rows.data || []}
          emptyMessage="No applications yet. Once a user registers for a drive, their application appears here."
          maxHeight="520px"
        />
      </Card>

      <Modal
        open={!!edit}
        title={`Update registration #${edit?.id}`}
        onClose={() => setEdit(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button type="submit" form="reg-edit" loading={busy}>
              Save
            </Button>
          </>
        }
      >
        <form id="reg-edit" onSubmit={save} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Status</label>
            <input className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Notes</label>
            <textarea className={`${inputClass} min-h-[90px]`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}

