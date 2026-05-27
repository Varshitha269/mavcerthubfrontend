import React, { useState } from "react";
import { communicationsApi, uploadsApi } from "../services/api.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { CardSkeleton } from "../components/Skeleton.jsx";
import { useToast } from "../context/ToastContext.jsx";

const panel = "rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-xl shadow-black/20";

export function SupportPage() {
  const toast = useToast();
  const requests = useAsyncData(() => communicationsApi.support().then((r) => r.data), []);
  const [form, setForm] = useState({ type: "help", registration_id: "", requested_slot: "", message: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!form.message.trim()) {
      toast.error("Please enter request details");
      return;
    }
    if (form.type === "reschedule" && !form.requested_slot.trim()) {
      toast.error("Requested slot is required for reschedule");
      return;
    }
    setLoading(true);
    try {
      let documentUploadId = null;
      if (file) {
        const upload = new FormData();
        upload.append("file", file);
        upload.append("purpose", "other");
        const uploaded = await uploadsApi.uploadMe(upload);
        documentUploadId = uploaded.data?.id || null;
      }
      await communicationsApi.createSupport({
        type: form.type,
        registration_id: form.registration_id ? Number(form.registration_id) : null,
        requested_slot: form.requested_slot || null,
        message: form.message,
        document_upload_id: documentUploadId,
      });
      toast.success("Support request sent");
      setForm({ type: "help", registration_id: "", requested_slot: "", message: "" });
      setFile(null);
      requests.reload?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Unable to submit request");
    } finally {
      setLoading(false);
    }
  }

  if (requests.loading && !requests.data) return <CardSkeleton />;

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Support</p>
        <h2 className="mt-3 font-display text-3xl font-bold">Status, Help, and Reschedule</h2>
        <p className="mt-2 text-sm text-slate-400">Raise STATUS, HELP, or RESCHEDULE requests and track their review status.</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={submit} className={`${panel} space-y-4`}>
          <h3 className="font-display text-lg font-bold text-white">Create Request</h3>
          <label className="block text-sm text-slate-400">
            Request type
            <select className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-cyan-300/60" value={form.type} onChange={(e) => setForm((x) => ({ ...x, type: e.target.value }))}>
              <option value="help">Help / issue</option>
              <option value="status">Status clarification</option>
              <option value="reschedule">Reschedule exam</option>
            </select>
          </label>
          <label className="block text-sm text-slate-400">
            Registration ID optional
            <input className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-cyan-300/60" value={form.registration_id} onChange={(e) => setForm((x) => ({ ...x, registration_id: e.target.value }))} />
          </label>
          {form.type === "reschedule" && <label className="block text-sm text-slate-400">
            Requested slot
            <input className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-cyan-300/60" value={form.requested_slot} onChange={(e) => setForm((x) => ({ ...x, requested_slot: e.target.value }))} placeholder="2026-06-15 10:00 IST" />
          </label>}
          <label className="block text-sm text-slate-400">
            Details
            <textarea
              className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-cyan-300/60"
              value={form.message}
              onChange={(e) => setForm((x) => ({ ...x, message: e.target.value }))}
              placeholder="Example: My certificate was rejected. Please verify the attached proof and reschedule my exam."
            />
          </label>
          <label className="block text-sm text-slate-400">
            Supporting document optional
            <input className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-cyan-300/60" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <button disabled={loading} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Sending..." : "Send request"}
          </button>
        </form>

        <section className={panel}>
          <h3 className="font-display text-lg font-bold text-white">My Requests</h3>
          <div className="mt-4 space-y-3">
            {(requests.data || []).length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">No support requests yet.</p>
            ) : (
              requests.data.map((row) => (
                <div key={row.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-semibold text-white">{row.type}</span>
                    <span className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-xs font-semibold text-cyan-100">{row.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{row.resolution || row.message || "Waiting for review"}</p>
                  {row.requested_slot && <p className="mt-1 text-xs text-slate-500">Requested slot: {row.requested_slot}</p>}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
      <section className={panel}>
        <h3 className="font-display text-lg font-bold text-white">How Updates Reach You</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ["Portal", "Your request status appears here after submission."],
            ["Notifications", "Important updates are added to your notification center."],
            ["Email", "System emails are monitored by the operations team for delivery issues."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
              <div className="font-semibold text-white">{title}</div>
              <p className="mt-2 text-sm text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
