import React, { useMemo, useState } from "react";
import { aiApi, drivesBrdApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Table } from "../components/Table.jsx";

const inputClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50";

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-2 font-display text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function ScorePill({ value }) {
  const tone = value >= 75 ? "bg-emerald-500/15 text-emerald-200" : value >= 50 ? "bg-amber-500/15 text-amber-200" : "bg-rose-500/15 text-rose-200";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{value}%</span>;
}

function ListBlock({ items, empty = "No items yet." }) {
  if (!items?.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-2 text-sm text-slate-300">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function AiPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const [text, setText] = useState("");
  const [extractResult, setExtractResult] = useState(null);
  const [genPayload, setGenPayload] = useState({ enrollment_id: "", weeks: 6, hours_per_week: 6 });
  const [genResult, setGenResult] = useState(null);
  const [goal, setGoal] = useState("Cloud Engineer");
  const [learningPath, setLearningPath] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [resumeGoal, setResumeGoal] = useState("Cloud Engineer");
  const [resumeResult, setResumeResult] = useState(null);
  const [driveId, setDriveId] = useState("");
  const [driveSummary, setDriveSummary] = useState(null);
  const [candidateRows, setCandidateRows] = useState([]);
  const [voucherRows, setVoucherRows] = useState([]);
  const [voucherInfo, setVoucherInfo] = useState(null);
  const [voucherBudget, setVoucherBudget] = useState("");
  const [budgetResult, setBudgetResult] = useState(null);
  const [reconductRows, setReconductRows] = useState([]);
  const [passRateRows, setPassRateRows] = useState([]);
  const [fraudResult, setFraudResult] = useState(null);
  const [adminQuery, setAdminQuery] = useState("Show users who passed but have not received voucher");
  const [adminQueryResult, setAdminQueryResult] = useState(null);
  const [driveReport, setDriveReport] = useState(null);
  const [uploadId, setUploadId] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [reminder, setReminder] = useState({ type: "progress", audience: "learner", context: "" });
  const [reminderResult, setReminderResult] = useState(null);
  const [busy, setBusy] = useState("");

  const roadmap = useAsyncData(() => aiApi.userRoadmap().then((r) => r.data), []);
  const matches = useAsyncData(() => aiApi.certificationMatches().then((r) => r.data), []);
  const readiness = useAsyncData(() => aiApi.examReadiness().then((r) => r.data), []);
  const dropout = useAsyncData(() => (isAdmin ? aiApi.adminDropoutRisk().then((r) => r.data) : Promise.resolve({ risks: [] })), [isAdmin]);
  const drives = useAsyncData(() => (isAdmin ? drivesBrdApi.adminList().then((r) => r.data) : Promise.resolve([])), [isAdmin]);

  const topMatches = useMemo(() => matches.data?.matches?.slice(0, 6) || [], [matches.data]);
  const topReadiness = useMemo(() => readiness.data?.readiness?.[0]?.readiness_score ?? 0, [readiness.data]);

  async function run(label, action) {
    setBusy(label);
    try {
      await action();
    } catch (err) {
      toast.error(err?.response?.data?.detail || err.message || "Request failed");
    } finally {
      setBusy("");
    }
  }

  async function extract(e) {
    e.preventDefault();
    await run("extract", async () => {
      const { data } = await aiApi.extractCertificate({ text });
      setExtractResult(data);
      toast.success("Certificate fields extracted.");
    });
  }

  async function genTasks(e) {
    e.preventDefault();
    await run("tasks", async () => {
      const { data } = await aiApi.generateTasks({
        enrollment_id: Number(genPayload.enrollment_id),
        weeks: Number(genPayload.weeks),
        hours_per_week: Number(genPayload.hours_per_week),
      });
      setGenResult(data);
      toast.success(`Created ${data.created ?? 0} tasks.`);
    });
  }

  function requireDriveId() {
    if (!driveId) {
      toast.error("Enter a drive ID first.");
      return false;
    }
    return true;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">AI Tools</h2>
        <p className="text-slate-400">Personalized certification guidance, admin insights, ranking, reports, and verification support.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Roadmap" value={roadmap.data?.profile?.level || "-"} />
        <Metric label="Completed" value={roadmap.data?.profile?.completed_count ?? 0} />
        <Metric label="Active" value={roadmap.data?.profile?.active_count ?? 0} />
        <Metric label="Exam Ready" value={`${topReadiness}%`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card title="User AI Roadmap & Skill Gap Analysis" subtitle="Personalized from enrollments, completed certifications, and available catalog">
          {roadmap.loading ? (
            <p className="text-sm text-slate-400">Loading roadmap...</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                {(roadmap.data?.roadmap || []).map((step) => (
                  <div key={step.stage} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300">{step.stage}</div>
                    <div className="mt-2 font-semibold text-white">{step.title}</div>
                    <p className="mt-1 text-sm text-slate-400">{step.details}</p>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-white">Skill gaps to close</h3>
                <ListBlock items={roadmap.data?.skill_gaps || []} empty="No clear gaps detected yet." />
              </div>
            </div>
          )}
        </Card>

        <Card title="AI Certification Match Score" subtitle="Ranked certifications with reasons and gap signals">
          <Table
            rows={topMatches}
            maxHeight={360}
            columns={[
              { key: "title", label: "Certification" },
              { key: "provider", label: "Provider" },
              { key: "match_score", label: "Match", render: (row) => <ScorePill value={row.match_score} /> },
              { key: "reason", label: "Reason", render: (row) => row.reasons?.[0] || "-" },
            ]}
            emptyMessage={matches.loading ? "Loading matches..." : "No certification matches yet."}
          />
        </Card>
      </div>

      <Card title="AI Learning Path Generator" subtitle="Generate a role-based path from your current certification history">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1">
            <label className="text-xs text-slate-500">Career goal</label>
            <input className={inputClass} value={goal} onChange={(e) => setGoal(e.target.value)} />
          </div>
          <Button
            loading={busy === "path"}
            onClick={() =>
              run("path", async () => {
                const { data } = await aiApi.learningPath({ goal });
                setLearningPath(data);
                toast.success("Learning path generated.");
              })
            }
          >
            Generate Path
          </Button>
        </div>
        {learningPath && (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-slate-400">{learningPath.summary}</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {learningPath.steps.map((step) => (
                <div key={step.step} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step {step.step}</div>
                      <h3 className="mt-1 font-semibold text-white">{step.certification.title}</h3>
                    </div>
                    <ScorePill value={step.match_score} />
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{step.focus}</p>
                  <p className="mt-2 text-xs text-slate-500">{step.estimated_weeks} week estimate</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="AI Exam Readiness Score" subtitle="Predicts whether a learner is ready to use an exam voucher">
          <Table
            rows={readiness.data?.readiness || []}
            maxHeight={360}
            columns={[
              { key: "certification", label: "Certification" },
              { key: "readiness_score", label: "Ready", render: (row) => <ScorePill value={row.readiness_score} /> },
              { key: "readiness_level", label: "Level" },
              { key: "open_tasks", label: "Open" },
              { key: "recommended_action", label: "Action" },
            ]}
            emptyMessage={readiness.loading ? "Loading readiness scores..." : "No active enrollments to score."}
          />
        </Card>

        <Card title="Resume-to-Certification Recommender" subtitle="Paste resume text to match skills against the catalog">
          <div className="space-y-3">
            <input className={inputClass} value={resumeGoal} onChange={(e) => setResumeGoal(e.target.value)} placeholder="Target role" />
            <textarea className={`${inputClass} min-h-[120px]`} value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Paste resume or profile summary..." />
            <Button
              loading={busy === "resume"}
              onClick={() =>
                resumeText.trim()
                  ? run("resume", async () => {
                      const { data } = await aiApi.resumeRecommendations({ resume_text: resumeText, goal: resumeGoal });
                      setResumeResult(data);
                      toast.success("Resume recommendations generated.");
                    })
                  : toast.error("Paste resume text first.")
              }
            >
              Recommend Certifications
            </Button>
          </div>
          {resumeResult && (
            <div className="mt-4">
              <Table
                rows={resumeResult.recommendations || []}
                maxHeight={320}
                columns={[
                  { key: "title", label: "Certification" },
                  { key: "provider", label: "Provider" },
                  { key: "resume_match_score", label: "Match", render: (row) => <ScorePill value={row.resume_match_score} /> },
                  { key: "reason", label: "Reason" },
                ]}
              />
            </div>
          )}
        </Card>
      </div>

      {isAdmin && (
        <>
          <Card title="Admin Drive Summary, Risk Insights & One-Click Report" subtitle="Enter a drive ID to generate operational insights">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-slate-500">Drive</label>
                <select className={inputClass} value={driveId} onChange={(e) => setDriveId(e.target.value)}>
                  <option value="">All drives</option>
                  {(drives.data || [])
                    .filter((drive) => (drive.registrations_count || 0) > 0)
                    .map((drive) => (
                      <option key={drive.id} value={drive.id}>
                        #{drive.id} - {drive.name} ({drive.voucher_ready_count || 0} ready)
                      </option>
                    ))}
                </select>
              </div>
              <Button
                variant="ghost"
                loading={busy === "summary"}
                onClick={() =>
                  requireDriveId() &&
                  run("summary", async () => {
                    const { data } = await aiApi.adminDriveSummary(Number(driveId));
                    setDriveSummary(data);
                  })
                }
              >
                Summary
              </Button>
              <Button
                variant="ghost"
                loading={busy === "report"}
                onClick={() =>
                  requireDriveId() &&
                  run("report", async () => {
                    const { data } = await aiApi.adminDriveReport(Number(driveId));
                    setDriveReport(data);
                    toast.success("Drive report generated.");
                  })
                }
              >
                Generate Report
              </Button>
              <Button
                variant="ghost"
                loading={busy === "rank"}
                onClick={() =>
                  run("rank", async () => {
                    const { data } = await aiApi.adminCandidateRanking({ drive_id: driveId ? Number(driveId) : undefined });
                    setCandidateRows(data.candidates || []);
                  })
                }
              >
                Rank Candidates
              </Button>
              <Button
                variant="ghost"
                loading={busy === "vouchers"}
                onClick={() =>
                  run("vouchers", async () => {
                    const { data } = await aiApi.adminVoucherRecommendations({ drive_id: driveId ? Number(driveId) : undefined });
                    setVoucherRows(data.recommendations || []);
                    setVoucherInfo({ message: data.message, source: data.source });
                  })
                }
              >
                Voucher Recommendations
              </Button>
            </div>

            {driveSummary && (
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 lg:col-span-1">
                  <h3 className="font-semibold text-white">Summary</h3>
                  <p className="mt-2 text-sm text-slate-400">{driveSummary.summary}</p>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-white">Risks</h3>
                  <ListBlock items={driveSummary.risks} />
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-white">Next actions</h3>
                  <ListBlock items={driveSummary.next_actions} />
                </div>
              </div>
            )}

            {driveReport && (
              <div className="mt-5 rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{driveReport.title}</h3>
                    <p className="mt-1 text-sm text-indigo-100">{driveReport.executive_summary}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">{driveReport.generated_at?.slice(0, 10)}</span>
                </div>
              </div>
            )}
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="AI Candidate Ranking For Drive Approvals" subtitle="Approve, review, or hold recommendations">
              <Table
                rows={candidateRows}
                maxHeight={360}
                columns={[
                  { key: "registration_id", label: "Reg" },
                  { key: "candidate_email", label: "Candidate" },
                  { key: "score", label: "Score", render: (row) => <ScorePill value={row.score} /> },
                  { key: "recommendation", label: "Action" },
                  { key: "reason", label: "Reason", render: (row) => row.reasons?.[0] || "-" },
                ]}
                emptyMessage="Run candidate ranking to view recommendations."
              />
            </Card>

            <Card title="Smart Voucher Allocation Recommendation" subtitle="Prioritized users who are most ready for voucher assignment">
              {voucherInfo && (
                <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
                  <p>{voucherInfo.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Source: registrations table, statuses {voucherInfo.source?.eligible_statuses?.join(", ")}.
                  </p>
                </div>
              )}
              <Table
                rows={voucherRows}
                maxHeight={360}
                columns={[
                  { key: "registration_id", label: "Reg" },
                  { key: "candidate_email", label: "Candidate" },
                  { key: "score", label: "Score", render: (row) => <ScorePill value={row.score} /> },
                  { key: "priority", label: "Priority" },
                  { key: "reason", label: "Reason" },
                ]}
                emptyMessage="Run voucher recommendations to view candidates."
              />
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="AI Voucher Budget Optimizer" subtitle="Allocates limited voucher budget to the highest-readiness candidates">
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs text-slate-500">Voucher budget</label>
                  <input className={inputClass} type="number" value={voucherBudget} onChange={(e) => setVoucherBudget(e.target.value)} placeholder="Auto" />
                </div>
                <Button
                  variant="ghost"
                  loading={busy === "budget"}
                  onClick={() =>
                    run("budget", async () => {
                      const { data } = await aiApi.adminVoucherBudgetOptimizer({
                        drive_id: driveId ? Number(driveId) : undefined,
                        budget: voucherBudget === "" ? undefined : Number(voucherBudget),
                      });
                      setBudgetResult(data);
                      toast.success("Voucher budget optimized.");
                    })
                  }
                >
                  Optimize Budget
                </Button>
              </div>
              {budgetResult && <p className="mb-3 text-sm text-slate-400">{budgetResult.summary}</p>}
              <Table
                rows={budgetResult?.allocations || []}
                maxHeight={320}
                columns={[
                  { key: "allocation_rank", label: "Rank" },
                  { key: "candidate_email", label: "Candidate" },
                  { key: "score", label: "Score", render: (row) => <ScorePill value={row.score} /> },
                  { key: "priority", label: "Priority" },
                  { key: "budget_reason", label: "Reason" },
                ]}
                emptyMessage="Run budget optimization to view allocations."
              />
            </Card>

            <Card title="Natural Language Admin Querying" subtitle="Ask operational questions without building filters manually">
              <div className="mb-4 space-y-3">
                <textarea className={`${inputClass} min-h-[90px]`} value={adminQuery} onChange={(e) => setAdminQuery(e.target.value)} />
                <Button
                  loading={busy === "nl"}
                  onClick={() =>
                    adminQuery.trim()
                      ? run("nl", async () => {
                          const { data } = await aiApi.adminNaturalLanguageQuery({ query: adminQuery, limit: 25 });
                          setAdminQueryResult(data);
                          toast.success("Admin query answered.");
                        })
                      : toast.error("Enter a query first.")
                  }
                >
                  Ask Query
                </Button>
              </div>
              {adminQueryResult && <p className="mb-3 text-sm text-slate-400">{adminQueryResult.explanation}</p>}
              <Table
                rows={adminQueryResult?.rows || []}
                maxHeight={320}
                columns={[
                  { key: "registration_id", label: "Reg" },
                  { key: "drive_id", label: "Drive" },
                  { key: "candidate_email", label: "Candidate" },
                  { key: "status", label: "Status" },
                  { key: "reason", label: "Reason" },
                ]}
                emptyMessage="Ask a query to view matching rows."
              />
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card title="AI Re-Conduct Recommendation" subtitle="Find completed drives worth running again">
              <Button
                className="mb-4"
                variant="ghost"
                loading={busy === "reconduct"}
                onClick={() =>
                  run("reconduct", async () => {
                    const { data } = await aiApi.adminReconductRecommendations();
                    setReconductRows(data.recommendations || []);
                  })
                }
              >
                Analyze Drives
              </Button>
              <Table
                rows={reconductRows}
                maxHeight={320}
                columns={[
                  { key: "drive_id", label: "Drive" },
                  { key: "reconduct_score", label: "Score", render: (row) => <ScorePill value={row.reconduct_score} /> },
                  { key: "pass_rate", label: "Pass" },
                  { key: "recommended_action", label: "Action" },
                ]}
                emptyMessage="Run analysis to view re-conduct candidates."
              />
            </Card>

            <Card title="AI Pass Rate Predictor" subtitle="Predicts drive pass-rate risk before assessment">
              <Button
                className="mb-4"
                variant="ghost"
                loading={busy === "passrate"}
                onClick={() =>
                  run("passrate", async () => {
                    const { data } = await aiApi.adminPassRatePredictor({ drive_id: driveId ? Number(driveId) : undefined });
                    setPassRateRows(data.predictions || []);
                  })
                }
              >
                Predict Pass Rate
              </Button>
              <Table
                rows={passRateRows}
                maxHeight={320}
                columns={[
                  { key: "drive_id", label: "Drive" },
                  { key: "predicted_pass_rate", label: "Predicted", render: (row) => <ScorePill value={row.predicted_pass_rate} /> },
                  { key: "confidence", label: "Confidence", render: (row) => <ScorePill value={row.confidence} /> },
                  { key: "risk_level", label: "Risk" },
                ]}
                emptyMessage="Run prediction to view pass-rate risk."
              />
            </Card>

            <Card title="Fraud / Duplicate Detection" subtitle="Flags duplicate registrations, voucher duplication, and certificate mismatches">
              <Button
                className="mb-4"
                variant="ghost"
                loading={busy === "fraud"}
                onClick={() =>
                  run("fraud", async () => {
                    const { data } = await aiApi.adminFraudDuplicateDetection();
                    setFraudResult(data);
                  })
                }
              >
                Run Scan
              </Button>
              {fraudResult && (
                <div className={`mb-3 rounded-xl border p-3 text-sm ${fraudResult.has_live_findings ? "border-amber-400/20 bg-amber-500/10 text-amber-100" : "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"}`}>
                  {fraudResult.summary}
                  {!fraudResult.has_live_findings && <div className="mt-1 text-xs opacity-80">The table below is showing example scenarios only, not live fraud.</div>}
                </div>
              )}
              <Table
                rows={fraudResult?.has_live_findings ? (fraudResult?.flags || []) : (fraudResult?.examples || [])}
                maxHeight={320}
                columns={[
                  { key: "type", label: "Type" },
                  { key: "severity", label: "Severity" },
                  { key: "email", label: "Candidate" },
                  { key: "drive_id", label: "Drive" },
                  { key: "reason", label: "Reason" },
                ]}
                emptyMessage="Run fraud scan to view live signals or examples."
              />
              {fraudResult?.review_signals?.length > 0 && (
                <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                  {fraudResult.review_signals.length} certificate upload(s) need manual review. These are not counted as fraud until rejected evidence remains mismatched.
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Certificate Verification Confidence Scoring" subtitle="Admin check for uploaded certificate evidence">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs text-slate-500">Upload ID</label>
                  <input className={inputClass} value={uploadId} onChange={(e) => setUploadId(e.target.value)} />
                </div>
                <Button
                  loading={busy === "confidence"}
                  onClick={() =>
                    uploadId
                      ? run("confidence", async () => {
                          const { data } = await aiApi.adminCertificateConfidence({ upload_id: Number(uploadId) });
                          setConfidence(data);
                        })
                      : toast.error("Enter an upload ID first.")
                  }
                >
                  Check Confidence
                </Button>
              </div>
              {confidence && (
                <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-white">{confidence.filename || `Upload #${confidence.upload_id}`}</h3>
                    <ScorePill value={confidence.confidence} />
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{confidence.reason}</p>
                  <div className="mt-3">
                    <ListBlock items={confidence.signals} />
                  </div>
                </div>
              )}
            </Card>

            <Card title="AI Reminder / Message Generator" subtitle="Create targeted reminders for learners or admin workflows">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-500">Type</label>
                  <select className={inputClass} value={reminder.type} onChange={(e) => setReminder({ ...reminder, type: e.target.value })}>
                    <option value="progress">Progress</option>
                    <option value="voucher">Voucher</option>
                    <option value="drive">Drive</option>
                    <option value="upload">Upload</option>
                    <option value="risk">Risk</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Audience</label>
                  <input className={inputClass} value={reminder.audience} onChange={(e) => setReminder({ ...reminder, audience: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-500">Context</label>
                  <textarea className={`${inputClass} min-h-[90px]`} value={reminder.context} onChange={(e) => setReminder({ ...reminder, context: e.target.value })} />
                </div>
              </div>
              <Button
                className="mt-3"
                loading={busy === "reminder"}
                onClick={() =>
                  run("reminder", async () => {
                    const { data } = await aiApi.reminderMessage(reminder);
                    setReminderResult(data);
                  })
                }
              >
                Generate Message
              </Button>
              {reminderResult && (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                  <h3 className="font-semibold text-white">{reminderResult.subject}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{reminderResult.message}</p>
                </div>
              )}
            </Card>
          </div>

          <Card title="AI Dropout / Delay Risk Prediction" subtitle="Learners who may need support or reminders">
            <Table
              rows={dropout.data?.risks || []}
              maxHeight={420}
              columns={[
                { key: "user", label: "User" },
                { key: "certification", label: "Certification" },
                { key: "risk_score", label: "Risk", render: (row) => <ScorePill value={row.risk_score} /> },
                { key: "risk_level", label: "Level" },
                { key: "overdue_tasks", label: "Overdue" },
                { key: "recommended_action", label: "Action" },
              ]}
              emptyMessage={dropout.loading ? "Loading risk predictions..." : "No medium or high delay risk detected."}
            />
          </Card>
        </>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Certificate Text Extract" subtitle="Paste OCR or certificate text">
          <form onSubmit={extract} className="space-y-4">
            <textarea className={`${inputClass} min-h-[160px]`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Certificate body..." />
            <Button type="submit" loading={busy === "extract"}>
              Extract Fields
            </Button>
          </form>
          {extractResult && (
            <pre className="mt-4 max-h-64 overflow-auto rounded-xl bg-black/50 p-4 text-xs text-emerald-100">{JSON.stringify(extractResult, null, 2)}</pre>
          )}
        </Card>

        <Card title="Generate Study Tasks" subtitle="Uses your enrollment and certification title">
          <form onSubmit={genTasks} className="max-w-md space-y-3">
            <div>
              <label className="text-xs text-slate-500">Enrollment ID</label>
              <input className={inputClass} value={genPayload.enrollment_id} onChange={(e) => setGenPayload({ ...genPayload, enrollment_id: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Weeks</label>
                <input className={inputClass} type="number" value={genPayload.weeks} onChange={(e) => setGenPayload({ ...genPayload, weeks: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-500">Hours / Week</label>
                <input className={inputClass} type="number" value={genPayload.hours_per_week} onChange={(e) => setGenPayload({ ...genPayload, hours_per_week: e.target.value })} />
              </div>
            </div>
            <Button type="submit" loading={busy === "tasks"}>
              Generate Tasks
            </Button>
          </form>
          {genResult && <pre className="mt-4 rounded-xl bg-black/50 p-4 text-xs text-slate-200">{JSON.stringify(genResult, null, 2)}</pre>}
        </Card>
      </div>
    </div>
  );
}
