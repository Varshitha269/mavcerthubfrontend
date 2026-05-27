import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";
import { AuthMotionOverlay } from "../components/AuthMotionOverlay.jsx";

const inputClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function PasswordField({ label, value, onChange, placeholder, autoComplete = "new-password", show, onToggle, name }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</label>
      <div className="relative">
        <input
          className={`${inputClass} pr-11`}
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          required
          minLength={6}
          placeholder={placeholder}
          autoComplete={autoComplete}
          readOnly
          onFocus={(e) => e.target.removeAttribute("readOnly")}
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          {show ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12a11.8 11.8 0 0 1 3.06-4.94" />
              <path d="M9.9 4.24A10.74 10.74 0 0 1 12 4c5 0 9.27 3.11 11 8a11.78 11.78 0 0 1-1.62 2.82" />
              <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
              <path d="M1 1l22 22" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { user, login, register } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regName, setRegName] = useState("");

  if (user && !loading) return <Navigate to="/dashboard" replace />;

  async function onLogin(e) {
    e.preventDefault();
    if (loginPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await Promise.all([login(loginEmail.trim().toLowerCase(), loginPassword), delay(1500)]);
      toast.success("Signed in.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onRegister(e) {
    e.preventDefault();
    if (regPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await Promise.all([register({ email: regEmail.trim().toLowerCase(), password: regPassword, full_name: regName || null }), delay(1200)]);
      toast.success("Account created! Please log in.");
      setRegEmail("");
      setRegPassword("");
      setRegConfirmPassword("");
      setRegName("");
      setTab("login");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4" style={{ backgroundColor: "var(--color-bg-body)" }}>
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: "var(--gradient-login)" }}
      />
      <div className="mch-login-live-bg pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <span className="mch-login-wave mch-login-wave-a" />
        <span className="mch-login-wave mch-login-wave-b" />
        <span className="mch-login-wave mch-login-wave-c" />
        <span className="mch-login-pulse-grid" />
        <span className="mch-login-scanline" />
      </div>
      <div className="relative w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mch-brand-mark mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black shadow-xl shadow-cyan-950/20">
            M
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">Maverick Certification Hub</h1>
          {/* <p className="mt-2 text-slate-400">Certification Work</p> */}
        </div>
        <Card>
          <div className="mb-6 flex rounded-xl bg-white/5 p-1">
            {["login", "register"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition ${
                  tab === t ? "mch-primary-button text-white shadow-lg" : "text-slate-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "login" ? (
            <form onSubmit={onLogin} className="space-y-4" autoComplete="off">
              <input type="text" name="prevent_autofill" id="prevent_autofill" value="" style={{ display: "none" }} readOnly />
              <input type="password" name="prevent_autofill_pass" id="prevent_autofill_pass" value="" style={{ display: "none" }} readOnly />
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Email</label>
                <input className={inputClass} type="text" inputMode="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required placeholder="Enter your email" autoComplete="one-time-code" readOnly onFocus={(e) => e.target.removeAttribute("readOnly")} />
              </div>
              <PasswordField
                label="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                show={showLoginPassword}
                onToggle={() => setShowLoginPassword((v) => !v)}
              />
              <Button type="submit" className="w-full" loading={loading}>
                Sign in
              </Button>
            </form>
          ) : (
            <form onSubmit={onRegister} className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Full name</label>
                <input className={inputClass} value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Enter your full name" autoComplete="off" />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Email</label>
                <input className={inputClass} type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required placeholder="Enter your email" autoComplete="off" />
              </div>
              <PasswordField
                label="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Enter your password"
                show={showRegPassword}
                onToggle={() => setShowRegPassword((v) => !v)}
                autoComplete="off"
              />
              <PasswordField
                label="Confirm password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                show={showRegConfirmPassword}
                onToggle={() => setShowRegConfirmPassword((v) => !v)}
                autoComplete="off"
              />
              <Button type="submit" className="w-full" loading={loading}>
                Create account
              </Button>
            </form>
          )}
        </Card>
      </div>
      <AuthMotionOverlay
        show={loading}
        mode={tab === "register" ? "register" : "login"}
        title={tab === "register" ? "Creating your account" : "Signing you in"}
        subtitle={tab === "register" ? "Setting up your certification profile." : "Preparing your dashboard and secure session."}
      />
    </div>
  );
}
