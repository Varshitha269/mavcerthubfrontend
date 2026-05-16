import React, { useState } from "react";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { profileApi, uploadsApi } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { CardSkeleton } from "../components/Skeleton.jsx";

const inputClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20";

export function ProfilePage() {
  const toast = useToast();
  const { theme, setTheme: applyTheme } = useTheme();
  const { data, loading, error, reload } = useAsyncData(() => profileApi.get().then((r) => r.data), []);
  const { data: badgesData, loading: badgesLoading } = useAsyncData(() => profileApi.badges().then((r) => r.data), []);
  const { data: certsData, loading: certsLoading } = useAsyncData(() => uploadsApi.certificates().then((r) => r.data), []);
  const { data: driveHistory, loading: driveHistoryLoading } = useAsyncData(() => profileApi.driveHistory().then((r) => r.data), []);

  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (!data) return;
    setFullName(data.full_name || "");
    setEmail(data.email || "");
    if (data.preferences?.theme) {
      setSelectedTheme(data.preferences.theme);
      applyTheme(data.preferences.theme);
    }
  }, [data, applyTheme]);

  async function saveProfile(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await profileApi.patch({ full_name: fullName || null, email: email || undefined });
      toast.success("Profile updated.");
      reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await profileApi.changePassword({ current_password: curPw, new_password: newPw });
      toast.success("Password changed.");
      setCurPw("");
      setNewPw("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function savePrefs(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await profileApi.patchPreferences({ theme: selectedTheme });
      applyTheme(selectedTheme);
      toast.success("Preferences saved.");
      reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) return <CardSkeleton />;
  if (error) return <Card title="Profile"><p className="text-rose-300">{error}</p></Card>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">Profile & Security</h2>
        <p className="text-slate-400">Manage your account details and view your earned achievements.</p>
      </div>

      {/* Earned Badges Section */}
      <Card title="Earned Badges" subtitle="Your official certification achievements">
        {badgesLoading ? (
          <div className="flex gap-4">
             <div className="w-24 h-24 rounded-full bg-white/5 animate-pulse"></div>
             <div className="w-24 h-24 rounded-full bg-white/5 animate-pulse"></div>
          </div>
        ) : (!badgesData?.badges || badgesData.badges.length === 0) ? (
          <div className="text-center py-8 bg-white/[0.02] border border-white/5 border-dashed rounded-xl">
            <div className="mx-auto w-16 h-16 mb-3 rounded-full bg-slate-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">You haven't earned any badges yet.</p>
            <p className="text-slate-500 text-xs mt-1">Complete a certification to unlock your first badge!</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6">
            {badgesData.badges.map((badge) => (
              <div key={badge.id} className="group relative flex flex-col items-center p-4 bg-white/[0.03] rounded-2xl border border-white/10 hover:border-indigo-500/50 hover:bg-white/[0.05] transition-all w-40 text-center">
                <div className="w-20 h-20 mb-3 relative">
                   <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full group-hover:bg-indigo-500/40 transition-colors"></div>
                   <img src={badge.badge_url} alt={badge.title} className="w-full h-full object-contain relative z-10 filter drop-shadow-lg" />
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">{badge.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(badge.earned_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* My Certificates Section */}
      <Card title="My Certificates" subtitle="Your uploaded completion certificates">
        {certsLoading ? (
          <p className="text-slate-400 text-sm">Loading certificates...</p>
        ) : (!certsData || certsData.length === 0) ? (
          <div className="text-center py-8 bg-white/[0.02] border border-white/5 border-dashed rounded-xl">
            <p className="text-slate-400 text-sm">You haven't uploaded any certificates yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {certsData.map((cert) => (
              <div key={cert.id} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10 hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl">
                    📄
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{cert.certification?.title || "Unknown Certification"}</h4>
                    <p className="text-xs text-slate-400">Completed on: {new Date(cert.completed_date).toLocaleDateString()}</p>
                  </div>
                </div>
                {cert.certificate_files && cert.certificate_files.length > 0 && (
                  <a 
                    href={cert.certificate_files[0].download_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    View File &rarr;
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Drive Attendance & Results" subtitle="Certification drives you registered for, attended, or completed">
        {driveHistoryLoading ? (
          <p className="text-slate-400 text-sm">Loading drive history...</p>
        ) : (!driveHistory?.items || driveHistory.items.length === 0) ? (
          <div className="text-center py-8 bg-white/[0.02] border border-white/5 border-dashed rounded-xl">
            <p className="text-slate-400 text-sm">No drive attendance records yet.</p>
          </div>
        ) : (
          <div className="max-h-[430px] space-y-3 overflow-auto pr-1">
            {driveHistory.items.map((item) => (
              <div key={item.registration_id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{item.certification_title || item.drive_name}</h4>
                    <p className="mt-1 text-xs text-slate-400">Drive #{item.drive_id} - {item.drive_name}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.outcome === "pass" ? "bg-emerald-500/15 text-emerald-200" : item.outcome === "fail" ? "bg-rose-500/15 text-rose-200" : "bg-slate-500/15 text-slate-200"}`}>
                    {item.outcome || item.application_status}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
                  <span>Score: {item.score ?? "-"}</span>
                  <span>Assessed: {item.assessed_on || "-"}</span>
                  <span>Status: {item.application_status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Extended profile" subtitle="Backend returns preferences stub">
        <form onSubmit={saveProfile} className="grid max-w-xl gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Full name</label>
            <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Email</label>
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" loading={busy}>
              Save profile
            </Button>
          </div>
        </form>
      </Card>
      <Card title="Change password">
        <form onSubmit={changePassword} className="max-w-xl space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Current</label>
            <input className={inputClass} type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">New</label>
            <input className={inputClass} type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" loading={busy}>
            Update password
          </Button>
        </form>
      </Card>
      <Card title="Preferences">
        <form onSubmit={savePrefs} className="max-w-md space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Theme</label>
            <select className={inputClass} value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto (system)</option>
            </select>
          </div>
          <Button type="submit" loading={busy} variant="ghost">
            Save preferences
          </Button>
        </form>
      </Card>
    </div>
  );
}
