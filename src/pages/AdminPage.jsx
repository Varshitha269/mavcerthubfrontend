import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { adminApi, exportsApi, notificationsApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Modal } from "../components/Modal.jsx";
import { Table } from "../components/Table.jsx";
import { CardSkeleton } from "../components/Skeleton.jsx";

export function AdminPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const users = useAsyncData(() => adminApi.listUsers().then((r) => r.data), []);
  const analytics = useAsyncData(() => adminApi.analytics().then((r) => r.data), []);
  const audit = useAsyncData(() => adminApi.auditLogs().then((r) => r.data), []);
  const emails = useAsyncData(() => adminApi.emailLogs().then((r) => r.data), []);

  const [createOpen, setCreateOpen] = useState(false);
  const [create, setCreate] = useState({ email: "", password: "", full_name: "", role: "user", is_active: true });
  const [edit, setEdit] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: "", role: "user", is_active: true });
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcast, setBroadcast] = useState({ title: "", message: "", link_url: "" });
  const [busy, setBusy] = useState(false);

  const inputClass =
    "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50";

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  async function createUser(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.createUser(create);
      toast.success("User created.");
      setCreateOpen(false);
      users.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveUser(e) {
    e.preventDefault();
    if (!edit) return;
    setBusy(true);
    try {
      await adminApi.patchUser(edit.id, {
        full_name: editForm.full_name || null,
        role: editForm.role,
        is_active: editForm.is_active,
      });
      toast.success("User updated.");
      setEdit(null);
      users.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function runReminders() {
    setBusy(true);
    try {
      await adminApi.runReminders();
      toast.success("Reminders job finished.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function doExport() {
    setBusy(true);
    try {
      const { data } = await exportsApi.enrollmentsCsv();
      toast.success("Export ready.");
      if (data.url) window.open(data.url, "_blank");
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
      });
      toast.success(`Sent to ${data.sent} users.`);
      setBroadcastOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (users.loading && !users.data) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Admin</h2>
          <p className="text-slate-400">Users, analytics, audit, email logs, reminders, broadcast, CSV export</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={runReminders} loading={busy}>
            Run reminders
          </Button>
          <Button variant="ghost" onClick={doExport} loading={busy}>
            Export enrollments CSV
          </Button>
          <Button variant="ghost" onClick={() => setBroadcastOpen(true)}>
            Broadcast
          </Button>
          <Button onClick={() => setCreateOpen(true)}>New user</Button>
        </div>
      </div>
      {analytics.data && (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(analytics.data).map(([k, v]) => (
            <Card key={k} className="!p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k}</div>
              <div className="font-display text-2xl font-bold text-white">{v}</div>
            </Card>
          ))}
        </div>
      )}
      <Card title="Users" subtitle="GET/POST/PATCH /admin/users">
        <Table
          columns={[
            { key: "id", label: "ID" },
            { key: "email", label: "Email" },
            { key: "full_name", label: "Name" },
            { key: "role", label: "Role" },
            { key: "is_active", label: "Active" },
            {
              key: "a",
              label: "",
              render: (row) => (
                <Button
                  variant="ghost"
                  className="!py-1 !text-xs"
                  onClick={() => {
                    setEdit(row);
                    setEditForm({
                      full_name: row.full_name || "",
                      role: row.role,
                      is_active: row.is_active,
                    });
                  }}
                >
                  Edit
                </Button>
              ),
            },
          ]}
          rows={users.data || []}
        />
      </Card>
      <Card title="Audit logs" subtitle="GET /admin/audit-logs">
        <Table
          columns={[
            { key: "id", label: "ID" },
            { key: "action", label: "Action" },
            { key: "entity", label: "Entity" },
            { key: "actor_user_id", label: "Actor" },
            { key: "created_at", label: "When" },
          ]}
          rows={audit.data || []}
        />
      </Card>
      <Card title="Email logs" subtitle="GET /admin/email-logs">
        <Table
          columns={[
            { key: "id", label: "ID" },
            { key: "to_email", label: "To" },
            { key: "subject", label: "Subject" },
            { key: "success", label: "OK" },
            { key: "created_at", label: "When" },
          ]}
          rows={emails.data || []}
        />
      </Card>
      <Modal
        open={createOpen}
        title="Create user"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="adm-user" loading={busy}>
              Create
            </Button>
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
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={create.is_active} onChange={(e) => setCreate({ ...create, is_active: e.target.checked })} />
            Active
          </label>
        </form>
      </Modal>
      <Modal
        open={!!edit}
        title="Edit user"
        onClose={() => setEdit(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button type="submit" form="adm-edit" loading={busy}>
              Save
            </Button>
          </>
        }
      >
        <form id="adm-edit" onSubmit={saveUser} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Full name</label>
            <input className={inputClass} value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Role</label>
            <select className={inputClass} value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} />
            Active
          </label>
        </form>
      </Modal>
      <Modal
        open={broadcastOpen}
        title="Broadcast notification"
        onClose={() => setBroadcastOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setBroadcastOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="bc-form" loading={busy}>
              Send
            </Button>
          </>
        }
      >
        <form id="bc-form" onSubmit={sendBroadcast} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Title</label>
            <input className={inputClass} value={broadcast.title} onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-slate-500">Message</label>
            <textarea className={`${inputClass} min-h-[100px]`} value={broadcast.message} onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-slate-500">Link URL (optional)</label>
            <input className={inputClass} value={broadcast.link_url} onChange={(e) => setBroadcast({ ...broadcast, link_url: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
