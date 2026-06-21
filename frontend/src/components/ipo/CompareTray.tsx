'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GitCompareArrows, X } from 'lucide-react';
import { useIpoStore } from '@/store/useIpoStore';
import { getIpoBySlug } from '@/data/ipo';

/**
 * Floating tray that appears once the user queues IPOs for comparison.
 * Hidden when empty.
 */
export function CompareTray() {
  const router = useRouter();
  const compare = useIpoStore((s) => s.compare);
  const toggleCompare = useIpoStore((s) => s.toggleCompare);
  const clearCompare = useIpoStore((s) => s.clearCompare);

  if (compare.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 print:hidden">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <GitCompareArrows className="h-4 w-4 text-blue-500" />
          Compare ({compare.length})
        </span>

        <div className="flex flex-1 flex-wrap gap-1.5">
          {compare.map((slug) => {
            const ipo = getIpoBySlug(slug);
            if (!ipo) return null;
            return (
              <span
                key={slug}
                className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {ipo.companyName}
                <button onClick={() => toggleCompare(slug)} aria-label={`Remove ${ipo.companyName}`}>
                  <X className="h-3 w-3 text-slate-400 hover:text-rose-500" />
                </button>
              </span>
            );
          })}
        </div>

        <button
          onClick={clearCompare}
          className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Clear
        </button>
        <button
          onClick={() => router.push('/ipo/compare')}
          disabled={compare.length < 2}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Compare
        </button>
        <Link href="/ipo/compare" className="sr-only">
          Open compare page
        </Link>
      </div>
    </div>
  );
}
