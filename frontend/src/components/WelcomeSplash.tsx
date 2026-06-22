'use client';

import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

/** One-time welcome splash shown on first load of the dashboard. */
export function WelcomeSplash() {
  const [show, setShow] = useState(true);
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm sm:p-6">
      <div className="animate-[fadeIn_0.4s_ease-out] relative w-full max-w-md rounded-2xl border border-emerald-800/60 bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-center shadow-2xl shadow-emerald-950/40 sm:p-8">
        <div className="mb-3 text-[10px] font-semibold tracking-[0.25em] text-emerald-500 sm:text-xs sm:tracking-[0.3em]">WELCOME TO</div>
        <h2 className="mb-1 break-words text-3xl font-extrabold leading-tight tracking-tight text-emerald-400 sm:text-4xl">
          ULTRA SCANNER
        </h2>
        <p className="mb-6 text-xs text-slate-400 sm:text-sm">Breakout &amp; IPO Discovery System</p>

        <div className="space-y-4 border-t border-slate-800 pt-6 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Chief Executive Officer</div>
              <div className="truncate text-lg font-bold text-slate-100">Pratyush Tiwari</div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Chief Technology Officer</div>
              <div className="truncate text-lg font-bold text-slate-100">Mayank Kumar Singh</div>
            </div>
            <span className="shrink-0 rounded border border-cyan-800 bg-cyan-950 px-2.5 py-1 text-xs font-semibold text-cyan-400">B.Tech</span>
          </div>
        </div>

        <button
          onClick={() => setShow(false)}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-bold text-slate-950 transition hover:bg-emerald-500"
        >
          Enter Dashboard <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
