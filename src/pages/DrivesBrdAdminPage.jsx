import React, { useMemo, useState } from "react";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { certificationsApi, drivesBrdApi } from "../services/api.js";
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
  const certs = useAsyncData(() => (isAdmin ? certificationsApi.list().then((r) => r.data) : Promise.resolve([])), [isAdmin]);

  const [edit, setEdit] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [certSearch, setCertSearch] = useState("");
  const [certPickerOpen, setCertPickerOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    certification_id: "",
    name: "",
    start_date: "",
    end_date: "",
    voucher_budget: "",
    target_count: "",
    sponsor: "",
    owner_email: "",
    status: "open",
  });
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
  const [busyAction, setBusyAction] = useState(null);
  const [driveFilter, setDriveFilter] = useState("all");

  const inputClass =
    "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50";
  const todayDate = new Date().toISOString().slice(0, 10);

  async function save(e) {
    e.preventDefault();
    if (!edit) return;
    setBusy(true);
    setBusyAction("save-drive");
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
      setBusyAction(null);
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
  const completedDrives = useMemo(
    () =>
      [...(drives.data || [])]
        .filter((drive) => drive.status === "completed" || drive.status === "closed" || drive.last_conducted_date)
        .sort((a, b) => String(b.end_date || b.last_conducted_date || "").localeCompare(String(a.end_date || a.last_conducted_date || ""))),
    [drives.data]
  );
  const filteredDriveRows = useMemo(() => {
    const rows = drives.data || [];
    if (driveFilter === "all") return rows;
    if (driveFilter === "pending") return rows.filter((drive) => ["planned", "pending"].includes(drive.status));
    if (driveFilter === "completed") return rows.filter((drive) => drive.status === "completed" || drive.status === "closed" || drive.last_conducted_date);
    return rows.filter((drive) => drive.status === driveFilter);
  }, [driveFilter, drives.data]);
  const focusDrives = useMemo(() => {
    const rows = [...(drives.data || [])];
    return rows
      .sort((a, b) => {
        const aScore = (a.status === "open" ? 3 : 0) + (a.can_reconduct ? 2 : 0) + (a.registrations_count || 0);
        const bScore = (b.status === "open" ? 3 : 0) + (b.can_reconduct ? 2 : 0) + (b.registrations_count || 0);
        return (bScore - aScore) || ((b.id || 0) - (a.id || 0));
      })
      .slice(0, 6);
  }, [drives.data]);
  const filteredCerts = useMemo(() => {
    const term = certSearch.trim().toLowerCase();
    const rows = certs.data || [];
    if (!term) return rows.slice(0, 12);
    return rows
      .filter((cert) => `${cert.title} ${cert.provider} ${cert.category || ""} ${cert.tags || ""}`.toLowerCase().includes(term))
      .slice(0, 20);
  }, [certSearch, certs.data]);
  const selectedCert = useMemo(
    () => (certs.data || []).find((cert) => String(cert.id) === String(createForm.certification_id)),
    [certs.data, createForm.certification_id]
  );

  async function provisionRepo() {
    if (!edit) return;
    setBusy(true);
    setBusyAction(`provision-${edit.id}`);
    try {
      await drivesBrdApi.provisionRepo(edit.id);
      toast.success("Repository provisioned.");
      drives.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }

  async function createMissingDrives() {
    setBusy(true);
    setBusyAction("ensure-defaults");
    try {
      const { data } = await drivesBrdApi.ensureDefaults();
      toast.success(`Created ${data.created} missing drive${data.created === 1 ? "" : "s"}.`);
      drives.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to create drives");
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }

  async function seedCurrentDrives() {
    setBusy(true);
    setBusyAction("seed-current");
    try {
      const { data } = await drivesBrdApi.seedCurrent();
      toast.success(`Current drives ready. Created ${data.created}, notified ${data.notified} users.`);
      drives.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to create current drives");
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }

  async function seedCompletedDrives() {
    setBusy(true);
    setBusyAction("seed-completed");
    try {
      const { data } = await drivesBrdApi.seedCompleted();
      toast.success(`Completed drives ready: ${data.ready || data.created || 0}. Newly created: ${data.created}.`);
      drives.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to create completed drives");
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }

  async function submitCreate(e) {
    e.preventDefault();
    if (!createForm.certification_id) {
      toast.error("Select a certification first.");
      return;
    }
    setBusy(true);
    setBusyAction("create-drive");
    try {
      await drivesBrdApi.create({
        certification_id: Number(createForm.certification_id),
        name: createForm.name,
        start_date: createForm.start_date || null,
        end_date: createForm.end_date || null,
        voucher_budget: createForm.voucher_budget === "" ? null : Number(createForm.voucher_budget),
        target_count: createForm.target_count === "" ? null : Number(createForm.target_count),
        sponsor: createForm.sponsor || null,
        owner_email: createForm.owner_email || null,
        status: createForm.status || "open",
      });
      toast.success("Drive created. Users, owner, and admin were notified; emails are queued when email settings are configured.");
      setCreateOpen(false);
      setCertSearch("");
      setCertPickerOpen(false);
      setCreateForm({ certification_id: "", name: "", start_date: "", end_date: "", voucher_budget: "", target_count: "", sponsor: "", owner_email: "", status: "open" });
      drives.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to create drive");
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }

  async function reconductDrive(row) {
    setBusy(true);
    setBusyAction(`reconduct-${row.id}`);
    try {
      await drivesBrdApi.reconduct(row.id);
      toast.success("Re-conduct drive created.");
      drives.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to create re-conduct drive");
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }

  async function updateStatus(row, status) {
    setBusy(true);
    setBusyAction(`status-${row.id}`);
    try {
      await drivesBrdApi.adminPatch(row.id, { status });
      toast.success(`Drive marked ${status}.`);
      drives.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to update status");
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Drive management (BRD)</h2>
          <p className="text-slate-400">All ongoing, planned, closed, and completed certification drives load here automatically.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={seedCurrentDrives} loading={busyAction === "seed-current"}>Add AWS/Azure/DevOps Drives</Button>
          <Button variant="ghost" onClick={seedCompletedDrives} loading={busyAction === "seed-completed"}>Add Completed Drives</Button>
          <Button variant="ghost" onClick={createMissingDrives} loading={busyAction === "ensure-defaults"}>Create Missing Drives</Button>
          <Button onClick={() => { setCreateOpen(true); setCertPickerOpen(false); }}>New Drive</Button>
        </div>
      </div>

      <Card title="All drives" subtitle="Every certification drive in the system, including ongoing and completed drives">
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            ["all", `All (${drives.data?.length || 0})`],
            ["pending", "Pending"],
            ["open", "Open"],
            ["completed", "Completed"],
            ["closed", "Closed"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setDriveFilter(key)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${driveFilter === key ? "bg-indigo-500/20 text-white ring-1 ring-indigo-400/30" : "bg-white/[0.03] text-slate-400 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {drives.error && <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{drives.error}</div>}
        {drives.loading && !drives.data ? (
          <p className="text-sm text-slate-400">Loading drives...</p>
        ) : (
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
              key: "a",
              label: "Actions",
              render: (row) => (
                <div className="flex flex-nowrap gap-1.5">
                  <Button
                    variant="ghost"
                    className="!rounded-lg !px-2.5 !py-1 !text-xs"
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
                    <Button variant="ghost" className="!rounded-lg !px-2.5 !py-1 !text-xs" onClick={() => updateStatus(row, "closed")} loading={busyAction === `status-${row.id}`}>
                      Close
                    </Button>
                  ) : (
                    <Button variant="ghost" className="!rounded-lg !px-2.5 !py-1 !text-xs" onClick={() => updateStatus(row, "open")} loading={busyAction === `status-${row.id}`}>
                      Reopen
                    </Button>
                  )}
                  <Button variant="ghost" className="!rounded-lg !px-2.5 !py-1 !text-xs" onClick={() => reconductDrive(row)} loading={busyAction === `reconduct-${row.id}`}>
                    Re-Conduct
                  </Button>
                </div>
              ),
            },
            ]}
            rows={filteredDriveRows}
            maxHeight="520px"
          />
        )}
      </Card>

      <Card title="Already completed drives" subtitle="Historical sample drives for demos and completed-drive reporting">
        {completedDrives.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
            No completed drives yet. Click Add Completed Drives to create sample completed AWS, Azure, Docker, ServiceNow, and Python drives.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="hidden">
            {completedDrives.map((drive) => (
              <div key={drive.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{drive.certification_title || drive.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">Drive #{drive.id} · {drive.certification_provider || drive.sponsor || "Provider"}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-200">
                    done
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  {drive.start_date || "Start not set"} to {drive.end_date || drive.last_conducted_date || "End not set"}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-white/[0.04] p-2">
                    <div className="text-xs text-slate-500">Regs</div>
                    <div className="font-bold text-white">{drive.registrations_count || 0}</div>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-2">
                    <div className="text-xs text-slate-500">Pass</div>
                    <div className="font-bold text-white">{drive.passed_count || 0}</div>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-2">
                    <div className="text-xs text-slate-500">Budget</div>
                    <div className="font-bold text-white">{drive.voucher_budget || 0}</div>
                  </div>
                </div>
              </div>
            ))}
            </div>
            <Table
              searchPlaceholder="Search completed drives..."
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
                { key: "start_date", label: "Start" },
                { key: "end_date", label: "End" },
                { key: "status", label: "Status" },
                { key: "registrations_count", label: "Registrations" },
                { key: "passed_count", label: "Passed" },
                {
                  key: "recent_attendees",
                  label: "Attendees",
                  render: (row) => (row.recent_attendees || []).length ? (
                    <div className="space-y-1">
                      {(row.recent_attendees || []).slice(0, 3).map((item) => (
                        <div key={item.registration_id} className="text-xs text-slate-300">
                          {item.name} <span className="text-slate-500">({item.outcome || item.status})</span>
                        </div>
                      ))}
                    </div>
                  ) : <span className="text-slate-500">-</span>,
                },
                { key: "voucher_budget", label: "Budget" },
                { key: "owner_email", label: "Owner" },
              ]}
              rows={completedDrives}
              maxHeight="520px"
            />
          </div>
        )}
      </Card>

      <Card
        title="Focus drives"
        subtitle="A short operational list. Re-conduct creates a fresh drive using the same certification, rules, owner, and budget."
      >
        {focusDrives.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
            No drives are available yet. Create missing drives after adding certifications.
          </div>
        ) : (
          <>
            <Table
              searchPlaceholder="Search focus drives..."
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
                { key: "start_date", label: "Start" },
                { key: "end_date", label: "End" },
                {
                  key: "status",
                  label: "Status",
                  render: (row) => (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.status === "open" ? "bg-emerald-500/15 text-emerald-200" : "bg-slate-500/15 text-slate-200"}`}>
                      {row.status}
                    </span>
                  ),
                },
                {
                  key: "registrations_count",
                  label: "Registrations",
                  render: (row) => `${row.registrations_count || 0}/${row.target_count || "target"}`,
                },
                { key: "passed_count", label: "Passed" },
                { key: "voucher_budget", label: "Budget" },
                { key: "owner_email", label: "Owner" },
                { key: "next_action", label: "Next Action" },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => (
                    <div className="flex flex-nowrap gap-1.5">
                      {row.status === "open" ? (
                        <Button variant="ghost" className="!rounded-lg !px-2.5 !py-1 !text-xs" onClick={() => updateStatus(row, "closed")} loading={busyAction === `status-${row.id}`}>Close</Button>
                      ) : (
                        <Button variant="ghost" className="!rounded-lg !px-2.5 !py-1 !text-xs" onClick={() => updateStatus(row, "open")} loading={busyAction === `status-${row.id}`}>Reopen</Button>
                      )}
                      <Button variant="ghost" className="!rounded-lg !px-2.5 !py-1 !text-xs" onClick={() => reconductDrive(row)} loading={busyAction === `reconduct-${row.id}`}>Re-Conduct</Button>
                      <Button
                        variant="ghost"
                        className="!rounded-lg !px-2.5 !py-1 !text-xs"
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
                    </div>
                  ),
                },
              ]}
              rows={focusDrives}
              maxHeight="420px"
            />
          </>
        )}
      </Card>
      {false && (
      <Card>
          <div className="hidden">
            {focusDrives.map((drive) => (
              <div key={drive.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">{drive.certification_title || drive.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{drive.certification_provider || drive.sponsor || "Provider not set"} · Drive #{drive.id}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${drive.status === "open" ? "bg-emerald-500/15 text-emerald-200" : "bg-slate-500/15 text-slate-200"}`}>
                    {drive.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-white/[0.04] p-2">
                    <div className="text-xs text-slate-500">Regs</div>
                    <div className="font-bold text-white">{drive.registrations_count || 0}</div>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-2">
                    <div className="text-xs text-slate-500">Passed</div>
                    <div className="font-bold text-white">{drive.passed_count || 0}</div>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-2">
                    <div className="text-xs text-slate-500">Budget</div>
                    <div className="font-bold text-white">{drive.voucher_budget || 0}</div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-400">{drive.next_action || "Review drive"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {drive.status === "open" ? (
                    <Button variant="ghost" className="!py-1.5 !text-xs" onClick={() => updateStatus(drive, "closed")} loading={busyAction === `status-${drive.id}`}>Close</Button>
                  ) : (
                    <Button variant="ghost" className="!py-1.5 !text-xs" onClick={() => updateStatus(drive, "open")} loading={busyAction === `status-${drive.id}`}>Reopen</Button>
                  )}
                  <Button className="!py-1.5 !text-xs" onClick={() => reconductDrive(drive)} loading={busyAction === `reconduct-${drive.id}`}>Re-Conduct</Button>
                  <Button
                    variant="ghost"
                    className="!py-1.5 !text-xs"
                    onClick={() => {
                      setEdit(drive);
                      setForm({
                        name: drive.name || "",
                        start_date: drive.start_date || "",
                        end_date: drive.end_date || "",
                        eligibility_rules: drive.eligibility_rules || "",
                        voucher_budget: drive.voucher_budget ?? "",
                        sponsor: drive.sponsor || "",
                        owner_email: drive.owner_email || "",
                        policy_url: drive.policy_url || "",
                        target_count: drive.target_count ?? "",
                        status: drive.status || "open",
                        repository_prefix: drive.repository_prefix || "",
                      });
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
      </Card>
      )}
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
          <div className="max-h-[360px] space-y-3 overflow-auto pr-1">
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
          <div className="max-h-[360px] space-y-3 overflow-auto pr-1">
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

      <Modal
        open={createOpen}
        title="Create drive"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" form="drive-create" loading={busyAction === "create-drive"}>Create & Notify Users</Button>
          </>
        }
      >
        <form id="drive-create" onSubmit={submitCreate} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Certification</label>
            <input
              className={inputClass}
              value={certSearch}
              onFocus={() => setCertPickerOpen(true)}
              onChange={(e) => {
                setCertSearch(e.target.value);
                setCertPickerOpen(true);
              }}
              placeholder="Search AWS, Azure, DevOps, Python..."
            />
            {certs.loading && <p className="mt-2 text-xs text-slate-500">Loading certifications...</p>}
            {certs.error && <p className="mt-2 text-xs text-rose-300">{certs.error}</p>}
            {certPickerOpen && (
              <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-white/10 bg-white/[0.03]">
                {filteredCerts.length === 0 ? (
                  <div className="p-3 text-sm text-slate-400">No certifications found. Try a different search.</div>
                ) : (
                  filteredCerts.map((cert) => (
                    <button
                      key={cert.id}
                      type="button"
                      onClick={() => {
                        setCreateForm({
                          ...createForm,
                          certification_id: String(cert.id),
                          name: `${cert.title} - Current Drive`,
                          sponsor: cert.provider || createForm.sponsor,
                        });
                        setCertSearch(`${cert.title} (${cert.provider})`);
                        setCertPickerOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-white/[0.06] ${
                        String(createForm.certification_id) === String(cert.id) ? "bg-indigo-500/20 text-white" : "text-slate-300"
                      }`}
                    >
                      <span className="font-semibold">{cert.title}</span>
                      <span className="ml-2 text-xs text-slate-500">{cert.provider}</span>
                    </button>
                  ))
                )}
              </div>
            )}
            {selectedCert ? (
              <p className="mt-2 text-xs text-emerald-300">Selected: {selectedCert.title} ({selectedCert.provider})</p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Select a certification from the list to create the drive.</p>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-500">Drive name</label>
            <input className={inputClass} value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Start date</label>
              <input
                className={inputClass}
                type="date"
                min={todayDate}
                value={createForm.start_date}
                onChange={(e) => {
                  const startDate = e.target.value;
                  setCreateForm({
                    ...createForm,
                    start_date: startDate,
                    end_date: createForm.end_date && createForm.end_date < startDate ? startDate : createForm.end_date,
                  });
                }}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">End date</label>
              <input className={inputClass} type="date" min={createForm.start_date || todayDate} value={createForm.end_date} onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Voucher budget</label>
              <input className={inputClass} type="number" value={createForm.voucher_budget} onChange={(e) => setCreateForm({ ...createForm, voucher_budget: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Target seats</label>
              <input className={inputClass} type="number" value={createForm.target_count} onChange={(e) => setCreateForm({ ...createForm, target_count: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Sponsor</label>
            <input className={inputClass} value={createForm.sponsor} onChange={(e) => setCreateForm({ ...createForm, sponsor: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Owner email</label>
            <input className={inputClass} value={createForm.owner_email} onChange={(e) => setCreateForm({ ...createForm, owner_email: e.target.value })} />
          </div>
          <p className="text-xs text-slate-500">Creating a drive sends notifications to active learners, registered owners, and admins. Emails are queued when ACS email settings are configured.</p>
        </form>
      </Modal>

      <Modal
        open={!!edit}
        title={`Edit drive #${edit?.id}`}
        onClose={() => setEdit(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button variant="ghost" onClick={provisionRepo} loading={busyAction === `provision-${edit?.id}`}>
              Provision repo
            </Button>
            <Button type="submit" form="drive-edit" loading={busyAction === "save-drive"}>
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
              <input className={inputClass} type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">End date</label>
              <input className={inputClass} type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
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

