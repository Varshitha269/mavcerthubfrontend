import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { notificationsApi } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { CardSkeleton } from "../components/Skeleton.jsx";
import { FormattedMessage } from "../components/FormattedMessage.jsx";

function bucketFor(n) {
  if (n.type === "system" && n.audience) return "Info";
  const text = `${n.title} ${n.message}`.toLowerCase();
  if (text.includes("approved") || text.includes("success") || text.includes("completed")) return "Success";
  if (text.includes("pending") || text.includes("review") || text.includes("deadline")) return "Pending";
  if (text.includes("reject") || text.includes("failed") || text.includes("error")) return "Action Required";
  return "Info";
}

export function NotificationsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [active, setActive] = useState("All");
  const { data, loading, reload } = useAsyncData(() => notificationsApi.my().then((r) => r.data), []);

  const grouped = useMemo(() => {
    const groups = { All: data || [], Unread: [], Read: [], Success: [], Pending: [], Info: [], "Action Required": [] };
    (data || []).forEach((n) => groups[bucketFor(n)].push(n));
    (data || []).forEach((n) => groups[n.read_at ? "Read" : "Unread"].push(n));
    return groups;
  }, [data]);

  async function markRead(id) {
    try {
      await notificationsApi.markRead(id);
      reload();
    } catch {
      toast.error("Failed to mark as read");
    }
  }

  async function remove(id) {
    try {
      await notificationsApi.remove(id);
      reload();
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead();
      toast.success("All notifications marked as read");
      reload();
    } catch {
      toast.error("Failed to mark all read");
    }
  }

  async function openNotification(n) {
    if (!n.link_url) return;
    if (!n.read_at) {
      try {
        await notificationsApi.markRead(n.id);
      } catch {
        // Navigation is still useful even if the read state update fails.
      }
    }
    if (n.link_url.startsWith("http://") || n.link_url.startsWith("https://")) {
      window.location.href = n.link_url;
      return;
    }
    navigate(n.link_url);
  }

  if (loading && !data) return <CardSkeleton />;
  const unread = (data || []).filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Notifications</h2>
          <p className="text-slate-400">Grouped by success, pending, info, and action-required updates.</p>
        </div>
        <Button variant="ghost" disabled={!unread} onClick={markAllRead}>{unread} Unread · Mark All Read</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.keys(grouped).map((name) => (
          <button key={name} type="button" onClick={() => setActive(name)} className={`rounded-lg px-3 py-2 text-sm transition ${active === name ? "bg-indigo-500/20 text-white ring-1 ring-indigo-400/30" : "bg-white/[0.03] text-slate-400 hover:text-white"}`}>
            {name} ({grouped[name].length})
          </button>
        ))}
      </div>

      <Card title={active}>
        <div className="space-y-3">
          {grouped[active].length === 0 ? (
            <p className="text-sm text-slate-400">No notifications in this group.</p>
          ) : (
            grouped[active].map((n) => (
              <div
                key={n.id}
                role={n.link_url ? "button" : undefined}
                tabIndex={n.link_url ? 0 : undefined}
                onClick={() => openNotification(n)}
                onKeyDown={(e) => {
                  if (n.link_url && (e.key === "Enter" || e.key === " ")) openNotification(n);
                }}
                className={`rounded-xl border p-4 ${n.link_url ? "cursor-pointer hover:border-cyan-400/30 hover:bg-cyan-500/5" : ""} ${n.read_at ? "border-white/5 bg-white/[0.02]" : "border-indigo-400/20 bg-indigo-500/5"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {n.icon && <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs text-cyan-200">{n.icon}</span>}
                      <h3 className="font-medium text-white">{n.title}</h3>
                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-slate-300">{bucketFor(n)}</span>
                      {n.priority && <span className={`rounded-full px-2 py-0.5 text-xs ${n.priority === "high" ? "bg-rose-500/15 text-rose-200" : n.priority === "low" ? "bg-slate-500/15 text-slate-200" : "bg-amber-500/15 text-amber-200"}`}>{n.priority}</span>}
                    </div>
                    {n.image_url && <img src={n.image_url} alt="" className="mt-3 max-h-44 rounded-xl object-cover" />}
                    <FormattedMessage message={n.message} format={n.content_format} className="mt-3 text-sm leading-6 text-slate-400" />
                    {n.expires_at && <p className="mt-1 text-xs text-slate-500">Expires {new Date(n.expires_at).toLocaleString()}</p>}
                    <p className="mt-2 text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {!n.read_at && <Button className="!py-1.5 !text-xs" onClick={(e) => { e.stopPropagation(); markRead(n.id); }}>Read</Button>}
                    <Button variant="ghost" className="!py-1.5 !text-xs" onClick={(e) => { e.stopPropagation(); remove(n.id); }}>Delete</Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
