import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

const inputClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20";

export function LoginPage() {
  const { user, login, register } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");

  if (user) return <Navigate to="/dashboard" replace />;

  async function onLogin(e) {
    e.preventDefault();
    if (loginPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await login(loginEmail.trim().toLowerCase(), loginPassword);
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
    setLoading(true);
    try {
      await register({ email: regEmail.trim().toLowerCase(), password: regPassword, full_name: regName || null });
      toast.success("Account created! Please log in.");
      setRegEmail("");
      setRegPassword("");
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
      <div className="relative w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">Maverick Hub</h1>
          <p className="mt-2 text-slate-400">Glass dashboard · FastAPI backend</p>
        </div>
        <Card>
          <div className="mb-6 flex rounded-xl bg-white/5 p-1">
            {["login", "register"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition ${
                  tab === t ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
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
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Password</label>
                <input
                  className={inputClass}
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  readOnly
                  onFocus={(e) => e.target.removeAttribute("readOnly")}
                />
              </div>
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
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Password</label>
                <input
                  className={inputClass}
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter your password"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" className="w-full" loading={loading}>
                Create account
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
