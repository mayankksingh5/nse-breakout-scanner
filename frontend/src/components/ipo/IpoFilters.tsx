'use client';

import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useIpoStore } from '@/store/useIpoStore';
import { IPO_YEARS, ALL_SECTORS } from '@/data/ipo';

const selectCls =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ' +
  'focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200';

/** Toolbar of filters bound to the global IPO store. */
export function IpoFilters({ showYear = true }: { showYear?: boolean }) {
  const filters = useIpoStore((s) => s.filters);
  const setFilter = useIpoStore((s) => s.setFilter);
  const resetFilters = useIpoStore((s) => s.resetFilters);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
        <SlidersHorizontal className="h-4 w-4" /> Filters
      </span>

      {showYear && (
        <select
          value={filters.year ?? ''}
          onChange={(e) => setFilter('year', e.target.value ? Number(e.target.value) : null)}
          className={selectCls}
          aria-label="Year"
        >
          <option value="">All Years</option>
          {IPO_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      )}

      <select
        value={filters.sector ?? ''}
        onChange={(e) => setFilter('sector', e.target.value || null)}
        className={selectCls}
        aria-label="Sector"
      >
        <option value="">All Sectors</option>
        {ALL_SECTORS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={filters.minMarketCapCr}
        onChange={(e) => setFilter('minMarketCapCr', Number(e.target.value))}
        className={selectCls}
        aria-label="Market cap"
      >
        <option value={0}>Any Market Cap</option>
        <option value={10000}>₹10,000 Cr+</option>
        <option value={50000}>₹50,000 Cr+</option>
        <option value={100000}>₹1L Cr+ (Mega)</option>
      </select>

      <select
        value={filters.returns}
        onChange={(e) => setFilter('returns', e.target.value as typeof filters.returns)}
        className={selectCls}
        aria-label="Returns"
      >
        <option value="all">All Returns</option>
        <option value="positive">Positive Returns</option>
        <option value="negative">Negative Returns</option>
      </select>

      <select
        value={filters.sort}
        onChange={(e) => setFilter('sort', e.target.value as typeof filters.sort)}
        className={selectCls}
        aria-label="Sort"
      >
        <option value="default">Sort: Default</option>
        <option value="gainers">Top Gainers</option>
        <option value="losers">Top Losers</option>
        <option value="marketcap">Largest Market Cap</option>
        <option value="newest">Newest First</option>
      </select>

      <button
        onClick={resetFilters}
        className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reset
      </button>
    </div>
  );
}
