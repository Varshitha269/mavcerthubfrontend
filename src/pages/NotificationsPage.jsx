import React from "react";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { notificationsApi } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { CardSkeleton } from "../components/Skeleton.jsx";

export function NotificationsPage() {
  const toast = useToast();
  const { data: notifications, loading, reload } = useAsyncData(() => notificationsApi.my().then((r) => r.data), []);

  async function markRead(id) {
    try {
      await notificationsApi.markRead(id);
      reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to mark as read");
    }
  }

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead();
      toast.success("All notifications marked as read");
      reload();
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  }

  async function deleteNotification(id) {
    try {
      await notificationsApi.remove(id);
      toast.success("Notification deleted");
      reload();
    } catch (err) {
      toast.error("Failed to delete");
    }
  }

  const unreadCount = (notifications || []).filter(n => !n.read_at).length;

  if (loading && !notifications) {
    return <CardSkeleton />;
  }

  // Helper to determine icon style based on notification content/title
  const getIconConfig = (title) => {
    const t = (title || "").toLowerCase();
    if (t.includes("approve") || t.includes("success") || t.includes("completed")) {
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-500",
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };
    }
    if (t.includes("task") || t.includes("deadline") || t.includes("overdue") || t.includes("alert")) {
      return {
        bg: "bg-orange-500/10",
        text: "text-orange-500",
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };
    }
    return {
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    };
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-white">Notifications</h2>
          <p className="text-slate-400 mt-1">Stay updated with your certification activities</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg text-sm font-semibold">
              {unreadCount} Unread
            </span>
          )}
          <button 
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="px-4 py-2 border border-slate-700 hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent transition-colors rounded-xl text-sm font-medium text-slate-300"
          >
            Mark All as Read
          </button>
        </div>
      </div>

      {/* ── Notifications List ── */}
      <div className="space-y-4">
        {(!notifications || notifications.length === 0) ? (
          <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
            <p className="text-slate-400">You have no notifications right now.</p>
          </div>
        ) : (
          notifications.map((n) => {
            const isUnread = !n.read_at;
            const style = getIconConfig(n.title);
            return (
              <div 
                key={n.id} 
                className={`flex flex-col sm:flex-row sm:items-start gap-4 p-5 rounded-2xl transition-all duration-300 ${isUnread ? 'bg-white/[0.05] border border-white/10 shadow-lg' : 'bg-white/[0.02] border border-transparent'}`}
              >
                {/* Left Icon */}
                <div className={`shrink-0 flex items-center justify-center w-12 h-12 rounded-xl ${style.bg} ${style.text}`}>
                  {style.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-base font-semibold truncate ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                      {n.title}
                    </h3>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                    )}
                  </div>
                  <p className={`mt-1 text-sm ${isUnread ? 'text-slate-300' : 'text-slate-500'}`}>
                    {n.message}
                  </p>
                  
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(n.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="shrink-0 flex items-center gap-2 sm:self-center mt-4 sm:mt-0">
                  {isUnread && (
                    <button 
                      onClick={() => markRead(n.id)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-full transition-colors"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button 
                    onClick={() => deleteNotification(n.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete notification"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
