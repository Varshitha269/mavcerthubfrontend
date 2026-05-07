import React, { useMemo, useState } from "react";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { tasksApi } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { CardSkeleton } from "../components/Skeleton.jsx";

const STATUS = ["todo", "doing", "done", "blocked"];
const statusLabel = { todo: "Pending", doing: "In Progress", done: "Completed", blocked: "Blocked" };
const priorityLabel = { 1: "High", 2: "High", 3: "Medium", 4: "Low", 5: "Low" };

function categoryFor(title = "") {
  const text = title.toLowerCase();
  if (text.includes("upload") || text.includes("document")) return "Documentation";
  if (text.includes("approval") || text.includes("review")) return "Approval";
  if (text.includes("assessment") || text.includes("prerequisite")) return "Assessment";
  return "Training";
}

function dueText(dueDate) {
  if (!dueDate) return "No due date";
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return dueDate;
  const days = Math.ceil((due - new Date()) / 86400000);
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Due today";
  return `${days} days left`;
}

export function TasksPage() {
  const toast = useToast();
  const tasks = useAsyncData(() => tasksApi.my().then((r) => r.data), []);
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);

  const rows = tasks.data || [];
  const filtered = useMemo(() => (filter === "all" ? rows : rows.filter((t) => t.status === filter)), [rows, filter]);
  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((t) => t.status === "todo").length,
    doing: rows.filter((t) => t.status === "doing").length,
    done: rows.filter((t) => t.status === "done").length,
  }), [rows]);

  async function updateStatus(task, status) {
    setBusyId(task.id);
    try {
      await tasksApi.patch(task.id, { status });
      toast.success("Task updated.");
      tasks.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to update task");
    } finally {
      setBusyId(null);
    }
  }

  if (tasks.loading && !tasks.data) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">Tasks</h2>
        <p className="text-slate-400">Complete certification requirements to unlock progress, reviews, and vouchers.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total", stats.total],
          ["Pending", stats.pending],
          ["In Progress", stats.doing],
          ["Completed", stats.done],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
            <div className="mt-2 font-display text-3xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", ...STATUS].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-2 text-sm transition ${filter === s ? "bg-indigo-500/20 text-white ring-1 ring-indigo-400/30" : "bg-white/[0.03] text-slate-400 hover:text-white"}`}
          >
            {s === "all" ? "All" : statusLabel[s]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.length === 0 ? (
          <Card><p className="text-sm text-slate-400">No tasks match this filter.</p></Card>
        ) : (
          filtered.map((task) => (
            <Card key={task.id} className="!p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-slate-300">{categoryFor(task.title)}</span>
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">{priorityLabel[task.priority] || "Medium"} Priority</span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-white">{task.title}</h3>
                  {task.description && <p className="mt-1 text-sm text-slate-400">{task.description}</p>}
                </div>
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300">
                  {statusLabel[task.status] || task.status}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <div className={`text-sm ${dueText(task.due_date).includes("overdue") ? "text-rose-300" : "text-slate-400"}`}>
                  {dueText(task.due_date)}
                </div>
                <div className="flex flex-wrap gap-2">
                  {task.status !== "doing" && task.status !== "done" && (
                    <Button variant="ghost" className="!py-1.5 !text-xs" loading={busyId === task.id} onClick={() => updateStatus(task, "doing")}>
                      Start
                    </Button>
                  )}
                  {task.status !== "done" && (
                    <Button className="!py-1.5 !text-xs" loading={busyId === task.id} onClick={() => updateStatus(task, "done")}>
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
