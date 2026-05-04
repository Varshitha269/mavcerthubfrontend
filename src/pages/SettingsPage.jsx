import React, { useState } from "react";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { usersApi, profileApi, uploadsApi } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Modal } from "../components/Modal.jsx";
import { CardSkeleton } from "../components/Skeleton.jsx";

const inputClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20";

const tabClass = "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200";
const activeTabClass = "bg-gradient-to-r from-indigo-600/25 to-fuchsia-600/20 text-white ring-1 ring-white/10";
const inactiveTabClass = "text-slate-400 hover:text-white hover:bg-white/5";

export function SettingsPage() {
  const toast = useToast();
  const { logout } = useAuth();
  const { theme, setTheme: applyTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("general");
  
  // User data
  const { data: userData, loading: userLoading, error: userError, reload: reloadUser } = useAsyncData(() => usersApi.me().then((r) => r.data), []);
  
  // Profile data
  const { data: profileData, loading: profileLoading, reload: reloadProfile } = useAsyncData(() => profileApi.get().then((r) => r.data), []);
  
  // Badges and certificates
  const { data: badgesData, loading: badgesLoading } = useAsyncData(() => profileApi.badges().then((r) => r.data), []);
  const { data: certsData, loading: certsLoading } = useAsyncData(() => uploadsApi.certificates().then((r) => r.data), []);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [avatarFile, setAvatarFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDeact, setConfirmDeact] = useState(false);
  const [deleting, setDeleting] = useState(false);

  React.useEffect(() => {
    if (userData?.full_name !== undefined) setFullName(userData.full_name || "");
    if (userData?.email) setEmail(userData.email);
    if (profileData?.preferences?.theme) {
      setSelectedTheme(profileData.preferences.theme);
      applyTheme(profileData.preferences.theme);
    }
  }, [userData, profileData, applyTheme]);

  async function saveProfile(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await usersApi.patchMe({ full_name: fullName || null });
      toast.success("Profile updated.");
      reloadUser();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Update failed");
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
      reloadProfile();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(e) {
    e.preventDefault();
    if (!avatarFile) return;
    
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('file', avatarFile);
      
      await usersApi.uploadAvatar(formData);
      toast.success("Avatar uploaded successfully.");
      setAvatarFile(null);
      reloadUser();
      
      // Reset file input
      e.target.reset();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    setDeleting(true);
    try {
      await usersApi.deleteMe();
      toast.success("Account deactivated.");
      setConfirmDeact(false);
      logout();
      window.location.href = "/login";
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setDeleting(false);
    }
  }

  if (userLoading && !userData) return <CardSkeleton />;
  if (userError) return <Card title="Settings"><p className="text-rose-300">{userError}</p></Card>;

  const tabs = [
    { id: "general", label: "General", icon: "👤" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "preferences", label: "Preferences", icon: "⚙️" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">Settings</h2>
        <p className="text-slate-400">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${tabClass} ${activeTab === tab.id ? activeTabClass : inactiveTabClass}`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <Card title="Profile Information" subtitle={`${userData?.email} · ${userData?.role}`}>
            <form onSubmit={saveProfile} className="max-w-md space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Full name</label>
                <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <Button type="submit" loading={busy}>
                Save Profile
              </Button>
            </form>
          </Card>

          <Card title="Avatar" subtitle="Upload a profile picture">
            <form onSubmit={uploadAvatar} className="max-w-md space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {userData?.avatar_url ? (
                    <img
                      src={userData.avatar_url}
                      alt="Avatar"
                      className="h-16 w-16 rounded-full object-cover ring-2 ring-white/10"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500/30 to-fuchsia-600/30 flex items-center justify-center text-white font-semibold text-lg"
                    style={{ display: userData?.avatar_url ? 'none' : 'flex' }}
                  >
                    {userData?.full_name?.charAt(0)?.toUpperCase() || userData?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files[0])}
                    className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-600/20 file:text-indigo-300 hover:file:bg-indigo-600/30"
                  />
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>
              {avatarFile && (
                <Button type="submit" loading={busy}>
                  Upload Avatar
                </Button>
              )}
            </form>
          </Card>

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
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <Card title="Change Password" subtitle="Update your account password">
            <form onSubmit={changePassword} className="max-w-xl space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Current password</label>
                <input className={inputClass} type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500">New password</label>
                <input className={inputClass} type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" loading={busy}>
                Update Password
              </Button>
            </form>
          </Card>

          <Card title="Account Actions" subtitle="Permanent account actions">
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Deactivate sets is_active to false (same session may still work until token expires).</p>
              <Button variant="danger" onClick={() => setConfirmDeact(true)}>
                Deactivate Account
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <div className="space-y-6">
          <Card title="Appearance" subtitle="Customize your experience">
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
                Save Preferences
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Deactivation Modal */}
      <Modal
        open={confirmDeact}
        title="Deactivate account?"
        onClose={() => setConfirmDeact(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDeact(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={deactivate}>
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-300">This calls DELETE /api/v1/users/me. You will need a new account to sign in again.</p>
      </Modal>
    </div>
  );
}
