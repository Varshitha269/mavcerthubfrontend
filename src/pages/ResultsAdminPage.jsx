import React, { useMemo, useState } from "react";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { resultsAdminApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Modal } from "../components/Modal.jsx";
import { Table } from "../components/Table.jsx";

export function ResultsAdminPage() {
  const { user, isPrivileged } = useAuth();
  const canCoordinate = user?.role === "coordinator" || user?.role === "admin";
  const toast = useToast();

  const [filters, setFilters] = useState({ drive_id: "", registration_id: "" });
  const list = useAsyncData(
    () =>
      isPrivileged
        ? resultsAdminApi
            .list({
              drive_id: filters.drive_id ? Number(filters.drive_id) : undefined,
              registration_id: filters.registration_id ? Number(filters.registration_id) : undefined,
            })
            .then((r) => r.data)
        : Promise.resolve([]),
    [isPrivileged, filters.drive_id, filters.registration_id]
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [create, setCreate] = useState({ registration_id: "", score: "", outcome: "pending", assessed_on: "", evidence_url: "", notes: "" });
  const [importOpen, setImportOpen] = useState(false);
  const [csv, setCsv] = useState("registration_id,score,outcome,assessed_on\n");
  const [busy, setBusy] = useState(false);
  const resultStats = useMemo(() => {
    const rows = list.data || [];
    return {
      total: rows.length,
      pass: rows.filter((r) => r.outcome === "pass").length,
      fail: rows.filter((r) => r.outcome === "fail").length,
      pending: rows.filter((r) => r.outcome === "pending").length,
    };
  }, [list.data]);

  const inputClass =
    "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50";

  async function createResult(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await resultsAdminApi.create({
        registration_id: Number(create.registration_id),
        score: create.score === "" ? null : Number(create.score),
        outcome: create.outcome,
        assessed_on: create.assessed_on || null,
        evidence_url: create.evidence_url || null,
        notes: create.notes || null,
      });
      toast.success("Result created.");
      setCreateOpen(false);
      list.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function importCsv(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await resultsAdminApi.importCsv(csv);
      toast.success(`Imported: ${data.created}, skipped: ${data.skipped}`);
      setImportOpen(false);
      list.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv() {
    setBusy(true);
    try {
      const { data } = await resultsAdminApi.exportCsv({
        drive_id: filters.drive_id ? Number(filters.drive_id) : undefined,
        registration_id: filters.registration_id ? Number(filters.registration_id) : undefined,
      });
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `assessment-results-${filters.registration_id || filters.drive_id || "all"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Assessment export downloaded.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">{canCoordinate ? "Coordinator Assessment Results" : "Assessment Results View"}</h2>
          <p className="text-slate-400">{canCoordinate ? "Import CSVs or create result records after drives are conducted." : "View assessment outcomes across drives without import controls."}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={exportCsv} loading={busy}>
            Export CSV
          </Button>
          {canCoordinate && <Button variant="ghost" onClick={() => setImportOpen(true)}>
            Import CSV
          </Button>}
          {canCoordinate && <Button onClick={() => setCreateOpen(true)}>New result</Button>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Results", resultStats.total],
          ["Passed", resultStats.pass],
          ["Failed", resultStats.fail],
          ["Pending", resultStats.pending],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
            <div className="mt-2 font-display text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <Card title="How to use results" subtitle="Why this page may be empty">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Before assessment", "Applications and eligibility can exist without results. This page stays empty until the drive is actually assessed."],
            ["After assessment", "Create one result per Registration ID, or import a CSV with registration_id, score, outcome, and assessed_on."],
            ["What it changes", "A pass/fail/no-show updates the registration status and feeds drive metrics."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="font-semibold text-white">{title}</div>
              <p className="mt-2 text-sm leading-5 text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Filters">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs text-slate-500">Drive ID</label>
            <input className={inputClass} value={filters.drive_id} onChange={(e) => setFilters({ ...filters, drive_id: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Registration ID</label>
            <input
              className={inputClass}
              value={filters.registration_id}
              onChange={(e) => setFilters({ ...filters, registration_id: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button variant="ghost" onClick={() => list.reload()}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Results">
        <Table
          maxHeight="52vh"
          columns={[
            { key: "id", label: "ID" },
            { key: "registration_id", label: "Reg" },
            { key: "drive_id", label: "Drive" },
            { key: "outcome", label: "Outcome" },
            { key: "score", label: "Score" },
            { key: "assessed_on", label: "Assessed" },
          ]}
          rows={list.data || []}
          emptyMessage="No assessment results yet. Import results after a drive is conducted, or create a result for a registration ID."
        />
      </Card>

      <Modal
        open={createOpen}
        title="Create result"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="res-create" loading={busy}>
              Create
            </Button>
          </>
        }
      >
        <form id="res-create" onSubmit={createResult} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Registration ID</label>
            <input className={inputClass} value={create.registration_id} onChange={(e) => setCreate({ ...create, registration_id: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Outcome</label>
              <select className={inputClass} value={create.outcome} onChange={(e) => setCreate({ ...create, outcome: e.target.value })}>
                <option value="pending">pending</option>
                <option value="pass">pass</option>
                <option value="fail">fail</option>
                <option value="no_show">no_show</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Score</label>
              <input className={inputClass} type="number" value={create.score} onChange={(e) => setCreate({ ...create, score: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Assessed on</label>
            <input className={inputClass} value={create.assessed_on} onChange={(e) => setCreate({ ...create, assessed_on: e.target.value })} placeholder="YYYY-MM-DD" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Evidence URL</label>
            <input className={inputClass} value={create.evidence_url} onChange={(e) => setCreate({ ...create, evidence_url: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Notes</label>
            <textarea className={`${inputClass} min-h-[90px]`} value={create.notes} onChange={(e) => setCreate({ ...create, notes: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal
        open={importOpen}
        title="Import results CSV"
        onClose={() => setImportOpen(false)}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="csv-import" loading={busy}>
              Import
            </Button>
          </>
        }
      >
        <form id="csv-import" onSubmit={importCsv} className="space-y-3">
          <p className="text-sm text-slate-400">Columns: registration_id, score, outcome(pass/fail/no_show/pending), assessed_on. Use the Export CSV button with a Registration ID filter to export one user's assessment data.</p>
          <textarea className={`${inputClass} min-h-[260px] font-mono text-xs`} value={csv} onChange={(e) => setCsv(e.target.value)} />
        </form>
      </Modal>
    </div>
  );
}

