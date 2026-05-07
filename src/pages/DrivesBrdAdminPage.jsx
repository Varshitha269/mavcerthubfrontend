import React, { useMemo, useState } from "react";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { drivesBrdApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Modal } from "../components/Modal.jsx";
import { Table } from "../components/Table.jsx";

export function DrivesBrdAdminPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const drives = useAsyncData(() => (isAdmin ? drivesBrdApi.adminList().then((r) => r.data) : Promise.resolve([])), [isAdmin]);

  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    eligibility_rules: "",
    voucher_budget: "",
    sponsor: "",
    owner_email: "",
    policy_url: "",
    target_count: "",
    status: "open",
    repository_prefix: "",
  });
  const [busy, setBusy] = useState(false);

  const inputClass =
    "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50";

  async function save(e) {
    e.preventDefault();
    if (!edit) return;
    setBusy(true);
    try {
      await drivesBrdApi.adminPatch(edit.id, {
        name: form.name || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        eligibility_rules: form.eligibility_rules || null,
        voucher_budget: form.voucher_budget === "" ? null : Number(form.voucher_budget),
        sponsor: form.sponsor || null,
        owner_email: form.owner_email || null,
        policy_url: form.policy_url || null,
        target_count: form.target_count === "" ? null : Number(form.target_count),
        status: form.status || null,
        repository_prefix: form.repository_prefix || null,
      });
      toast.success("Drive updated.");
      setEdit(null);
      drives.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  const driveStats = useMemo(() => {
    const rows = drives.data || [];
    const open = rows.filter((d) => d.status === "open").length;
    const conducted = rows.filter((d) => d.last_conducted_date).length;
    const reconduct = rows.filter((d) => d.can_reconduct).length;
    const budget = rows.reduce((sum, d) => sum + (Number(d.voucher_budget) || 0), 0);
    const target = rows.reduce((sum, d) => sum + (Number(d.target_count) || 0), 0);
    const registered = rows.reduce((sum, d) => sum + (Number(d.registrations_count) || 0), 0);
    const assessed = rows.reduce((sum, d) => sum + (Number(d.assessed_count) || 0), 0);
    return { total: rows.length, open, conducted, reconduct, budget, target, registered, assessed };
  }, [drives.data]);

  const providerGroups = useMemo(() => {
    const groups = {};
    (drives.data || []).forEach((drive) => {
      const provider = drive.certification_provider || drive.sponsor || "Other";
      groups[provider] = (groups[provider] || 0) + 1;
    });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  }, [drives.data]);

  const latestConducted = useMemo(
    () =>
      [...(drives.data || [])]
        .filter((drive) => drive.last_conducted_date)
        .sort((a, b) => String(b.last_conducted_date).localeCompare(String(a.last_conducted_date)))
        .slice(0, 5),
    [drives.data]
  );

  async function provisionRepo() {
    if (!edit) return;
    setBusy(true);
    try {
      await drivesBrdApi.provisionRepo(edit.id);
      toast.success("Repository provisioned.");
      drives.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function createMissingDrives() {
    setBusy(true);
    try {
      const { data } = await drivesBrdApi.ensureDefaults();
      toast.success(`Created ${data.created} missing drive${data.created === 1 ? "" : "s"}.`);
      drives.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to create drives");
    } finally {
      setBusy(false);
    }
  }

  async function reconductDrive(row) {
    setBusy(true);
    try {
      await drivesBrdApi.reconduct(row.id);
      toast.success("Re-conduct drive created.");
      drives.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to create re-conduct drive");
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(row, status) {
    setBusy(true);
    try {
      await drivesBrdApi.adminPatch(row.id, { status });
      toast.success(`Drive marked ${status}.`);
      drives.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to update status");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Drive management (BRD)</h2>
          <p className="text-slate-400">Plan certification drives, eligibility rules, voucher budgets, owners, dates, repositories, and targets.</p>
        </div>
        <Button onClick={createMissingDrives} loading={busy}>
          Create Missing Drives
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Drives", driveStats.total],
          ["Open Drives", driveStats.open],
          ["Conducted", driveStats.conducted],
          ["Can Re-Conduct", driveStats.reconduct],
          ["Voucher Budget", driveStats.budget],
          ["Target Seats", driveStats.target],
          ["Registrations", driveStats.registered],
          ["Assessments", driveStats.assessed],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
            <div className="mt-2 font-display text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card title="Drive catalog by provider" subtitle="All certification drives that can be conducted from this portal">
          <div className="space-y-3">
            {providerGroups.length === 0 ? (
              <p className="text-sm text-slate-400">No drives yet.</p>
            ) : (
              providerGroups.map(([provider, count]) => (
                <div key={provider} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <span className="font-semibold text-white">{provider}</span>
                  <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-200">{count} drive{count === 1 ? "" : "s"}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Last conducted drives" subtitle="Recent completed assessment activity by drive">
          <div className="space-y-3">
            {latestConducted.length === 0 ? (
              <p className="text-sm text-slate-400">No conducted drives yet. Once assessments are imported, this timeline will update.</p>
            ) : (
              latestConducted.map((drive) => (
                <div key={drive.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-white">{drive.certification_title || drive.name}</h3>
                    <span className="text-xs text-slate-500">{drive.last_conducted_date}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {drive.assessed_count} assessed · {drive.passed_count} passed · {drive.failed_count} failed
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card title="All drives" subtitle="Conduct, close, reopen, or create a re-conduct drive for any certification">
        <Table
          searchPlaceholder="Search by certification, provider, owner, status..."
          columns={[
            { key: "id", label: "ID" },
            {
              key: "certification_title",
              label: "Certification",
              render: (row) => (
                <div>
                  <div className="font-semibold text-white">{row.certification_title || row.name}</div>
                  <div className="text-xs text-slate-500">{row.certification_provider || row.sponsor || "Provider not set"}</div>
                </div>
              ),
            },
            { key: "certification_category", label: "Category" },
            { key: "start_date", label: "Start" },
            { key: "end_date", label: "End" },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  row.status === "open" ? "bg-emerald-500/15 text-emerald-200" : "bg-slate-500/15 text-slate-200"
                }`}>
                  {row.status}
                </span>
              ),
            },
            {
              key: "registrations_count",
              label: "Registrations",
              render: (row) => `${row.registrations_count || 0}/${row.target_count || "target"}`,
            },
            {
              key: "assessed_count",
              label: "Assessments",
              render: (row) => `${row.assessed_count || 0} done`,
            },
            { key: "last_conducted_date", label: "Last Conducted" },
            { key: "next_action", label: "Next Action" },
            { key: "voucher_budget", label: "Budget" },
            { key: "owner_email", label: "Owner" },
            {
              key: "repository_prefix",
              label: "Repo",
              render: (row) => row.repository_prefix ? <span className="text-xs text-slate-300">{row.repository_prefix}</span> : <span className="text-slate-500">-</span>,
            },
            {
              key: "policy_url",
              label: "Policy",
              render: (row) => row.policy_url ? <a className="text-cyan-300 hover:text-cyan-200" href={row.policy_url} target="_blank" rel="noreferrer">Open</a> : <span className="text-slate-500">-</span>,
            },
            {
              key: "a",
              label: "",
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    className="!py-1 !text-xs"
                    onClick={() => {
                      setEdit(row);
                      setForm({
                        name: row.name || "",
                        start_date: row.start_date || "",
                        end_date: row.end_date || "",
                        eligibility_rules: row.eligibility_rules || "",
                        voucher_budget: row.voucher_budget ?? "",
                        sponsor: row.sponsor || "",
                        owner_email: row.owner_email || "",
                        policy_url: row.policy_url || "",
                        target_count: row.target_count ?? "",
                        status: row.status || "open",
                        repository_prefix: row.repository_prefix || "",
                      });
                    }}
                  >
                    Edit
                  </Button>
                  {row.status === "open" ? (
                    <Button variant="ghost" className="!py-1 !text-xs" onClick={() => updateStatus(row, "closed")} loading={busy}>
                      Close
                    </Button>
                  ) : (
                    <Button variant="ghost" className="!py-1 !text-xs" onClick={() => updateStatus(row, "open")} loading={busy}>
                      Reopen
                    </Button>
                  )}
                  <Button variant="ghost" className="!py-1 !text-xs" onClick={() => reconductDrive(row)} loading={busy}>
                    Re-Conduct
                  </Button>
                </div>
              ),
            },
          ]}
          rows={drives.data || []}
        />
      </Card>

      <Modal
        open={!!edit}
        title={`Edit drive #${edit?.id}`}
        onClose={() => setEdit(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button variant="ghost" onClick={provisionRepo} loading={busy}>
              Provision repo
            </Button>
            <Button type="submit" form="drive-edit" loading={busy}>
              Save
            </Button>
          </>
        }
      >
        <form id="drive-edit" onSubmit={save} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Drive name</label>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Start date</label>
              <input className={inputClass} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} placeholder="YYYY-MM-DD" />
            </div>
            <div>
              <label className="text-xs text-slate-500">End date</label>
              <input className={inputClass} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} placeholder="YYYY-MM-DD" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Sponsor</label>
            <input className={inputClass} value={form.sponsor} onChange={(e) => setForm({ ...form, sponsor: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Owner email</label>
            <input className={inputClass} value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Policy URL</label>
            <input className={inputClass} value={form.policy_url} onChange={(e) => setForm({ ...form, policy_url: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Voucher budget</label>
              <input className={inputClass} type="number" value={form.voucher_budget} onChange={(e) => setForm({ ...form, voucher_budget: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Target count</label>
              <input className={inputClass} type="number" value={form.target_count} onChange={(e) => setForm({ ...form, target_count: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Status</label>
              <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="planned">planned</option>
                <option value="open">open</option>
                <option value="completed">completed</option>
                <option value="closed">closed</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Repository prefix</label>
              <input className={inputClass} value={form.repository_prefix} onChange={(e) => setForm({ ...form, repository_prefix: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Eligibility rules JSON</label>
            <textarea className={`${inputClass} min-h-[110px] font-mono text-xs`} value={form.eligibility_rules} onChange={(e) => setForm({ ...form, eligibility_rules: e.target.value })} placeholder='{"any":[{"field":"email_domain","op":"eq","value":"company.com"}]}' />
          </div>
          {!isAdmin && <p className="text-rose-300 text-sm">Admin only.</p>}
        </form>
      </Modal>
    </div>
  );
}

