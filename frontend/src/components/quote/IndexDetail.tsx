import type { IndexQuote } from '@/types/market';
import { Card } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import { PriceChart } from '@/components/quote/PriceChart';
import { LiveQuoteHeader, LiveDayChangeTile } from '@/components/quote/LiveQuote';

function lvl(n?: number): string {
  return n == null ? '—' : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function IndexDetail({ idx }: { idx: IndexQuote }) {
  const range52 =
    idx.week52_low != null && idx.week52_high != null
      ? Math.max(0, Math.min(100, ((idx.value - idx.week52_low) / (idx.week52_high - idx.week52_low)) * 100))
      : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{idx.name}</h1>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {idx.group}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Market Index</p>
        </div>
        <LiveQuoteHeader
          priceKey={idx.slug}
          value={idx.value}
          change={idx.change}
          changePct={idx.change_pct}
        />
      </div>

      {/* Chart */}
      <Card className="p-4 sm:p-5">
        <PriceChart historyKey={idx.slug} />
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Open" value={lvl(idx.open)} />
        <StatTile label="High" value={lvl(idx.high)} />
        <StatTile label="Low" value={lvl(idx.low)} />
        <StatTile label="Prev Close" value={lvl(idx.prev_close)} />
        <StatTile label="52W High" value={lvl(idx.week52_high)} />
        <StatTile label="52W Low" value={lvl(idx.week52_low)} />
        <LiveDayChangeTile priceKey={idx.slug} changePct={idx.change_pct} />
        {range52 != null && <StatTile label="Position in 52W Range" value={`${range52.toFixed(0)}%`} />}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-600">
        Data: Yahoo Finance (end-of-day). Not investment advice — for research only.
      </p>
    </div>
  );
}
