import React from "react";
import { useParams } from "react-router-dom";
import { vouchersApi } from "../services/api.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { CardSkeleton } from "../components/Skeleton.jsx";

export function VoucherClaimPage() {
  const { token } = useParams();
  const claim = useAsyncData(() => vouchersApi.claim(token).then((r) => r.data), [token]);

  if (claim.loading && !claim.data) return <CardSkeleton />;
  const data = claim.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6 text-slate-100">
      <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Secure Voucher Claim</p>
        <h2 className="mt-3 font-display text-3xl font-bold">Voucher Code</h2>
        <p className="mt-2 text-sm text-slate-400">This page records delivery/read tracking for audit purposes.</p>
      </section>

      {claim.error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">{claim.error}</div>
      ) : (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl shadow-black/20">
          <p className="text-sm text-slate-400">Masked code</p>
          <div className="mt-2 font-display text-2xl font-bold text-white">{data?.masked_code}</div>
          <p className="mt-6 text-sm text-slate-400">Full code</p>
          <div className="mt-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-4 font-mono text-lg font-bold tracking-wide text-cyan-50">
            {data?.code}
          </div>
          <p className="mt-4 text-xs text-slate-500">Status: {data?.status} | Delivered: {data?.delivered_at || "now"}</p>
        </section>
      )}
    </div>
  );
}
