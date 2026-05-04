import React, { useState } from "react";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { vouchersApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Modal } from "../components/Modal.jsx";
import { Table } from "../components/Table.jsx";
import { CardSkeleton } from "../components/Skeleton.jsx";

const voucherStatuses = ["issued", "redeemed", "expired", "revoked"];

export function VouchersPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const mine = useAsyncData(() => vouchersApi.my().then((r) => r.data), []);
  const [adminUserId, setAdminUserId] = useState("");
  const adminList = useAsyncData(async () => {
    if (!isAdmin) return [];
    return vouchersApi.adminList({ user_id: adminUserId ? Number(adminUserId) : undefined }).then((r) => r.data);
  }, [isAdmin, adminUserId]);

  const [issueOpen, setIssueOpen] = useState(false);
  const [issue, setIssue] = useState({ user_id: "", code: "", drive_id: "", certification_id: "", notes: "" });
  const [edit, setEdit] = useState(null);
  const [editForm, setEditForm] = useState({ status: "issued", notes: "" });
  const [busy, setBusy] = useState(false);

  const inputClass =
    "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50";

  async function issueVoucher(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await vouchersApi.adminIssue({
        user_id: Number(issue.user_id),
        code: issue.code,
        drive_id: issue.drive_id ? Number(issue.drive_id) : null,
        certification_id: issue.certification_id ? Number(issue.certification_id) : null,
        notes: issue.notes || null,
      });
      toast.success("Issued.");
      setIssueOpen(false);
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
      toast.success("Updated.");
      setEdit(null);
      adminList.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (mine.loading && !mine.data) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Vouchers</h2>
          <p className="text-slate-400">GET /vouchers/me · Admin list/issue/patch</p>
        </div>
        {isAdmin && <Button onClick={() => setIssueOpen(true)}>Issue voucher</Button>}
      </div>
      <Card title="My vouchers">
        <Table
          columns={[
            { key: "id", label: "ID" },
            { key: "code", label: "Code" },
            { key: "status", label: "Status" },
            { key: "certification_id", label: "Cert" },
          ]}
          rows={mine.data || []}
        />
      </Card>
      {isAdmin && (
        <Card title="Admin">
          <div className="mb-4 flex gap-3">
            <input className={inputClass} placeholder="user_id filter" value={adminUserId} onChange={(e) => setAdminUserId(e.target.value)} />
            <Button variant="ghost" onClick={() => adminList.reload()}>
              Refresh
            </Button>
          </div>
          <Table
            columns={[
              { key: "id", label: "ID" },
              { key: "user_id", label: "User" },
              { key: "code", label: "Code" },
              { key: "status", label: "Status" },
              {
                key: "a",
                label: "",
                render: (row) => (
                  <Button
                    variant="ghost"
                    className="!py-1 !text-xs"
                    onClick={() => {
                      setEdit(row);
                      setEditForm({ status: row.status, notes: row.notes || "" });
                    }}
                  >
                    Edit
                  </Button>
                ),
              },
            ]}
            rows={adminList.data || []}
          />
        </Card>
      )}
      <Modal
        open={issueOpen}
        title="Issue voucher"
        onClose={() => setIssueOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIssueOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="v-issue" loading={busy}>
              Issue
            </Button>
          </>
        }
      >
        <form id="v-issue" onSubmit={issueVoucher} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">User id</label>
            <input className={inputClass} value={issue.user_id} onChange={(e) => setIssue({ ...issue, user_id: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-slate-500">Code (unique)</label>
            <input className={inputClass} value={issue.code} onChange={(e) => setIssue({ ...issue, code: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Drive id</label>
              <input className={inputClass} value={issue.drive_id} onChange={(e) => setIssue({ ...issue, drive_id: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Cert id</label>
              <input className={inputClass} value={issue.certification_id} onChange={(e) => setIssue({ ...issue, certification_id: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Notes</label>
            <input className={inputClass} value={issue.notes} onChange={(e) => setIssue({ ...issue, notes: e.target.value })} />
          </div>
        </form>
      </Modal>
      <Modal
        open={!!edit}
        title="Update voucher"
        onClose={() => setEdit(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button type="submit" form="v-edit" loading={busy}>
              Save
            </Button>
          </>
        }
      >
        <form id="v-edit" onSubmit={saveVoucher} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Status</label>
            <select className={inputClass} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              {voucherStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
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
