import React, { useMemo, useState } from "react";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { aiApi, eligibilityAdminApi, registrationsApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Modal } from "../components/Modal.jsx";
import { Table } from "../components/Table.jsx";

export function EligibilityApprovalsAdminPage() {
  const { user, isPrivileged } = useAuth();
  const canEvaluate = user?.role === "coordinator" || user?.role === "admin";
  const canDecide = user?.role === "approver" || user?.role === "admin";
  const toast = useToast();

  const [evalRegId, setEvalRegId] = useState("");
  const [regFilters, setRegFilters] = useState({ drive_id: "", q: "" });
  const [approvalsFilter, setApprovalsFilter] = useState({ status: "pending", drive_id: "" });
  const registrations = useAsyncData(
    () =>
      isPrivileged
        ? registrationsApi
            .adminList({
              drive_id: regFilters.drive_id ? Number(regFilters.drive_id) : undefined,
              q: regFilters.q || undefined,
            })
            .then((r) => r.data)
        : Promise.resolve([]),
    [isPrivileged, regFilters.drive_id, regFilters.q]
  );

  const approvals = useAsyncData(
    () =>
      isPrivileged
        ? eligibilityAdminApi
            .approvalsList({
              status: approvalsFilter.status || undefined,
              drive_id: approvalsFilter.drive_id ? Number(approvalsFilter.drive_id) : undefined,
            })
            .then((r) => r.data)
        : Promise.resolve([]),
    [isPrivileged, approvalsFilter.status, approvalsFilter.drive_id]
  );

  const [decide, setDecide] = useState(null);
  const [approvalOpen, setApprovalOpen] = useState(null);
  const [decision, setDecision] = useState({ status: "approved", decision_notes: "" });
  const [approvalForm, setApprovalForm] = useState({ level: 1, approver_email: "" });
  const [evalResult, setEvalResult] = useState(null);
  const [candidateRanking, setCandidateRanking] = useState([]);
  const [rankingBusy, setRankingBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const eligibilityStats = useMemo(() => {
    const regs = registrations.data || [];
    const appr = approvals.data || [];
    return {
      registrations: regs.length,
      pendingApprovals: appr.filter((a) => a.status === "pending").length,
      approved: appr.filter((a) => a.status === "approved").length,
      rejected: appr.filter((a) => a.status === "rejected").length,
    };
  }, [registrations.data, approvals.data]);

  const inputClass =
    "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50";

  async function evaluate() {
    if (!evalRegId) return;
    setBusy(true);
    try {
      const { data } = await eligibilityAdminApi.evaluate({ registration_id: Number(evalRegId) });
      setEvalResult(data);
      setRegFilters((prev) => ({ ...prev, drive_id: String(data.drive_id || prev.drive_id || "") }));
      setApprovalsFilter((prev) => ({ ...prev, drive_id: String(data.drive_id || prev.drive_id || "") }));
      toast.success("Eligibility evaluated. If approval is needed, a pending approval is created automatically.");
      approvals.reload();
      registrations.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function createApproval(e) {
    e.preventDefault();
    if (!approvalOpen) return;
    setBusy(true);
    try {
      await eligibilityAdminApi.approvalsCreate({
        registration_id: approvalOpen.id,
        level: Number(approvalForm.level) || 1,
        approver_email: approvalForm.approver_email,
      });
      toast.success("Approval request created.");
      setApprovalOpen(null);
      approvals.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function decideNow(e) {
    e.preventDefault();
    if (!decide) return;
    setBusy(true);
    try {
      await eligibilityAdminApi.approvalsDecide(decide.id, decision);
      toast.success("Decision saved.");
      setDecide(null);
      approvals.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function rankCandidates() {
    setRankingBusy(true);
    try {
      const { data } = await aiApi.adminCandidateRanking({
        drive_id: regFilters.drive_id ? Number(regFilters.drive_id) : undefined,
      });
      setCandidateRanking(data.candidates || []);
      toast.success("AI candidate ranking loaded.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setRankingBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">{canDecide ? "Approver Decision Workspace" : "Eligibility Queue"}</h2>
        <p className="text-slate-400">{canDecide ? "Review pending policy exceptions, uploaded evidence, and approve or reject requests." : "Evaluate registration eligibility and create approval requests for approvers."}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Registrations loaded", eligibilityStats.registrations],
          ["Pending approvals", eligibilityStats.pendingApprovals],
          ["Approved", eligibilityStats.approved],
          ["Rejected", eligibilityStats.rejected],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
            <div className="mt-2 font-display text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      {canEvaluate && <Card title="Evaluate eligibility" >
        <p className="mb-4 text-sm leading-6 text-slate-400">
          Use a Registration ID from the table below. Evaluation reads the registration's drive, applies the drive eligibility rules, updates registration status, and creates a pending approval when manual review is required.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-slate-500">Registration ID</label>
            <input className={inputClass} value={evalRegId} onChange={(e) => setEvalRegId(e.target.value)} />
          </div>
          <Button onClick={evaluate} loading={busy} variant="ghost">
            Evaluate
          </Button>
        </div>
        {evalResult && (
          <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm sm:grid-cols-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Registration</div>
              <div className="mt-1 font-semibold text-white">#{evalResult.registration_id}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Drive</div>
              <div className="mt-1 font-semibold text-white">#{evalResult.drive_id}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Decision</div>
              <div className="mt-1 font-semibold text-white">{evalResult.decision}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reason</div>
              <div className="mt-1 text-slate-300">{evalResult.reason || "Rules passed"}</div>
            </div>
          </div>
        )}
      </Card>}

      <Card
        title="AI Candidate Ranking for Drive Approvals"
        subtitle="Ranks candidates by eligibility status, prior attempts, progress, uploaded evidence, and readiness signals"
        actions={<Button variant="ghost" loading={rankingBusy} onClick={rankCandidates}>Rank Candidates</Button>}
      >
        <Table
          columns={[
            { key: "registration_id", label: "Reg ID" },
            { key: "drive_id", label: "Drive" },
            { key: "candidate_name", label: "Name" },
            { key: "candidate_email", label: "Email" },
            { key: "score", label: "Score", render: (r) => `${r.score}%` },
            { key: "recommendation", label: "Recommendation" },
            { key: "reason", label: "Reason", render: (r) => r.reasons?.[0] || "-" },
          ]}
          rows={candidateRanking}
          emptyMessage="Click Rank Candidates to load AI approval recommendations."
        />
      </Card>

      <Card title="Registrations needing evaluation" subtitle="Registration IDs come from this table">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs text-slate-500">Drive ID</label>
            <input className={inputClass} value={regFilters.drive_id} onChange={(e) => setRegFilters({ ...regFilters, drive_id: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Search</label>
            <input className={inputClass} value={regFilters.q} onChange={(e) => setRegFilters({ ...regFilters, q: e.target.value })} placeholder="email/name/emp_id" />
          </div>
          <div className="flex items-end">
            <Button variant="ghost" onClick={() => registrations.reload()}>Refresh</Button>
          </div>
        </div>
        <Table
          columns={[
            { key: "id", label: "Reg ID" },
            { key: "drive_id", label: "Drive" },
            { key: "candidate_name", label: "Name" },
            { key: "candidate_email", label: "Email" },
            { key: "manager_email", label: "Manager" },
            { key: "status", label: "Status" },
            {
              key: "eval",
              label: "",
              render: (r) => canEvaluate ? (
                <div className="flex gap-2">
                  <Button className="!py-1 !text-xs" variant="ghost" onClick={() => setEvalRegId(String(r.id))}>Use ID</Button>
                  <Button
                    className="!py-1 !text-xs"
                    variant="ghost"
                    onClick={() => {
                      setApprovalOpen(r);
                      setApprovalForm({ level: 1, approver_email: r.manager_email || "" });
                    }}
                  >
                    Request Approval
                  </Button>
                </div>
              ) : <span className="text-xs text-slate-500">View only</span>,
            },
          ]}
          rows={registrations.data || []}
          emptyMessage="No registrations to evaluate. Applications must be submitted before eligibility can run."
        />
      </Card>

      <Card title="Approvals inbox">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs text-slate-500">Status</label>
            <select className={inputClass} value={approvalsFilter.status} onChange={(e) => setApprovalsFilter({ ...approvalsFilter, status: e.target.value })}>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Drive ID</label>
            <input className={inputClass} value={approvalsFilter.drive_id} onChange={(e) => setApprovalsFilter({ ...approvalsFilter, drive_id: e.target.value })} />
          </div>
          <div className="flex items-end">
            <Button variant="ghost" onClick={() => approvals.reload()}>
              Refresh
            </Button>
          </div>
        </div>
        <Table
          columns={[
            { key: "id", label: "ID" },
            { key: "registration_id", label: "Reg" },
            { key: "drive_id", label: "Drive" },
            { key: "level", label: "Lvl" },
            { key: "status", label: "Status" },
            { key: "approver_email", label: "Approver" },
            {
              key: "a",
              label: "",
              render: (r) =>
                r.status === "pending" && canDecide ? (
                  <Button
                    variant="ghost"
                    className="!py-1 !text-xs"
                    onClick={() => {
                      setDecide(r);
                      setDecision({ status: "approved", decision_notes: "" });
                    }}
                  >
                    Decide
                  </Button>
                ) : (
                  <span className="text-xs text-slate-500">—</span>
                ),
            },
          ]}
          rows={approvals.data || []}
          emptyMessage="No approval requests for this filter. Evaluate a registration or request approval from the registrations table."
        />
      </Card>

      <Modal
        open={!!decide}
        title={`Decide approval #${decide?.id}`}
        onClose={() => setDecide(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDecide(null)}>
              Cancel
            </Button>
            <Button type="submit" form="decide-form" loading={busy}>
              Save
            </Button>
          </>
        }
      >
        <form id="decide-form" onSubmit={decideNow} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Decision</label>
            <select className={inputClass} value={decision.status} onChange={(e) => setDecision({ ...decision, status: e.target.value })}>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Notes</label>
            <textarea className={`${inputClass} min-h-[90px]`} value={decision.decision_notes} onChange={(e) => setDecision({ ...decision, decision_notes: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal
        open={!!approvalOpen}
        title={`Create approval for registration #${approvalOpen?.id}`}
        onClose={() => setApprovalOpen(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setApprovalOpen(null)}>Cancel</Button>
            <Button type="submit" form="approval-create" loading={busy}>Create</Button>
          </>
        }
      >
        <form id="approval-create" onSubmit={createApproval} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Approval level</label>
            <select className={inputClass} value={approvalForm.level} onChange={(e) => setApprovalForm({ ...approvalForm, level: Number(e.target.value) })}>
              <option value={1}>Level 1</option>
              <option value={2}>Level 2</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Approver email</label>
            <input className={inputClass} type="email" value={approvalForm.approver_email} onChange={(e) => setApprovalForm({ ...approvalForm, approver_email: e.target.value })} required />
          </div>
        </form>
      </Modal>
    </div>
  );
}
