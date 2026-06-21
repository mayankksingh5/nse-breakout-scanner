import React from 'react';

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  /** Optional secondary line under the value. */
  hint?: string;
  /** Tailwind colour class override for the value. */
  valueClassName?: string;
}

/** Compact label/value tile used on cards and the detail page. */
export function StatTile({ label, value, hint, valueClassName = '' }: StatTileProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className={`mt-1 text-base font-semibold text-slate-900 dark:text-slate-100 ${valueClassName}`}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{hint}</div>}
    </div>
  );
}
