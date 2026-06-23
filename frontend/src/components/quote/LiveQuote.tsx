'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { StatTile } from '@/components/ui/StatTile';
import { useLivePrices } from '@/lib/useLivePrices';

function fmtNum(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Detail-page quote header (price + change%), overlaid with live data when the
 * hub has a tick for this key. Falls back to the snapshot props otherwise, so
 * it renders identically to before when the live layer is off/unavailable.
 *
 * Server-component-safe: receives only serializable props.
 */
export function LiveQuoteHeader({
  priceKey,
  currency = false,
  value: fbValue,
  change: fbChange,
  changePct: fbChangePct,
}: {
  priceKey: string;
  currency?: boolean;
  value: number;
  change?: number;
  changePct: number;
}) {
  const { enabled, connected, prices } = useLivePrices();
  const live = prices[priceKey];
  const isLive = enabled && connected && !!live && live.ts > 0;

  const value = live?.ltp ?? fbValue;
  const change = live?.change ?? fbChange;
  const changePct = live?.changePct ?? fbChangePct;
  const up = changePct >= 0;
  const disp = (n: number) => (currency ? '₹' : '') + fmtNum(n);

  return (
    <div className="sm:text-right">
      <div className="flex items-center gap-2 sm:justify-end">
        <div className="font-mono text-3xl font-bold text-slate-900 dark:text-slate-50">{disp(value)}</div>
        {isLive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> LIVE
          </span>
        )}
      </div>
      <div
        className={`mt-0.5 flex items-center gap-1 font-mono text-sm font-semibold sm:justify-end ${
          up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
        }`}
      >
        {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        {change != null && <span>{up ? '+' : ''}{fmtNum(change)}</span>}
        <span>({up ? '+' : ''}{changePct.toFixed(2)}%)</span>
      </div>
    </div>
  );
}

/**
 * The "Day Change" stat tile, kept consistent with the live header (so the two
 * never show different change% during market hours).
 */
export function LiveDayChangeTile({
  priceKey,
  changePct: fbChangePct,
}: {
  priceKey: string;
  changePct: number;
}) {
  const { enabled, connected, prices } = useLivePrices();
  const live = prices[priceKey];
  const isLive = enabled && connected && !!live && live.ts > 0;
  const changePct = live?.changePct ?? fbChangePct;
  const up = changePct >= 0;

  return (
    <StatTile
      label={isLive ? 'Day Change (live)' : 'Day Change'}
      value={`${up ? '+' : ''}${changePct.toFixed(2)}%`}
      valueClassName={up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}
    />
  );
}
