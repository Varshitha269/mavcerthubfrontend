import React, { useState } from "react";
import { profileApi, usersApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Modal } from "../components/Modal.jsx";

const inputClass = "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500/50";

export function SettingsPage() {
  const toast = useToast();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [notify, setNotify] = useState({ email: true, status: true, reminders: true, weekly: false });
  const [language, setLanguage] = useState("English");
  const [region, setRegion] = useState("India");
  const [busy, setBusy] = useState(false);
  const [confirmDeact, setConfirmDeact] = useState(false);

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
      setTheme(selectedTheme);
      toast.success("Preferences saved.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    setBusy(true);
    try {
      await usersApi.deleteMe();
      toast.success("Account deactivated.");
      logout();
      window.location.href = "/login";
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">Settings</h2>
        <p className="text-slate-400">Preferences, security, appearance, language, and account controls.</p>
      </div>

      <Card title="Notification Preferences" subtitle="Choose how the system should alert you">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["email", "Email notifications"],
            ["status", "Status updates"],
            ["reminders", "Task and voucher reminders"],
            ["weekly", "Weekly summary"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
              {label}
              <input type="checkbox" checked={notify[key]} onChange={(e) => setNotify({ ...notify, [key]: e.target.checked })} />
            </label>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Security" subtitle="Change your password">
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Current password</label>
              <input className={inputClass} type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-slate-500">New password</label>
              <input className={inputClass} type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" loading={busy}>Update Password</Button>
          </form>
        </Card>

        <Card title="Appearance And Region" subtitle="Theme, language, and regional preferences">
          <form onSubmit={savePrefs} className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Theme</label>
              <select className={inputClass} value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Language</label>
                <select className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option>English</option>
                  <option>Hindi</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Region</label>
                <select className={inputClass} value={region} onChange={(e) => setRegion(e.target.value)}>
                  <option>India</option>
                  <option>United States</option>
                </select>
              </div>
            </div>
            <Button type="submit" loading={busy} variant="ghost">Save Preferences</Button>
          </form>
        </Card>
      </div>

      <Card title="Danger Zone" subtitle="Deactivate your account">
        <Button variant="danger" onClick={() => setConfirmDeact(true)}>Deactivate Account</Button>
      </Card>

      <Modal open={confirmDeact} title="Deactivate account?" onClose={() => setConfirmDeact(false)} footer={<><Button variant="ghost" onClick={() => setConfirmDeact(false)}>Cancel</Button><Button variant="danger" loading={busy} onClick={deactivate}>Confirm</Button></>}>
        <p className="text-sm text-slate-300">This deactivates your login. Admins can reactivate or recreate access later.</p>
      </Modal>
    </div>
  );
}
