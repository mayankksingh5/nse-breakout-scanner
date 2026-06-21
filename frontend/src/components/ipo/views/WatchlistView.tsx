'use client';

import { useMemo } from 'react';
import { Star } from 'lucide-react';
import { getIpoBySlug } from '@/data/ipo';
import { useIpoStore } from '@/store/useIpoStore';
import { PageHeader } from '@/components/ipo/PageHeader';
import { IpoGrid } from '@/components/ipo/IpoGrid';
import { ExportButtons } from '@/components/ipo/ExportButtons';

export function WatchlistView() {
  const watchlist = useIpoStore((s) => s.watchlist);
  const setIpoView = useIpoStore((s) => s.setIpoView);
  const ipos = useMemo(
    () => watchlist.map(getIpoBySlug).filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [watchlist],
  );

  return (
    <>
      <PageHeader
        title="My Watchlist"
        subtitle={`${ipos.length} favourited IPO${ipos.length === 1 ? '' : 's'}.`}
        actions={ipos.length > 0 ? <ExportButtons ipos={ipos} filename="watchlist.csv" /> : undefined}
      />

      {ipos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <Star className="mb-3 h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No IPOs in your watchlist yet. Tap the{' '}
            <Star className="inline h-3.5 w-3.5 -translate-y-0.5" /> icon on any IPO to add it.
          </p>
          <button
            onClick={() => setIpoView('overview')}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Browse IPOs
          </button>
        </div>
      ) : (
        <IpoGrid ipos={ipos} />
      )}
    </>
  );
}
