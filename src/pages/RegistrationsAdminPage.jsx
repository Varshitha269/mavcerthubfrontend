import React, { useState } from "react";
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
        <p className="text-slate-400">Filter, update, and audit BRD registrations</p>
      </div>
      <Card title="Filters">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs text-slate-500">Drive ID</label>
            <input className={inputClass} value={filters.drive_id} onChange={(e) => setFilters({ ...filters, drive_id: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Status</label>
            <input className={inputClass} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} placeholder="submitted / eligible / ..." />
          </div>
          <div>
            <label className="text-xs text-slate-500">Search</label>
            <input className={inputClass} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="email/name/emp_id" />
          </div>
        </div>
        <div className="mt-4">
          <Button variant="ghost" onClick={() => rows.reload()}>
            Refresh
          </Button>
        </div>
      </Card>

      <Card title="Registrations">
        <Table
          columns={[
            { key: "id", label: "ID" },
            { key: "drive_id", label: "Drive" },
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

