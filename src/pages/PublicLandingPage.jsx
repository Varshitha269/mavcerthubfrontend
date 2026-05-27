import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Button } from "../components/Button.jsx";
import { AuthMotionOverlay } from "../components/AuthMotionOverlay.jsx";

const inputClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const publicKnowledge = {
  overview:
    "Maverick Certification Hub is a certification management platform. It helps users discover certifications, register for drives, prepare with tasks, upload proof documents, receive vouchers, and track final results.",
  usefulness:
    "It is useful because it keeps the full certification journey in one place. Users do not need to jump between forms, emails, spreadsheets, and separate document folders. Admins can review applications, check eligibility, manage drives, allocate vouchers, and monitor risks from a single workspace.",
  user:
    "For users, the app helps with certification discovery, AI roadmap guidance, skill-gap analysis, certification match scores, enrollments, task tracking, document uploads, voucher status, notifications, badges, and result history.",
  admin:
    "For admins, the app supports user management, drive creation, registration review, eligibility approval, document verification, voucher allocation, result imports, reminders, reports, and operational analytics.",
  ai:
    "The AI layer supports public guidance before login, and after login it can help with user roadmaps, skill gaps, certification matching, learning paths, candidate ranking, drive risk summaries, voucher recommendations, reminder messages, dropout risk, and certificate confidence scoring.",
  workflow:
    "A typical flow is: choose a certification, check eligibility, register for a drive, prepare using tasks, upload required documents, receive or track a voucher, complete the assessment, then view results and achievements.",
  voucher:
    "Vouchers are handled after login. Admins can issue and update vouchers, while users can see their assigned voucher status and expiry details.",
  documents:
    "The document flow lets users upload required proof or completed certificates. Admins review those uploads, and AI confidence scoring can help flag whether a certificate appears to match the expected certification.",
  privacy:
    "Before login, I only answer general product questions. I cannot access or reveal users, admins, emails, passwords, vouchers, documents, results, tokens, database records, or private activity.",
};

const roles = {
  "Cloud Engineer": ["Cloud fundamentals", "Azure/AWS associate track", "DevOps or security specialization", "Voucher-ready exam preparation"],
  "Data Analyst": ["Data fundamentals", "BI/reporting certification", "SQL and analytics practice", "Dashboard portfolio evidence"],
  "DevOps Engineer": ["Linux/Git foundation", "Cloud practitioner", "CI/CD and container certification", "Advanced DevOps assessment readiness"],
  "Security Analyst": ["Security fundamentals", "Cloud security track", "Compliance and identity topics", "Scenario-based assessment practice"],
};

const featureMedia = [
  {
    title: "User profile intelligence",
    body: "AI roadmap, skill gaps, certification match scores, and learning path suggestions.",
    image: "/media/user-ai-roadmap.svg",
    target: "/profile",
  },
  {
    title: "Admin operations intelligence",
    body: "Drive risks, candidate ranking, voucher recommendations, reminders, and one-click reports.",
    image: "/media/admin-ai-ops.svg",
    target: "/admin",
  },
  {
    title: "Verification support",
    body: "Document review, certificate confidence scoring, upload history, and result tracking.",
    image: "/media/verification-ai.svg",
    target: "/uploads",
  },
];

function PublicChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi, I can explain what Maverick Certification Hub does. I cannot access private user or admin data before login.",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesBoxRef = useRef(null);

  useEffect(() => {
    const box = messagesBoxRef.current;
    if (!box) return;
    box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function answerFor(text) {
    const lower = text.toLowerCase().trim();
    if (!lower) return publicKnowledge.overview;

    const sensitiveIntent =
      /(password|token|secret|voucher code|admin list|user list|result of|private|database|email of|show me|give me|download|delete|update|approve|reject|login as)/i.test(lower) ||
      /(how many|count|number of|list|show|total|active|inactive|pending|approved|rejected|passed|failed).*(user|admin|candidate|learner|employee|voucher|document|upload|certificate|drive|registration|result|approval)/i.test(lower) ||
      /(user|admin|candidate|learner|employee|voucher|document|upload|certificate|drive|registration|result|approval).*(how many|count|number of|list|show|total|active|inactive|pending|approved|rejected|passed|failed)/i.test(lower);

    if (sensitiveIntent) {
      return "I do not have access to private or operational data before login. Please sign in with the correct role to view counts, lists, users, vouchers, documents, results, approvals, or admin analytics.";
    }

    if (/^(hi|hello|hey|hii|hola)\b/.test(lower)) {
      return "Hi! I can help you understand what Maverick Certification Hub does, who it is for, and how its AI features support certification workflows before you sign in.";
    }

    if (/(why|useful|benefit|help|advantage|need|purpose)/i.test(lower)) {
      return publicKnowledge.usefulness;
    }

    if (/(how.*work|process|flow|steps|journey|workflow)/i.test(lower)) {
      return publicKnowledge.workflow;
    }

    if (/(what|about|application|app|platform|hub|maverick)/i.test(lower)) {
      return publicKnowledge.overview;
    }

    if (/(user|learner|employee|student|candidate|profile)/i.test(lower)) {
      return publicKnowledge.user;
    }

    if (/(admin|manager|approval|drive|operations|review)/i.test(lower)) {
      return publicKnowledge.admin;
    }

    if (/(ai|artificial|smart|recommend|roadmap|skill|match|chatbot|prediction|risk)/i.test(lower)) {
      return publicKnowledge.ai;
    }

    if (/(voucher|coupon|exam code|redeem|expiry|expire)/i.test(lower)) {
      return publicKnowledge.voucher;
    }

    if (/(document|upload|certificate|verify|verification|proof)/i.test(lower)) {
      return publicKnowledge.documents;
    }

    if (/(safe|privacy|secure|leak|sensitive|data)/i.test(lower)) {
      return publicKnowledge.privacy;
    }

    return `I can answer only public questions about this application before login. In short, ${publicKnowledge.overview}`;
  }

  function send(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }, { role: "assistant", content: answerFor(trimmed) }]);
    setInput("");
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-white">Public AI Guide</h3>
          <p className="text-xs text-slate-400">Product-only answers before login</p>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">Safe mode</span>
      </div>
      <div ref={messagesBoxRef} className="h-72 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[84%] rounded-2xl px-3 py-2 text-sm ${message.role === "user" ? "mch-primary-button" : "bg-white/10 text-slate-200"}`}>
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask what this hub does..."
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
        />
        <Button type="submit" className="!px-4">Ask</Button>
      </form>
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder, show, onToggle, name }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</label>
      <div className="relative">
        <input
          className={`${inputClass} pr-11`}
          type={show ? "text" : "password"}
          name={name}
          autoComplete="new-password"
          value={value}
          onChange={onChange}
          required
          minLength={6}
          placeholder={placeholder}
          readOnly
          onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
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

function AuthDialog({ open, onClose }) {
  const { login, register } = useAuth();
  const toast = useToast();
  const fieldNonce = useMemo(() => Math.random().toString(36).slice(2), []);
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

  function clearFields() {
    setLoginEmail("");
    setLoginPassword("");
    setRegEmail("");
    setRegPassword("");
    setRegConfirmPassword("");
    setRegName("");
  }

  useEffect(() => {
    if (!open) return undefined;
    setTab("login");
    clearFields();
    const timers = [80, 260, 620].map((ms) => window.setTimeout(clearFields, ms));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [open]);

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

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden p-4">
        <button
          type="button"
          aria-label="Close login"
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={loading ? undefined : onClose}
        />
        <div className="mch-login-live-bg pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <span className="mch-login-wave mch-login-wave-a" />
          <span className="mch-login-wave mch-login-wave-b" />
          <span className="mch-login-pulse-grid" />
        </div>
        <div className="relative z-[81] w-full max-w-xl rounded-[2rem] border border-white/15 bg-[#2b124c]/90 p-7 shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <div className="mch-card-accent absolute inset-x-0 top-0 h-1 rounded-t-[2rem]" />
          <button
            type="button"
            aria-label="Close login"
            onClick={loading ? undefined : onClose}
            className="absolute right-5 top-5 rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12" />
              <path d="M18 6 6 18" />
            </svg>
          </button>
          <div className="mb-6 pr-12">
            <div className="mch-brand-mark mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black shadow-xl shadow-cyan-950/20">M</div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-white">Maverick Certification Hub</h2>
            <p className="mt-1 text-sm text-slate-400">Sign in or create an account to unlock personalized AI features.</p>
          </div>
          <div className="mb-6 flex rounded-xl bg-white/5 p-1">
            {["login", "register"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                disabled={loading}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition ${
                  tab === item ? "mch-primary-button text-white shadow-lg" : "text-slate-400 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          {tab === "login" ? (
            <form key={`login-${open}`} onSubmit={onLogin} className="space-y-4" autoComplete="off">
              <input type="text" name={`mch-decoy-user-${fieldNonce}`} tabIndex="-1" autoComplete="off" className="hidden" />
              <input type="password" name={`mch-decoy-pass-${fieldNonce}`} tabIndex="-1" autoComplete="new-password" className="hidden" />
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Email</label>
                <input
                  className={inputClass}
                  type="text"
                  inputMode="email"
                  name={`mch-login-email-${fieldNonce}`}
                  autoComplete="new-password"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  readOnly
                  onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
                />
              </div>
              <PasswordField
                label="Password"
                name={`mch-login-secret-${fieldNonce}`}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                show={showLoginPassword}
                onToggle={() => setShowLoginPassword((v) => !v)}
              />
              <Button type="submit" className="w-full" loading={loading}>Sign in</Button>
            </form>
          ) : (
            <form key={`register-${open}`} onSubmit={onRegister} className="space-y-4" autoComplete="off">
              <input type="text" name={`mch-decoy-register-${fieldNonce}`} tabIndex="-1" autoComplete="off" className="hidden" />
              <input type="password" name={`mch-decoy-register-pass-${fieldNonce}`} tabIndex="-1" autoComplete="new-password" className="hidden" />
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Full name</label>
                <input className={inputClass} name={`mch-register-name-${fieldNonce}`} autoComplete="off" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Enter your full name" />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Email</label>
                <input
                  className={inputClass}
                  type="text"
                  inputMode="email"
                  name={`mch-register-email-${fieldNonce}`}
                  autoComplete="new-password"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  readOnly
                  onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
                />
              </div>
              <PasswordField
                label="Password"
                name={`mch-register-secret-${fieldNonce}`}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Create a password"
                show={showRegPassword}
                onToggle={() => setShowRegPassword((v) => !v)}
              />
              <PasswordField
                label="Confirm password"
                name={`mch-register-confirm-${fieldNonce}`}
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                show={showRegConfirmPassword}
                onToggle={() => setShowRegConfirmPassword((v) => !v)}
              />
              <Button type="submit" className="w-full" loading={loading}>Create account</Button>
            </form>
          )}
        </div>
      </div>
      <AuthMotionOverlay
        show={loading}
        mode={tab}
        title={tab === "register" ? "Creating your account" : "Signing you in"}
        subtitle={tab === "register" ? "Setting up your certification profile." : "Preparing your dashboard and secure session."}
      />
    </>
  );
}

function AiPreview({ onRequireLogin }) {
  const [role, setRole] = useState("Cloud Engineer");
  const [experience, setExperience] = useState("Beginner");
  const readiness = useMemo(() => {
    const base = experience === "Beginner" ? 42 : experience === "Intermediate" ? 68 : 84;
    return Math.min(96, base + (role.includes("Cloud") ? 4 : 0));
  }, [experience, role]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <h3 className="font-display text-lg font-bold text-white">AI Path Preview</h3>
      <p className="mt-1 text-sm text-slate-400">Try a generic path without signing in.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-slate-500">Goal</label>
          <select className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.keys(roles).map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">Experience</label>
          <select className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={experience} onChange={(e) => setExperience(e.target.value)}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-white">Estimated readiness</span>
          <span className="font-display text-2xl font-bold text-white">{readiness}%</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/10">
          <div className="h-2 rounded-full bg-gradient-to-r from-fuchsia-300 via-rose-200 to-amber-100" style={{ width: `${readiness}%` }} />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {roles[role].map((step, index) => (
          <div key={step} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">{index + 1}</span>
            <span className="text-sm text-slate-200">{step}</span>
          </div>
        ))}
      </div>
      <Button className="mt-4 w-full" onClick={onRequireLogin}>Unlock personalized AI roadmap</Button>
    </div>
  );
}

export function PublicLandingPage() {
  const { user, isAdmin } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [postLoginTarget, setPostLoginTarget] = useState(null);
  if (user) return <Navigate to={postLoginTarget || (isAdmin ? "/dashboard" : "/home")} replace />;

  function openAuth(target = null) {
    setPostLoginTarget(target);
    setAuthOpen(true);
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100" style={{ backgroundColor: "var(--color-bg-body)" }}>
      <div className="pointer-events-none fixed inset-0" style={{ background: "var(--gradient-login)" }} />
      <div className="mch-login-live-bg pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <span className="mch-login-wave mch-login-wave-a" />
        <span className="mch-login-wave mch-login-wave-b" />
        <span className="mch-login-wave mch-login-wave-c" />
        <span className="mch-login-pulse-grid" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <div className="mch-brand-mark flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black shadow-lg shadow-cyan-950/30">M</div>
          <div>
            <div className="text-lg font-bold tracking-tight text-white">Maverick Certification Hub</div>
            <p className="text-xs text-slate-400">AI-powered certification operations</p>
          </div>
        </div>
        <Button onClick={() => openAuth()}>Sign in / Register</Button>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-10 px-4 pb-12 pt-4 md:px-8">
        <section className="grid min-h-[76vh] items-center gap-8 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
              Learn, qualify, verify, and complete certifications in one hub
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-6xl">
              Certification journeys with AI guidance before the first click.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Explore how learners discover certifications, admins manage drives, documents are verified, vouchers are allocated, and results become actionable insights.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button onClick={() => openAuth()}>Start now</Button>
              <a href="#preview" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10">Preview features</a>
            </div>
          </div>
          <div className="mch-public-showcase relative rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/25 backdrop-blur-xl">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-200/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-100/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-200/70" />
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">Animated media preview</div>
              </div>
              <img
                src="/media/certification-demo.svg"
                alt="Animated dashboard preview showing certification cards, charts, and workflow activity"
                className="h-auto w-full rounded-2xl border border-white/10 object-cover shadow-2xl shadow-black/25"
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {["AI roadmap", "Drive risks", "Verification"].map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs font-semibold text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="preview" className="grid gap-6 lg:grid-cols-3">
          {featureMedia.map(({ title, body, image, target }) => (
            <div key={title} className="mch-public-image-card rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/15">
              <img src={image} alt={`${title} animated preview`} className="mb-4 h-44 w-full rounded-2xl border border-white/10 object-cover shadow-lg shadow-black/20" />
              <h2 className="font-display text-xl font-bold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
              <Button variant="ghost" className="mt-4 !py-2 !text-xs" onClick={() => openAuth(target)}>Try this AI feature</Button>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <AiPreview onRequireLogin={() => openAuth("/profile")} />
          <PublicChat />
        </section>
      </main>
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
