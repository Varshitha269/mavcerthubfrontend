import React, { useState } from "react";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { usersApi } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Modal } from "../components/Modal.jsx";
import { CardSkeleton } from "../components/Skeleton.jsx";

const inputClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20";

export function AccountPage() {
  const toast = useToast();
  const { logout } = useAuth();
  const { data, loading, error, reload } = useAsyncData(() => usersApi.me().then((r) => r.data), []);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDeact, setConfirmDeact] = useState(false);
  const [deleting, setDeleting] = useState(false);

  React.useEffect(() => {
    if (data?.full_name !== undefined) setName(data.full_name || "");
  }, [data]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await usersApi.patchMe({ full_name: name || null });
      toast.success("Account updated.");
      reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function deactivate() {
    setDeleting(true);
    try {
      await usersApi.deleteMe();
      toast.success("Account deactivated.");
      setConfirmDeact(false);
      logout();
      window.location.href = "/login";
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setDeleting(false);
    }
  }

  if (loading && !data) return <CardSkeleton />;
  if (error) return <Card title="Account"><p className="text-rose-300">{error}</p></Card>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">Account</h2>
        <p className="text-slate-400">Users API — GET/PATCH /users/me, DELETE /users/me</p>
      </div>
      <Card title="Profile (core)" subtitle={`${data?.email} · ${data?.role}`}>
        <form onSubmit={save} className="max-w-md space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Full name</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" loading={saving}>
            Save
          </Button>
        </form>
        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-sm text-slate-400">Deactivate sets is_active to false (same session may still work until token expires).</p>
          <Button variant="danger" className="mt-3" onClick={() => setConfirmDeact(true)}>
            Deactivate account
          </Button>
        </div>
      </Card>
      <Modal
        open={confirmDeact}
        title="Deactivate account?"
        onClose={() => setConfirmDeact(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDeact(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={deactivate}>
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-300">This calls DELETE /api/v1/users/me. You will need a new account to sign in again.</p>
      </Modal>
    </div>
  );
}
