import React, { useMemo, useState } from "react";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { certificationsApi, enrollmentsApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Modal } from "../components/Modal.jsx";
import { CardSkeleton } from "../components/Skeleton.jsx";

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  "All",
  "Cloud Computing",
  "Programming",
  "ServiceNow",
  "DevOps",
  "Development",
  "Testing",
  "Support",
];

const CATEGORY_COLORS = {
  "Cloud Computing": { bg: "rgba(59,130,246,0.15)", text: "#60a5fa", border: "rgba(59,130,246,0.3)" },
  "Programming": { bg: "rgba(16,185,129,0.15)", text: "#34d399", border: "rgba(16,185,129,0.3)" },
  "ServiceNow": { bg: "rgba(139,92,246,0.15)", text: "#a78bfa", border: "rgba(139,92,246,0.3)" },
  "DevOps": { bg: "rgba(245,158,11,0.15)", text: "#fbbf24", border: "rgba(245,158,11,0.3)" },
  "Development": { bg: "rgba(236,72,153,0.15)", text: "#f472b6", border: "rgba(236,72,153,0.3)" },
  "Testing": { bg: "rgba(6,182,212,0.15)", text: "#22d3ee", border: "rgba(6,182,212,0.3)" },
  "Support": { bg: "rgba(99,102,241,0.15)", text: "#818cf8", border: "rgba(99,102,241,0.3)" },
};

const CATEGORY_ICONS = {
  "Cloud Computing": "☁️",
  "Programming": "💻",
  "ServiceNow": "🔧",
  "DevOps": "⚙️",
  "Development": "🚀",
  "Testing": "🧪",
  "Support": "🎧",
};

const LEVEL_COLORS = {
  "Foundational": { bg: "rgba(16,185,129,0.1)", text: "#34d399" },
  "Foundation": { bg: "rgba(16,185,129,0.1)", text: "#34d399" },
  "Entry": { bg: "rgba(16,185,129,0.1)", text: "#34d399" },
  "Associate": { bg: "rgba(59,130,246,0.1)", text: "#60a5fa" },
  "Professional": { bg: "rgba(139,92,246,0.1)", text: "#a78bfa" },
  "Specialist": { bg: "rgba(245,158,11,0.1)", text: "#fbbf24" },
  "Expert": { bg: "rgba(239,68,68,0.1)", text: "#f87171" },
};

const inputClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50";

// ── Cert icon badge ──────────────────────────────────────────────────────────
function CertIcon({ category }) {
  const colors = CATEGORY_COLORS[category] || { bg: "rgba(99,102,241,0.15)", text: "#818cf8" };
  const icon = CATEGORY_ICONS[category] || "📜";
  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
      style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border || colors.bg}` }}
    >
      {icon}
    </div>
  );
}

// ── Tag badge ────────────────────────────────────────────────────────────────
function Badge({ label, colors }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: colors?.bg || "rgba(255,255,255,0.08)", color: colors?.text || "#94a3b8" }}
    >
      {label}
    </span>
  );
}

// ── Single certification card ─────────────────────────────────────────────────
function CertCard({ cert, enrolled, onEnroll, onSave, onCheckEligibility, onStartTest, eligibility, enrolling, isAdmin }) {
  const catColors = CATEGORY_COLORS[cert.category] || {};
  const lvlColors = LEVEL_COLORS[cert.level] || {};
  const prereqs = cert.prerequisites ? cert.prerequisites.split("\n").filter(Boolean) : [];

  const isEnrolled = enrolled?.status === "selected" || enrolled?.status === "in_progress" || enrolled?.status === "completed";
  const isSaved = enrolled?.status === "saved_for_later";
  const testPassed = eligibility?.test_passed || eligibility?.test_attempt?.passed;
  const canEnroll = testPassed === true;

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        border: "1px solid var(--color-border)",
        backgroundColor: "var(--color-bg-surface)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
      }}
    >
      {/* Glow on hover */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${catColors.bg || "rgba(99,102,241,0.2)"}, transparent)` }}
      />

      {/* Header */}
      <div className="relative flex gap-4">
        <CertIcon category={cert.category} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold leading-snug text-white">{cert.title}</h3>
          <p className="mt-0.5 text-sm text-slate-400">{cert.provider}</p>
        </div>
      </div>

      {/* Tags row */}
      <div className="relative mt-3 flex flex-wrap gap-1.5">
        {cert.category && <Badge label={cert.category} colors={catColors} />}
        {cert.level && <Badge label={cert.level} colors={lvlColors} />}
        {cert.duration && (
          <Badge
            label={cert.duration}
            colors={{ bg: "rgba(168,85,247,0.1)", text: "#c084fc" }}
          />
        )}
      </div>

      {/* Description */}
      {cert.description && (
        <p className="relative mt-3 text-sm leading-relaxed text-slate-400 line-clamp-2">{cert.description}</p>
      )}

      {/* Prerequisites */}
      {prereqs.length > 0 && (
        <div className="relative mt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prerequisites:</p>
          <ul className="mt-1 space-y-0.5">
            {prereqs.map((p, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-400">
                <span className="mt-0.5 text-indigo-400">•</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer actions */}
      {eligibility && (
        <div className="relative mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className={`text-xs font-semibold uppercase tracking-wider ${testPassed ? "text-emerald-300" : eligibility.eligible ? "text-sky-300" : "text-amber-300"}`}>
            {testPassed ? "Test Passed" : eligibility.eligible ? "Profile Looks Eligible" : "Review Required"}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {eligibility.message || eligibility.explanation}
          </p>
          {eligibility.test_attempt && (
            <p className="mt-1 text-xs text-slate-500">Latest test score: {eligibility.test_attempt.score}%</p>
          )}
        </div>
      )}

      <div className="relative mt-4 flex items-center justify-between gap-2 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
        {isAdmin ? (
          <>
            <span className="text-xs text-slate-500">Admin manages catalog details from this page</span>
          </>
        ) : (
        <>
        {isEnrolled ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Enrolled
          </span>
        ) : isSaved ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-amber-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Saved for Later
          </span>
        ) : (
          <span className="text-xs text-slate-500">Open enrollment</span>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {!isEnrolled && !isSaved && (
            <>
              <Button
                variant="ghost"
                className="!py-1.5 !px-3 !text-xs"
                loading={enrolling === `save-${cert.id}`}
                onClick={() => onSave(cert.id)}
              >
                Save for Later
              </Button>
              <Button
                variant="ghost"
                className="!py-1.5 !px-3 !text-xs"
                loading={enrolling === `eligibility-${cert.id}`}
                onClick={() => onCheckEligibility(cert.id)}
              >
                Check Eligibility
              </Button>
              <Button
                variant="ghost"
                className="!py-1.5 !px-3 !text-xs"
                loading={enrolling === `test-${cert.id}`}
                onClick={() => onStartTest(cert.id)}
              >
                Take Test
              </Button>
              <Button
                className="!py-1.5 !px-3 !text-xs"
                loading={enrolling === `enroll-${cert.id}`}
                disabled={!canEnroll}
                onClick={() => onEnroll(cert.id)}
              >
                {canEnroll ? "Enroll Now" : "Pass Test"}
              </Button>
            </>
          )}
          {isSaved && (
            <>
              <Button
                variant="ghost"
                className="!py-1.5 !px-3 !text-xs"
                loading={enrolling === `eligibility-${cert.id}`}
                onClick={() => onCheckEligibility(cert.id)}
              >
                Check Eligibility
              </Button>
              <Button
                variant="ghost"
                className="!py-1.5 !px-3 !text-xs"
                loading={enrolling === `test-${cert.id}`}
                onClick={() => onStartTest(cert.id)}
              >
                Take Test
              </Button>
              <Button
                className="!py-1.5 !px-3 !text-xs"
                loading={enrolling === `enroll-${cert.id}`}
                disabled={!canEnroll}
                onClick={() => onEnroll(cert.id)}
              >
                {canEnroll ? "Enroll Now" : "Pass Test"}
              </Button>
            </>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ search }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-5xl">🔍</div>
      <h3 className="font-display text-lg font-semibold text-white">No certifications found</h3>
      <p className="mt-2 text-sm text-slate-400">
        {search ? `No results for "${search}". Try a different keyword.` : "No certifications in this category yet."}
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const emptyCert = { title: "", provider: "", level: "", description: "", estimated_hours: "", exam_cost: "", tags: "", category: "", duration: "", prerequisites: "" };

export function CertificationsPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();

  // State
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [enrolling, setEnrolling] = useState(null); // "enroll-<id>" | "save-<id>"
  const [eligibility, setEligibility] = useState({});
  const [testModal, setTestModal] = useState(null);
  const [testAnswers, setTestAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);

  // Data
  const { data: certs, loading, error, reload } = useAsyncData(
    () => certificationsApi.list({ search: search || undefined, category: category !== "All" ? category : undefined }).then((r) => r.data),
    [search, category]
  );
  const { data: myEnrollments, reload: reloadEnrollments } = useAsyncData(
    () => enrollmentsApi.my().then((r) => r.data),
    []
  );

  // Build map: certId → enrollment
  const enrollmentMap = useMemo(
    () => Object.fromEntries((myEnrollments || []).map((e) => [e.certification_id, e])),
    [myEnrollments]
  );

  // Admin CRUD state
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyCert);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Enroll Now ──────────────────────────────────────────────────────────
  async function handleEnroll(certId) {
    setEnrolling(`enroll-${certId}`);
    try {
      await enrollmentsApi.create({ certification_id: certId, status: "selected" });
      toast.success("You're enrolled! Check your Enrollments page.");
      reloadEnrollments();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Enrollment failed");
    } finally {
      setEnrolling(null);
    }
  }

  // ── Save for Later ──────────────────────────────────────────────────────
  async function handleSave(certId) {
    setEnrolling(`save-${certId}`);
    try {
      await enrollmentsApi.create({ certification_id: certId, status: "saved_for_later" });
      toast.success("Saved for later! You'll find it in your Enrollments.");
      reloadEnrollments();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not save");
    } finally {
      setEnrolling(null);
    }
  }

  async function handleEligibility(certId) {
    setEnrolling(`eligibility-${certId}`);
    try {
      const { data } = await certificationsApi.eligibility(certId);
      setEligibility((prev) => ({ ...prev, [certId]: data }));
      toast.success(data.test_attempt?.passed ? "Eligibility test already passed." : "Take the test before enrolling.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Eligibility check failed");
    } finally {
      setEnrolling(null);
    }
  }

  async function startEligibilityTest(certId) {
    setEnrolling(`test-${certId}`);
    setTestResult(null);
    setTestAnswers({});
    try {
      const { data } = await certificationsApi.eligibilityTest(certId);
      setTestModal(data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to load test");
    } finally {
      setEnrolling(null);
    }
  }

  async function submitEligibilityTest() {
    if (!testModal) return;
    setSubmitting(true);
    try {
      const { data } = await certificationsApi.submitEligibilityTest(testModal.certification_id, { answers: testAnswers });
      setTestResult(data);
      setEligibility((prev) => ({
        ...prev,
        [testModal.certification_id]: {
          eligible: data.passed,
          test_passed: data.passed,
          status: data.passed ? "eligible" : "review_required",
          message: data.message,
          test_attempt: {
            id: data.attempt_id,
            score: data.score,
            passed: data.passed,
            status: data.status,
          },
        },
      }));
      toast.success(data.message);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to submit test");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Admin CRUD ──────────────────────────────────────────────────────────
  async function submitCert(e) {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      title: form.title, provider: form.provider,
      level: form.level || null, description: form.description || null,
      estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
      exam_cost: form.exam_cost ? Number(form.exam_cost) : null,
      tags: form.tags || null, category: form.category || null,
      duration: form.duration || null, prerequisites: form.prerequisites || null,
    };
    try {
      if (modal === "create") {
        await certificationsApi.create(payload);
        toast.success("Certification created.");
      } else if (modal === "edit" && selectedId) {
        await certificationsApi.patch(selectedId, payload);
        toast.success("Updated.");
      }
      setModal(null);
      reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await certificationsApi.remove(selectedId);
      toast.success("Deleted.");
      setModal(null);
      setSelectedId(null);
      reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function exportCertifications() {
    setSubmitting(true);
    try {
      const { data } = await certificationsApi.exportCsv();
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "certifications-with-drives.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Certification export downloaded.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Export failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Available Certifications</h2>
          <p className="mt-1 text-slate-400">Explore and enroll in certification programs</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" loading={submitting} onClick={exportCertifications}>
              Export Certificates
            </Button>
            <Button onClick={() => { setForm(emptyCert); setSelectedId(null); setModal("create"); }}>
              + New Certification
            </Button>
          </div>
        )}
      </div>

      {/* ── Search + filter bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search certifications… (e.g. aws, python, kubernetes)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition"
            style={{
              backgroundColor: "var(--color-bg-input)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        {/* Category filter */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border py-2.5 pl-3 pr-10 text-sm outline-none transition"
          style={{
            backgroundColor: "var(--color-bg-input)",
            borderColor: "var(--color-border)",
            color: "var(--color-text-primary)",
            minWidth: "160px",
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* ── Category chips ── */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const colors = CATEGORY_COLORS[c] || {};
          const isActive = category === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className="rounded-full px-3 py-1 text-xs font-medium transition-all duration-200"
              style={
                isActive
                  ? { backgroundColor: colors.bg || "rgba(99,102,241,0.2)", color: colors.text || "#818cf8", border: `1px solid ${colors.border || "rgba(99,102,241,0.4)"}` }
                  : { backgroundColor: "var(--color-bg-input)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }
              }
            >
              {CATEGORY_ICONS[c] || ""} {c}
            </button>
          );
        })}
      </div>

      {/* ── Results count ── */}
      {!loading && certs && (
        <p className="text-xs text-slate-500">
          {certs.length} certification{certs.length !== 1 ? "s" : ""} found
          {search ? ` for "${search}"` : ""}
          {category !== "All" ? ` in ${category}` : ""}
        </p>
      )}

      {/* ── Card grid ── */}
      {loading && !certs ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <Card><p className="text-rose-300">{error}</p></Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {(certs || []).length === 0 ? (
            <EmptyState search={search} />
          ) : (
            (certs || []).map((cert) => (
              <CertCard
                key={cert.id}
                cert={cert}
                enrolled={enrollmentMap[cert.id]}
                onEnroll={handleEnroll}
                onSave={handleSave}
                onCheckEligibility={handleEligibility}
                onStartTest={startEligibilityTest}
                eligibility={eligibility[cert.id]}
                enrolling={enrolling}
                isAdmin={isAdmin}
              />
            ))
          )}
        </div>
      )}

      {/* ── Admin CRUD ── */}
      {isAdmin && (
        <>
          <div className="mt-2 text-xs text-slate-600">Admin: right-click a card or use the button above to edit certifications.</div>
          {/* Edit buttons below each card for admin */}
          {(certs || []).length > 0 && (
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)" }}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Admin — Quick Edit</p>
              <div className="flex flex-wrap gap-2">
                {(certs || []).map((c) => (
                  <div key={c.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(c.id);
                        setForm({ title: c.title, provider: c.provider, level: c.level || "", description: c.description || "", estimated_hours: c.estimated_hours ?? "", exam_cost: c.exam_cost ?? "", tags: c.tags || "", category: c.category || "", duration: c.duration || "", prerequisites: c.prerequisites || "" });
                        setModal("edit");
                      }}
                      className="rounded-lg px-2 py-1 text-xs transition hover:bg-white/10 text-slate-400 hover:text-white"
                    >
                      ✏️ {c.title.slice(0, 20)}{c.title.length > 20 ? "…" : ""}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedId(c.id); setModal("delete"); }}
                      className="rounded-lg px-1.5 py-1 text-xs text-rose-400 transition hover:bg-rose-500/10"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Create / Edit modal ── */}
      <Modal
        open={modal === "create" || modal === "edit"}
        title={modal === "create" ? "Create Certification" : "Edit Certification"}
        onClose={() => setModal(null)}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" form="cert-form" loading={submitting}>Save</Button>
          </>
        }
      >
        <form id="cert-form" onSubmit={submitCert} className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">Title</label>
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-slate-500">Provider</label>
            <input className={inputClass} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-slate-500">Category</label>
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">— Select —</option>
              {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Level</label>
            <input className={inputClass} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Duration (e.g. "3 months")</label>
            <input className={inputClass} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Est. hours</label>
            <input className={inputClass} type="number" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Exam cost ($)</label>
            <input className={inputClass} type="number" value={form.exam_cost} onChange={(e) => setForm({ ...form, exam_cost: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Tags (comma-separated)</label>
            <input className={inputClass} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">Description</label>
            <textarea className={`${inputClass} min-h-[80px]`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">Prerequisites (one per line)</label>
            <textarea className={`${inputClass} min-h-[72px]`} value={form.prerequisites} onChange={(e) => setForm({ ...form, prerequisites: e.target.value })} placeholder="e.g. Cloud Fundamentals&#10;2+ years experience" />
          </div>
        </form>
      </Modal>

      <Modal
        open={!!testModal}
        title={testModal?.title || "Eligibility test"}
        onClose={() => setTestModal(null)}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setTestModal(null)}>Close Test</Button>
            {!isAdmin && !testResult && (
              <Button
                loading={submitting}
                disabled={!(testModal?.questions || []).every((q) => testAnswers[q.id])}
                onClick={submitEligibilityTest}
              >
                Submit Test
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-3">
          <p className="pr-8 text-sm leading-6 text-slate-400">
            Answer these basic readiness questions for this certification. They stay intentionally simple so you can confirm foundation-level knowledge before enrolling.
          </p>
          {testResult && (
            <div className={`rounded-xl border p-3 ${testResult.passed ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>
              Score: {testResult.score}% · {testResult.message}
            </div>
          )}
          {testResult && (
            <Button className="!px-3 !py-1.5 !text-xs" variant="ghost" onClick={() => setTestModal(null)}>Close Test</Button>
          )}
          {(testModal?.questions || []).map((q) => (
            <div key={q.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm font-semibold leading-5 text-white">{q.question}</div>
              <div className="mt-2 grid gap-2">
                {q.options.map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.07]">
                    <input
                      type="radio"
                      name={q.id}
                      disabled={isAdmin || !!testResult}
                      checked={testAnswers[q.id] === option}
                      onChange={() => setTestAnswers((prev) => ({ ...prev, [q.id]: option }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
              {isAdmin && <div className="mt-2 text-xs text-indigo-300">Expected answer: {q.answer}</div>}
            </div>
          ))}
        </div>
      </Modal>

      {/* ── Delete modal ── */}
      <Modal
        open={modal === "delete"}
        title="Delete certification?"
        onClose={() => setModal(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="danger" loading={submitting} onClick={confirmDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-slate-300">This will permanently remove the certification and all associated enrollments.</p>
      </Modal>
    </div>
  );
}
