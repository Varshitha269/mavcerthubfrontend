import React, { useMemo, useState } from "react";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { enrollmentsApi, uploadsApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { CardSkeleton } from "../components/Skeleton.jsx";

const checklist = [
  { label: "ID proof", required: true, purpose: "profile_doc" },
  { label: "Educational certificates", required: true, purpose: "profile_doc" },
  { label: "Experience letters", required: true, purpose: "profile_doc" },
  { label: "Completed certification proof", required: false, purpose: "certificate" },
];

function statusFor(upload) {
  const status = normalizedStatus(upload);
  if (status === "approved" || (upload.purpose === "certificate" && upload.enrollment_status === "completed")) return { label: "Approved", cls: "text-emerald-300 bg-emerald-500/10" };
  if (status === "rejected") return { label: "Rejected", cls: "text-rose-300 bg-rose-500/10" };
  return { label: "Under Review", cls: "text-amber-300 bg-amber-500/10" };
}

function normalizedStatus(upload) {
  return String(upload.status || upload.review_status || "under_review").trim().toLowerCase();
}

function statusKey(upload) {
  const status = normalizedStatus(upload);
  if (status === "approved" || status === "rejected") return status;
  if (upload.purpose === "certificate" && upload.enrollment_status === "completed") return "approved";
  return "under_review";
}

export function UploadsPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const uploads = useAsyncData(() => (isAdmin ? uploadsApi.adminList() : uploadsApi.my()).then((r) => r.data), [isAdmin]);
  const enrollments = useAsyncData(() => enrollmentsApi.my().then((r) => r.data), []);
  const [file, setFile] = useState(null);
  const [purpose, setPurpose] = useState("profile_doc");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(null);

  const uploadedPurposes = useMemo(() => new Set((uploads.data || []).map((u) => u.purpose)), [uploads.data]);
  const activeEnrollments = (enrollments.data || []).filter((e) => e.status !== "saved_for_later");
  const pendingUploads = useMemo(() => (uploads.data || []).filter((u) => statusKey(u) === "under_review"), [uploads.data]);
  const approvedUploads = useMemo(() => (uploads.data || []).filter((u) => statusKey(u) === "approved"), [uploads.data]);
  const rejectedUploads = useMemo(() => (uploads.data || []).filter((u) => statusKey(u) === "rejected"), [uploads.data]);

  async function submit(e) {
    e.preventDefault();
    if (!file) return;
    setUploadBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", purpose);
      if (enrollmentId) form.append("enrollment_id", enrollmentId);
      await uploadsApi.uploadMe(form);
      toast.success("Document uploaded for review.");
      setFile(null);
      e.currentTarget.reset();
      uploads.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploadBusy(false);
    }
  }

  async function review(upload, decision) {
    setReviewBusy(`${decision}-${upload.id}`);
    const reason = decision === "rejected" ? "Please re-upload a clearer or valid document." : "";
    try {
      await uploadsApi.adminReview(upload.id, { decision, reason });
      toast.success(`Document ${decision}.`);
      uploads.setData((current) =>
        Array.isArray(current)
          ? current.map((item) =>
              item.id === upload.id
                ? { ...item, status: decision, review_status: decision, review_reason: reason || null, reviewed_at: new Date().toISOString() }
                : item
            )
          : current
      );
      await uploads.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Review failed");
    } finally {
      setReviewBusy(null);
    }
  }

  function renderUploadRows(rows, emptyMessage) {
    if (rows.length === 0) return <p className="text-sm text-slate-400">{emptyMessage}</p>;
    return rows.map((upload) => {
      const status = statusFor(upload);
      const currentStatus = statusKey(upload);
      return (
        <div key={upload.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <div className="font-medium text-white">{upload.original_filename}</div>
            <div className="mt-1 text-xs text-slate-500">
              {isAdmin ? `User #${upload.user_id} - ` : ""}{upload.purpose} {upload.certification?.title ? `- ${upload.certification.title}` : ""}
            </div>
            {currentStatus === "rejected" && (
              <div className="mt-2 text-xs text-rose-300">Reason: {upload.review_reason || "Please re-upload a clearer or valid document."}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs ${status.cls}`}>{status.label}</span>
            {isAdmin && currentStatus === "under_review" && (
              <>
                <Button className="!py-1.5 !px-3 !text-xs" loading={reviewBusy === `approved-${upload.id}`} onClick={() => review(upload, "approved")}>Approve</Button>
                <Button variant="danger" className="!py-1.5 !px-3 !text-xs" loading={reviewBusy === `rejected-${upload.id}`} onClick={() => review(upload, "rejected")}>Reject</Button>
              </>
            )}
            <a className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-indigo-300 hover:bg-white/5" href={upload.download_url} target="_blank" rel="noreferrer">
              View
            </a>
          </div>
        </div>
      );
    });
  }

  if (uploads.loading && !uploads.data) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">{isAdmin ? "Verify Uploads" : "Uploads"}</h2>
        <p className="text-slate-400">{isAdmin ? "Review user documents and send approval or rejection notifications." : "Upload and track required documents for admin verification."}</p>
      </div>

      {!isAdmin && <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card title="Document Checklist" subtitle="Required and optional certification documents">
          <div className="space-y-3">
            {checklist.map((item) => {
              const done = uploadedPurposes.has(item.purpose);
              return (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div>
                    <div className="font-medium text-white">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.required ? "Required" : "Optional"}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs ${done ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-500/10 text-slate-300"}`}>
                    {done ? "Uploaded" : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Upload Zone" subtitle="Drag a file onto the picker or choose from your device">
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-5">
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-500/15 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-300"
              />
              <p className="mt-3 text-xs text-slate-500">Supported: PDF, image, DOC, DOCX.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-slate-500">Document type</label>
                <select className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                  <option value="profile_doc">ID / education / experience document</option>
                  <option value="certificate">Completed certificate proof</option>
                  <option value="other">Other supporting file</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Related enrollment</label>
                <select className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none" value={enrollmentId} onChange={(e) => setEnrollmentId(e.target.value)}>
                  <option value="">Not linked</option>
                  {activeEnrollments.map((e) => (
                    <option key={e.id} value={e.id}>Enrollment #{e.id}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" loading={uploadBusy} disabled={!file}>Upload Document</Button>
          </form>
        </Card>
      </div>}

      {isAdmin ? (
        <>
          <Card title="Pending Documents" subtitle="Only documents waiting for review appear here">
            <div className="space-y-3">{renderUploadRows(pendingUploads, "No pending documents.")}</div>
          </Card>
          <Card title="Approved Docs" subtitle="Documents already approved by admin">
            <div className="space-y-3">{renderUploadRows(approvedUploads, "No approved documents yet.")}</div>
          </Card>
          <Card title="Rejected Docs" subtitle="Documents rejected with re-upload guidance">
            <div className="space-y-3">{renderUploadRows(rejectedUploads, "No rejected documents yet.")}</div>
          </Card>
        </>
      ) : (
        <Card title="Uploaded Documents" subtitle="Admin review status and re-upload guidance">
          <div className="space-y-3">{renderUploadRows(uploads.data || [], "No documents uploaded yet.")}</div>
        </Card>
      )}
    </div>
  );
}
