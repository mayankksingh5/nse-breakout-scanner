import { TrendingUp, TrendingDown } from 'lucide-react';
import type { IndexQuote } from '@/types/market';
import { Card } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import { PriceChart } from '@/components/quote/PriceChart';

function lvl(n?: number): string {
  return n == null ? '—' : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function IndexDetail({ idx }: { idx: IndexQuote }) {
  const up = idx.change >= 0;
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
        <div className="sm:text-right">
          <div className="font-mono text-3xl font-bold text-slate-900 dark:text-slate-50">{lvl(idx.value)}</div>
          <div className={`mt-0.5 flex items-center gap-1 font-mono text-sm font-semibold sm:justify-end ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{up ? '+' : ''}{lvl(idx.change)}</span>
            <span>({up ? '+' : ''}{idx.change_pct.toFixed(2)}%)</span>
          </div>
        </div>
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
        <StatTile
          label="Day Change"
          value={`${up ? '+' : ''}${idx.change_pct.toFixed(2)}%`}
          valueClassName={up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}
        />
        {range52 != null && <StatTile label="Position in 52W Range" value={`${range52.toFixed(0)}%`} />}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-600">
        Data: Yahoo Finance (end-of-day). Not investment advice — for research only.
      </p>
    </div>
  );
}
