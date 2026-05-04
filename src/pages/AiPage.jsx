import React, { useState } from "react";
import { aiApi } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";

export function AiPage() {
  const toast = useToast();
  const [text, setText] = useState("");
  const [extractResult, setExtractResult] = useState(null);
  const [genPayload, setGenPayload] = useState({ enrollment_id: "", weeks: 6, hours_per_week: 6 });
  const [genResult, setGenResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const inputClass =
    "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50";

  async function extract(e) {
    e.preventDefault();
    setBusy(true);
    setExtractResult(null);
    try {
      const { data } = await aiApi.extractCertificate({ text });
      setExtractResult(data);
      toast.success("Extract complete (or stub if AI off).");
    } catch (err) {
      toast.error(err?.response?.data?.detail || err.message);
    } finally {
      setBusy(false);
    }
  }

  async function genTasks(e) {
    e.preventDefault();
    setBusy(true);
    setGenResult(null);
    try {
      const { data } = await aiApi.generateTasks({
        enrollment_id: Number(genPayload.enrollment_id),
        weeks: Number(genPayload.weeks),
        hours_per_week: Number(genPayload.hours_per_week),
      });
      setGenResult(data);
      toast.success(`Created ${data.created ?? 0} tasks.`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">AI tools</h2>
        <p className="text-slate-400">POST /ai/certificate/extract · POST /ai/tasks/generate (requires AI_ENABLED on API)</p>
      </div>
      <Card title="Certificate text extract" subtitle="Paste OCR or certificate text">
        <form onSubmit={extract} className="space-y-4">
          <textarea className={`${inputClass} min-h-[160px]`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Certificate body…" />
          <Button type="submit" loading={busy}>
            Extract fields
          </Button>
        </form>
        {extractResult && (
          <pre className="mt-4 max-h-64 overflow-auto rounded-xl bg-black/50 p-4 text-xs text-emerald-100">{JSON.stringify(extractResult, null, 2)}</pre>
        )}
      </Card>
      <Card title="Generate study tasks" subtitle="Uses your enrollment + certification title">
        <form onSubmit={genTasks} className="max-w-md space-y-3">
          <div>
            <label className="text-xs text-slate-500">Enrollment id</label>
            <input className={inputClass} value={genPayload.enrollment_id} onChange={(e) => setGenPayload({ ...genPayload, enrollment_id: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Weeks</label>
              <input className={inputClass} type="number" value={genPayload.weeks} onChange={(e) => setGenPayload({ ...genPayload, weeks: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Hrs/week</label>
              <input
                className={inputClass}
                type="number"
                value={genPayload.hours_per_week}
                onChange={(e) => setGenPayload({ ...genPayload, hours_per_week: e.target.value })}
              />
            </div>
          </div>
          <Button type="submit" loading={busy}>
            Generate tasks
          </Button>
        </form>
        {genResult && <pre className="mt-4 rounded-xl bg-black/50 p-4 text-xs text-slate-200">{JSON.stringify(genResult, null, 2)}</pre>}
      </Card>
    </div>
  );
}
