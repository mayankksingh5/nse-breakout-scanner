import { SearchX } from 'lucide-react';
import type { Ipo } from '@/types/ipo';
import { IpoCard } from './IpoCard';

/** Responsive grid of IPO cards with a friendly empty state. */
export function IpoGrid({ ipos, emptyHint }: { ipos: Ipo[]; emptyHint?: string }) {
  if (ipos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
        <SearchX className="mb-3 h-8 w-8 text-slate-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {emptyHint ?? 'No IPOs match the current filters.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {ipos.map((ipo) => (
        <IpoCard key={ipo.slug} ipo={ipo} />
      ))}
    </div>
  );
}
