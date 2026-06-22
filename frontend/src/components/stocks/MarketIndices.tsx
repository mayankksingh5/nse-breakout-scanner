'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface IndexRow {
  name: string;
  slug: string;
  symbol: string;
  group: 'NSE' | 'BSE';
  value: number;
  change: number;
  change_pct: number;
}

function fmt(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Horizontal, scrollable strip of NSE/BSE market indices shown at the very top
 * of the Stocks page (like Groww / Moneycontrol). Theme-aware and responsive —
 * cards keep a fixed width and the row scrolls sideways on narrow screens.
 */
export function MarketIndices({ asOf }: { asOf?: string }) {
  const [rows, setRows] = useState<IndexRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch('/api/indices')
      .then((r) => r.json())
      .then((d) => {
        if (alive) setRows(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        if (alive) setRows([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Nothing to show yet (e.g. dataset predates the indices feature) — stay quiet.
  if (!loading && rows.length === 0) return null;

  return (
    <section className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
          Market Indices
        </h2>
        {asOf && <span className="text-[11px] text-slate-400 dark:text-slate-500">as of {asOf}</span>}
      </div>

      {/* Full-bleed horizontal scroll within the page's padding. */}
      <div className="-mx-6 overflow-x-auto px-6 pb-1">
        <div className="flex min-w-max gap-3">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[78px] w-[160px] shrink-0 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50"
                />
              ))
            : rows.map((idx) => {
                const up = idx.change >= 0;
                const colour = up
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400';
                return (
                  <Link
                    key={idx.symbol}
                    href={`/indices/${idx.slug}`}
                    className="w-[160px] shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-emerald-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-500"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {idx.name}
                      </span>
                      <span className="shrink-0 rounded bg-slate-200 px-1 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {idx.group}
                      </span>
                    </div>
                    <div className="mt-1.5 font-mono text-base font-bold text-slate-900 dark:text-slate-50">
                      {fmt(idx.value)}
                    </div>
                    <div className={`mt-0.5 flex items-center gap-1 font-mono text-xs font-medium ${colour}`}>
                      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>
                        {up ? '+' : ''}
                        {fmt(idx.change)}
                      </span>
                      <span>
                        ({up ? '+' : ''}
                        {idx.change_pct.toFixed(2)}%)
                      </span>
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}
