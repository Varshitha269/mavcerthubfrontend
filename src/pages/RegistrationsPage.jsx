import React, { useState } from "react";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { certificationsApi, registrationsApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Modal } from "../components/Modal.jsx";
import { Table } from "../components/Table.jsx";

export function RegistrationsPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const myRegs = useAsyncData(() => registrationsApi.my().then((r) => r.data), []);
  const certs = useAsyncData(() => certificationsApi.list().then((r) => r.data), []);

  const [lookup, setLookup] = useState({ reg_id: "", email: "", emp_id: "" });
  const [lookupRes, setLookupRes] = useState(null);
  const [busyLookup, setBusyLookup] = useState(false);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    drive_id: "",
    emp_id: "",
    candidate_name: "",
    candidate_email: user?.email || "",
    bu: "",
    location: "",
    manager_email: "",
    exam_track: "",
    slot: "",
    prior_attempts: 0,
    notes: "",
  });
  const [busy, setBusy] = useState(false);

  const inputClass =
    "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50";

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await registrationsApi.create({
        ...form,
        drive_id: Number(form.drive_id),
        prior_attempts: Number(form.prior_attempts) || 0,
        candidate_email: form.candidate_email,
        manager_email: form.manager_email || null,
      });
      toast.success("Registration submitted.");
      setOpen(false);
      myRegs.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function doLookup(e) {
    e.preventDefault();
    setBusyLookup(true);
    try {
      const params = {
        reg_id: lookup.reg_id ? Number(lookup.reg_id) : undefined,
        email: lookup.email || undefined,
        emp_id: lookup.emp_id || undefined,
      };
      const { data } = await registrationsApi.statusLookup(params);
      setLookupRes(data);
      toast.success("Status loaded.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusyLookup(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Registrations</h2>
          <p className="text-slate-400">User registration + status lookup (BRD)</p>
        </div>
        <Button onClick={() => setOpen(true)}>New registration</Button>
      </div>

      <Card title="My registrations">
        <Table
          columns={[
            { key: "id", label: "ID" },
            { key: "drive_id", label: "Drive" },
            { key: "candidate_email", label: "Email" },
            { key: "status", label: "Status" },
            { key: "exam_track", label: "Track" },
          ]}
          rows={myRegs.data || []}
          emptyMessage="No registrations yet."
        />
      </Card>

      <Card title="Status lookup" subtitle="FR-6 portal lookup">
        <form onSubmit={doLookup} className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs text-slate-500">Registration ID</label>
            <input className={inputClass} value={lookup.reg_id} onChange={(e) => setLookup({ ...lookup, reg_id: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Email</label>
            <input className={inputClass} value={lookup.email} onChange={(e) => setLookup({ ...lookup, email: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Emp ID</label>
            <input className={inputClass} value={lookup.emp_id} onChange={(e) => setLookup({ ...lookup, emp_id: e.target.value })} />
          </div>
          <div className="md:col-span-3">
            <Button type="submit" loading={busyLookup} variant="ghost">
              Lookup
            </Button>
          </div>
        </form>
        {lookupRes && (
          <pre className="mt-4 max-h-80 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-slate-200">{JSON.stringify(lookupRes, null, 2)}</pre>
        )}
      </Card>

      {isAdmin && (
        <Card title="Admin note" subtitle="Admin registration management is in the Admin BRD pages">
          <p className="text-sm text-slate-400">Use the Admin sidebar BRD sections to filter and update registrations.</p>
        </Card>
      )}

      <Modal
        open={open}
        title="New registration"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="reg-form" loading={busy}>
              Submit
            </Button>
          </>
        }
      >
        <form id="reg-form" onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Drive ID</label>
            <input className={inputClass} value={form.drive_id} onChange={(e) => setForm({ ...form, drive_id: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Candidate name</label>
              <input className={inputClass} value={form.candidate_name} onChange={(e) => setForm({ ...form, candidate_name: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-slate-500">Candidate email</label>
              <input className={inputClass} value={form.candidate_email} onChange={(e) => setForm({ ...form, candidate_email: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Emp ID</label>
              <input className={inputClass} value={form.emp_id} onChange={(e) => setForm({ ...form, emp_id: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Prior attempts</label>
              <input className={inputClass} type="number" value={form.prior_attempts} onChange={(e) => setForm({ ...form, prior_attempts: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">BU</label>
              <input className={inputClass} value={form.bu} onChange={(e) => setForm({ ...form, bu: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Location</label>
              <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Manager email</label>
              <input className={inputClass} value={form.manager_email} onChange={(e) => setForm({ ...form, manager_email: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Track</label>
              <input className={inputClass} value={form.exam_track} onChange={(e) => setForm({ ...form, exam_track: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Slot</label>
              <input className={inputClass} value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Notes</label>
              <input className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

