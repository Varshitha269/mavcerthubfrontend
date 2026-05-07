import React, { useState } from "react";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { certificationsApi, usersApi, vouchersApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Modal } from "../components/Modal.jsx";
import { Table } from "../components/Table.jsx";
import { CardSkeleton } from "../components/Skeleton.jsx";

const voucherStatuses = ["issued", "redeemed", "expired", "revoked"];
const inputClass = "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50";

export function VouchersPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const mine = useAsyncData(() => vouchersApi.my().then((r) => r.data), []);
  const adminList = useAsyncData(async () => (isAdmin ? vouchersApi.adminList().then((r) => r.data) : []), [isAdmin]);
  const certs = useAsyncData(() => certificationsApi.list().then((r) => r.data), []);
  const users = useAsyncData(async () => (isAdmin ? usersApi.me().then(() => []) : []), [isAdmin]);

  const [issueOpen, setIssueOpen] = useState(false);
  const [issue, setIssue] = useState({ user_id: "", code: "", certification_id: "", notes: "" });
  const [edit, setEdit] = useState(null);
  const [editForm, setEditForm] = useState({ status: "issued", notes: "" });
  const [busy, setBusy] = useState(false);

  async function issueVoucher(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await vouchersApi.adminIssue({
        user_id: Number(issue.user_id),
        code: issue.code,
        certification_id: issue.certification_id ? Number(issue.certification_id) : null,
        notes: issue.notes || null,
      });
      toast.success("Voucher issued.");
      setIssueOpen(false);
      setIssue({ user_id: "", code: "", certification_id: "", notes: "" });
      adminList.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveVoucher(e) {
    e.preventDefault();
    if (!edit) return;
    setBusy(true);
    try {
      await vouchersApi.adminPatch(edit.id, { status: editForm.status, notes: editForm.notes || null });
      toast.success("Voucher updated.");
      setEdit(null);
      adminList.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  function statusBadge(status) {
    const tone = status === "issued" ? "text-emerald-300 bg-emerald-500/10" : status === "redeemed" ? "text-indigo-300 bg-indigo-500/10" : "text-amber-300 bg-amber-500/10";
    return <span className={`rounded-full px-2.5 py-1 text-xs ${tone}`}>{status}</span>;
  }

  if (mine.loading && !mine.data) return <CardSkeleton />;

  const rows = isAdmin ? adminList.data || [] : mine.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">{isAdmin ? "Voucher Management" : "My Vouchers"}</h2>
          <p className="text-slate-400">{isAdmin ? "Issue and manage vouchers for users by certification." : "Check assigned voucher codes, status, and expiry dates."}</p>
        </div>
        {isAdmin && <Button onClick={() => setIssueOpen(true)}>Issue Voucher</Button>}
      </div>

      <Card title={isAdmin ? "All Vouchers" : "Assigned Vouchers"}>
        <Table
          columns={[
            { key: "id", label: "ID" },
            ...(isAdmin ? [{ key: "user_id", label: "User" }] : []),
            { key: "code", label: "Code" },
            { key: "certification_id", label: "Certification" },
            { key: "status", label: "Status", render: (row) => statusBadge(row.status) },
            { key: "expires_at", label: "Expires", render: (row) => row.expires_at ? new Date(row.expires_at).toLocaleDateString() : "Not set" },
            ...(isAdmin ? [{
              key: "a",
              label: "",
              render: (row) => <Button variant="ghost" className="!py-1 !text-xs" onClick={() => { setEdit(row); setEditForm({ status: row.status, notes: row.notes || "" }); }}>Edit</Button>,
            }] : []),
          ]}
          rows={rows}
          emptyMessage={isAdmin ? "No vouchers issued yet." : "No vouchers assigned yet."}
        />
      </Card>

      <Modal open={issueOpen} title="Issue voucher" onClose={() => setIssueOpen(false)} footer={<><Button variant="ghost" onClick={() => setIssueOpen(false)}>Cancel</Button><Button type="submit" form="v-issue" loading={busy}>Issue</Button></>}>
        <form id="v-issue" onSubmit={issueVoucher} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">User id</label>
            <input className={inputClass} value={issue.user_id} onChange={(e) => setIssue({ ...issue, user_id: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-slate-500">Certification</label>
            <select className={inputClass} value={issue.certification_id} onChange={(e) => setIssue({ ...issue, certification_id: e.target.value })}>
              <option value="">Select certification</option>
              {(certs.data || []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Voucher code</label>
            <input className={inputClass} value={issue.code} onChange={(e) => setIssue({ ...issue, code: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-slate-500">Notes</label>
            <input className={inputClass} value={issue.notes} onChange={(e) => setIssue({ ...issue, notes: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal open={!!edit} title="Update voucher" onClose={() => setEdit(null)} footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button type="submit" form="v-edit" loading={busy}>Save</Button></>}>
        <form id="v-edit" onSubmit={saveVoucher} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Status</label>
            <select className={inputClass} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              {voucherStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Notes</label>
            <input className={inputClass} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
