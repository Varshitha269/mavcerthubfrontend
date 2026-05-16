import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { enrollmentsApi, certificationsApi, uploadsApi, aiApi, tasksApi } from "../services/api.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { useToast } from "../context/ToastContext.jsx";
import { Button } from "../components/Button.jsx";
import { CardSkeleton } from "../components/Skeleton.jsx";
import { Card } from "../components/Card.jsx";
import { Table } from "../components/Table.jsx";
import { Modal } from "../components/Modal.jsx";
import confetti from "canvas-confetti";

export function LearningPage() {
  const { id } = useParams();
  const toast = useToast();
  
  const { data: enrollment, loading: enrollLoading, reload: reloadEnrollment } = useAsyncData(
    () => enrollmentsApi.get(id).then(r => r.data),
    [id]
  );
  
  const { data: cert, loading: certLoading } = useAsyncData(
    async () => {
      if (!enrollment) return null;
      return certificationsApi.get(enrollment.certification_id).then(r => r.data);
    },
    [enrollment?.certification_id]
  );

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadId, setUploadId] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [aiConfidence, setAiConfidence] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  const uploadsData = useAsyncData(
    () => uploadsApi.my().then((r) => r.data),
    [id]
  );

  // Tasks state
  const tasksData = useAsyncData(
    () => tasksApi.my({ enrollment_id: id }).then(r => r.data),
    [id]
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [create, setCreate] = useState({ title: "", description: "", status: "todo", due_date: "", priority: 3 });
  const [edit, setEdit] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [delId, setDelId] = useState(null);
  const [taskBusy, setTaskBusy] = useState(false);
  const taskStatuses = ["todo", "doing", "done", "blocked"];
  const inputClass = "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50";

  useEffect(() => {
    const latestUpload = (uploadsData.data || []).find(
      (upload) => Number(upload.enrollment_id) === Number(id) && upload.purpose === "certificate"
    );
    if (latestUpload && latestUpload.id !== uploadId) {
      setUploadId(latestUpload.id);
      const stored = localStorage.getItem(`mch_cert_verification_${latestUpload.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setAiConfidence(parsed.confidence ?? null);
          setVerificationResult(parsed);
        } catch {
          setAiConfidence(null);
          setVerificationResult(null);
        }
      } else {
        setAiConfidence(null);
        setVerificationResult(null);
      }
    }
  }, [uploadsData.data, id, uploadId]);

  if (enrollLoading || certLoading || !enrollment || !cert) {
    return <CardSkeleton />;
  }

  const handleSaveStatus = async (newStatus, extras = {}) => {
    setSaving(true);
    try {
      await enrollmentsApi.patch(id, { 
        status: newStatus || enrollment.status,
        ...extras
      });
      if (newStatus === 'completed') {
        toast.success("Certification Completed!");
        // Trigger confetti celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        toast.success("Status updated!");
      }
      reloadEnrollment();
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", "certificate");
      formData.append("enrollment_id", id);
      const res = await uploadsApi.uploadMe(formData);
      setUploadId(res.data.id);
      setAiConfidence(null);
      setVerificationResult(null);
      toast.success("Certificate uploaded successfully");
      uploadsData.reload();
    } catch (err) {
      toast.error("Failed to upload certificate");
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (targetUploadId = uploadId) => {
    if (!targetUploadId) return;
    setVerifying(true);
    try {
      const res = await aiApi.verifyCertificateUpload({ upload_id: targetUploadId });
      setAiConfidence(res.data.confidence);
      setVerificationResult(res.data);
      localStorage.setItem(`mch_cert_verification_${targetUploadId}`, JSON.stringify(res.data));
      if (res.data.matched) {
        toast.success("Certificate matches this enrollment.");
      } else {
        toast.error(res.data.reason || "Certificate does not match this enrollment.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to verify certificate");
    } finally {
      setVerifying(false);
    }
  };

  const handleRequestReview = async () => {
    handleSaveStatus(enrollment.status, { admin_review_requested: true });
  };

  // Task Handlers
  async function createTask(e) {
    e.preventDefault();
    setTaskBusy(true);
    try {
      await tasksApi.create({ ...create, enrollment_id: Number(id), priority: Number(create.priority) });
      toast.success("Task created.");
      setCreateOpen(false);
      setCreate({ title: "", description: "", status: "todo", due_date: "", priority: 3 });
      tasksData.reload();
    } catch (err) { toast.error("Failed to create task"); } finally { setTaskBusy(false); }
  }

  async function saveTask(e) {
    e.preventDefault();
    if (!edit) return;
    setTaskBusy(true);
    try {
      await tasksApi.patch(edit.id, { ...editForm, priority: Number(editForm.priority) });
      toast.success("Task updated.");
      setEdit(null);
      tasksData.reload();
    } catch (err) { toast.error("Failed to save task"); } finally { setTaskBusy(false); }
  }

  async function confirmDelete() {
    if (!delId) return;
    setTaskBusy(true);
    try {
      await tasksApi.remove(delId);
      toast.success("Deleted.");
      setDelId(null);
      tasksData.reload();
    } catch (err) { toast.error("Failed to delete task"); } finally { setTaskBusy(false); }
  }

  // Compute resource links. If DB is empty, use search queries as fallback
  const courseUrl = cert.course_url || `https://www.udemy.com/courses/search/?q=${encodeURIComponent(cert.title)}`;
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cert.title + ' full course')}`;
  const examUrl = cert.official_exam_url || `https://www.google.com/search?q=${encodeURIComponent(cert.provider + ' ' + cert.title + ' official certification page')}`;

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb & Header ── */}
      <div>
        <Link to="/enrollments" className="text-sm text-indigo-400 hover:underline mb-2 inline-block">
          &larr; Back to Enrollments
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-white">{cert.title}</h2>
            <p className="text-lg text-slate-400 mt-1">{cert.provider}</p>
            <div className="flex gap-2 mt-3">
              {cert.category && (
                <span className="inline-block rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
                  {cert.category}
                </span>
              )}
              {cert.level && (
                <span className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                  {cert.level}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0 p-4 rounded-xl" style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}>
            <p className="text-sm text-slate-400 font-medium">Status: <span className="text-white capitalize">{enrollment.status.replace(/_/g, ' ')}</span></p>
            <p className="text-xs text-slate-500 mt-1">Enrolled on: {new Date(enrollment.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* ── Left Column: Learning Resources ── */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Learning Resources" subtitle="Start learning to prepare for your certification">
            <div className="grid sm:grid-cols-2 gap-4 mt-2">
              
              {/* Primary Course */}
              <a 
                href={courseUrl} 
                target="_blank" 
                rel="noreferrer"
                className="group relative flex flex-col p-5 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10"
                style={{ backgroundColor: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 text-xl">
                    🎓
                  </div>
                  <h3 className="font-semibold text-white">Primary Course</h3>
                </div>
                <p className="text-sm text-slate-400 mb-4 flex-1">
                  Access the recommended learning path for this certification.
                </p>
                <span className="text-xs font-medium text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                  Open Course &rarr;
                </span>
              </a>

              {/* YouTube Alternative */}
              <a 
                href={youtubeUrl} 
                target="_blank" 
                rel="noreferrer"
                className="group relative flex flex-col p-5 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-500/10"
                style={{ backgroundColor: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.2)" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 text-xl">
                    ▶️
                  </div>
                  <h3 className="font-semibold text-white">YouTube Guides</h3>
                </div>
                <p className="text-sm text-slate-400 mb-4 flex-1">
                  Watch free video tutorials and crash courses from the community.
                </p>
                <span className="text-xs font-medium text-rose-400 group-hover:text-rose-300 flex items-center gap-1">
                  Watch Videos &rarr;
                </span>
              </a>

            </div>
          </Card>

          <Card title="Official Certification Exam" subtitle="When you are ready, schedule your exam">
             <div className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: "var(--color-bg-input)", border: "1px solid var(--color-border)" }}>
               <div>
                 <h4 className="font-medium text-white text-sm">Official Registration Page</h4>
                 <p className="text-xs text-slate-400 mt-1">Book your exam directly with {cert.provider}</p>
               </div>
               <a 
                 href={examUrl} 
                 target="_blank" 
                 rel="noreferrer"
                 className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors border border-slate-700"
               >
                 Register Now
               </a>
             </div>
          </Card>
        </div>

        {/* ── Right Column: Completion Tracker ── */}
        <div className="space-y-6">
          <Card title="Track Your Progress" subtitle="Update your learning journey">
            {enrollment.status === 'completed' ? (
              <div className="py-8 text-center border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl">
                  🏆
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Certification Completed</h3>
                <p className="text-sm text-slate-400">
                  Congratulations on earning your {cert.title}! All related tasks have been marked as done.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mt-4">
                <p className="text-sm text-slate-300">
                  Upload your completed certificate to mark this enrollment as Done.
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-slate-400
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-500/10 file:text-indigo-400
                      hover:file:bg-indigo-500/20 cursor-pointer"
                  />
                </div>
                {uploading && <p className="text-xs text-indigo-400">Uploading...</p>}
                
                {uploadId && (
                  <div className="flex flex-col gap-3 mt-2 p-4 rounded-xl border border-white/10 bg-white/5">
                    <p className="text-sm font-medium text-white">Certificate Uploaded</p>
                    
                    {aiConfidence !== null ? (
                      <div className="space-y-2 rounded-lg border border-white/5 bg-slate-900/50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Match confidence:</span>
                          <span className={`text-sm font-bold ${verificationResult?.matched ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {Math.round(aiConfidence * 100)}%
                          </span>
                        </div>
                        {verificationResult && (
                          <div className={`rounded-lg px-3 py-2 text-xs ${verificationResult.matched ? 'bg-emerald-500/10 text-emerald-200' : 'bg-amber-500/10 text-amber-200'}`}>
                            {verificationResult.reason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button onClick={() => handleVerify()} loading={verifying} className="w-full justify-center">
                        Verify with AI
                      </Button>
                    )}

                    <div className="flex flex-col gap-2 pt-2 border-t border-white/10 mt-2">
                      <Button 
                        onClick={() => handleSaveStatus('completed')}
                        className="w-full justify-center !bg-emerald-500 hover:!bg-emerald-600"
                        disabled={!verificationResult?.matched}
                      >
                        Mark Completed
                      </Button>
                      {!enrollment.admin_review_requested ? (
                        <Button
                          variant="ghost"
                          onClick={handleRequestReview}
                          className="w-full justify-center text-xs !text-amber-400 hover:!bg-amber-400/10"
                        >
                          Request Admin Review
                        </Button>
                      ) : (
                        <p className="text-xs text-center text-amber-400">Admin review requested.</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 pt-4 border-t border-white/10 mt-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSaveStatus('saved_for_later')}
                    className="flex-1 justify-center !text-amber-400 hover:!bg-amber-400/10"
                  >
                    Pause Course
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
        
      </div>

      {/* ── Tasks Section ── */}
      <div className="mt-8">
        <Card 
          title="Tasks" 
          subtitle="Manage your to-dos for this certification"
          actions={<Button onClick={() => setCreateOpen(true)} className="!py-1 !px-3 text-xs">Add Task</Button>}
        >
          {tasksData.loading && !tasksData.data ? (
            <p className="text-slate-400 text-sm">Loading tasks...</p>
          ) : (!tasksData.data || tasksData.data.length === 0) ? (
            <p className="text-slate-400 text-sm">No tasks yet. Create one to get started!</p>
          ) : (
            <Table
              columns={[
                { key: "title", label: "Title" },
                { key: "status", label: "Status" },
                { key: "priority", label: "Priority" },
                { key: "due_date", label: "Due Date" },
                {
                  key: "actions",
                  label: "",
                  render: (row) => (
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" className="!py-1 !px-2 !text-xs" onClick={() => { setEdit(row); setEditForm({ ...row }); }}>Edit</Button>
                      <Button variant="danger" className="!py-1 !px-2 !text-xs" onClick={() => setDelId(row.id)}>Delete</Button>
                    </div>
                  ),
                },
              ]}
              rows={tasksData.data || []}
            />
          )}
        </Card>
      </div>

      {/* Task Modals */}
      <Modal open={createOpen} title="Add Task" onClose={() => setCreateOpen(false)} footer={<><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button type="submit" form="task-create" loading={taskBusy}>Create</Button></>}>
        <form id="task-create" onSubmit={createTask} className="space-y-3">
          <div><label className="text-xs text-slate-500">Title</label><input className={inputClass} value={create.title} onChange={e => setCreate({...create, title: e.target.value})} required /></div>
          <div><label className="text-xs text-slate-500">Description</label><textarea className={inputClass} value={create.description} onChange={e => setCreate({...create, description: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500">Status</label><select className={inputClass} value={create.status} onChange={e => setCreate({...create, status: e.target.value})}>{taskStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="text-xs text-slate-500">Priority (1-5)</label><input type="number" min="1" max="5" className={inputClass} value={create.priority} onChange={e => setCreate({...create, priority: e.target.value})} /></div>
          </div>
          <div><label className="text-xs text-slate-500">Due Date</label><input type="date" className={inputClass} value={create.due_date} onChange={e => setCreate({...create, due_date: e.target.value})} /></div>
        </form>
      </Modal>

      <Modal open={!!edit} title="Edit Task" onClose={() => setEdit(null)} footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button type="submit" form="task-edit" loading={taskBusy}>Save</Button></>}>
        <form id="task-edit" onSubmit={saveTask} className="space-y-3">
          <div><label className="text-xs text-slate-500">Title</label><input className={inputClass} value={editForm.title || ""} onChange={e => setEditForm({...editForm, title: e.target.value})} required /></div>
          <div><label className="text-xs text-slate-500">Description</label><textarea className={inputClass} value={editForm.description || ""} onChange={e => setEditForm({...editForm, description: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500">Status</label><select className={inputClass} value={editForm.status || ""} onChange={e => setEditForm({...editForm, status: e.target.value})}>{taskStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="text-xs text-slate-500">Priority</label><input type="number" min="1" max="5" className={inputClass} value={editForm.priority || 3} onChange={e => setEditForm({...editForm, priority: e.target.value})} /></div>
          </div>
          <div><label className="text-xs text-slate-500">Due Date</label><input type="date" className={inputClass} value={editForm.due_date || ""} onChange={e => setEditForm({...editForm, due_date: e.target.value})} /></div>
        </form>
      </Modal>

      <Modal open={!!delId} title="Delete Task?" onClose={() => setDelId(null)} footer={<><Button variant="ghost" onClick={() => setDelId(null)}>Cancel</Button><Button variant="danger" loading={taskBusy} onClick={confirmDelete}>Delete</Button></>}>
        <p className="text-sm text-slate-300">Are you sure you want to delete this task?</p>
      </Modal>

    </div>
  );
}
