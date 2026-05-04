import React, { useState } from "react";
import { aiSuggestionsApi } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";

export function SuggestionsPage() {
  const toast = useToast();
  const [suggestions, setSuggestions] = useState(null);
  const [courses, setCourses] = useState(null);
  const [certId, setCertId] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadSuggestions() {
    setBusy(true);
    try {
      const { data } = await aiSuggestionsApi.certifications();
      setSuggestions(data);
      toast.success("Suggestions loaded.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function loadCourses(e) {
    e.preventDefault();
    if (!certId) return;
    setBusy(true);
    try {
      const { data } = await aiSuggestionsApi.courses(Number(certId));
      setCourses(data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">AI suggestions</h2>
        <p className="text-slate-400">GET /ai/suggestions/certifications · GET /ai/suggestions/courses/:id</p>
      </div>
      <Card title="Certification suggestions" actions={<Button onClick={loadSuggestions} loading={busy}>Refresh</Button>}>
        <div className="max-h-[480px] space-y-3 overflow-auto">
          {(suggestions?.suggestions || []).length ? (
            suggestions.suggestions.map((s, i) => {
              const c = s.certification || {};
              return (
                <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="font-medium text-white">{c.title}</div>
                  <div className="text-xs text-slate-500">{c.provider}</div>
                  <div className="mt-1 text-xs text-indigo-300">Match ~{s.match_percentage}% · score {s.score}</div>
                  {s.reasons?.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-xs text-slate-400">
                      {s.reasons.map((r, j) => (
                        <li key={j}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-slate-500">Load to see ranked suggestions.</p>
          )}
        </div>
        {suggestions?.analysis && (
          <p className="mt-4 text-xs text-slate-400">Analysis: {JSON.stringify(suggestions.analysis)}</p>
        )}
      </Card>
      <Card title="Course path for certification">
        <form onSubmit={loadCourses} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label className="text-xs text-slate-500">Certification id</label>
            <input className={inputClass} value={certId} onChange={(e) => setCertId(e.target.value)} />
          </div>
          <Button type="submit" loading={busy}>
            Load courses
          </Button>
        </form>
        {courses && <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-black/50 p-4 text-xs text-slate-200">{JSON.stringify(courses, null, 2)}</pre>}
      </Card>
    </div>
  );
}
