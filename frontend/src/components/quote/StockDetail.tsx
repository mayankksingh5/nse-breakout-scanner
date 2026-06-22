import { ArrowUpRight, ShieldAlert, TrendingUp, TrendingDown } from 'lucide-react';
import type { StockSignal } from '@/types/market';
import { Card } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import { PriceChart } from '@/components/quote/PriceChart';

function price(n?: number): string {
  return n == null ? '—' : '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function cap(cr?: number): string {
  if (cr == null) return '—';
  if (cr >= 100000) return '₹' + (cr / 100000).toFixed(2) + 'L Cr';
  return '₹' + cr.toLocaleString('en-IN') + ' Cr';
}
function vol(n?: number): string {
  if (!n) return '—';
  if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
  if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

const SIGNAL_META: Record<string, { label: string; cls: string }> = {
  STRONG_BUY: { label: 'Strong Buy', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400' },
  BREAKOUT_WATCH: { label: 'Breakout Watch', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400' },
  MONITOR: { label: 'Monitor', cls: 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  IGNORE: { label: 'Ignore', cls: 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
};

export function StockDetail({ s }: { s: StockSignal }) {
  const up = s.price_change_pct >= 0;
  const sig = SIGNAL_META[s.signal_type] ?? SIGNAL_META.MONITOR;
  const changeAbs = s.prev_close != null ? s.current_price - s.prev_close : undefined;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{s.symbol}</h1>
            <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${sig.cls}`}>
              {s.signal_type === 'STRONG_BUY' && <ArrowUpRight className="mr-1 inline h-3.5 w-3.5" />}
              {s.signal_type === 'BREAKOUT_WATCH' && <ShieldAlert className="mr-1 inline h-3.5 w-3.5" />}
              {sig.label}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{s.company_name}</p>
          {(s.sector || s.industry) && (
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              {[s.sector, s.industry].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <div className="sm:text-right">
          <div className="font-mono text-3xl font-bold text-slate-900 dark:text-slate-50">{price(s.current_price)}</div>
          <div className={`mt-0.5 flex items-center gap-1 font-mono text-sm font-semibold sm:justify-end ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {changeAbs != null && <span>{up ? '+' : ''}{changeAbs.toFixed(2)}</span>}
            <span>({up ? '+' : ''}{s.price_change_pct.toFixed(2)}%)</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <Card className="p-4 sm:p-5">
        <PriceChart historyKey={s.symbol} />
      </Card>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Open" value={price(s.open)} />
        <StatTile label="High" value={price(s.high)} />
        <StatTile label="Low" value={price(s.low)} />
        <StatTile label="Prev Close" value={price(s.prev_close)} />
        <StatTile label="52W High" value={price(s.week52_high)} />
        <StatTile label="52W Low" value={price(s.week52_low)} />
        <StatTile label="Market Cap" value={cap(s.market_cap_cr)} />
        <StatTile label="Volume" value={vol(s.volume)} />
        <StatTile label="P/E Ratio" value={s.pe != null ? s.pe.toFixed(2) : '—'} />
        <StatTile label="EPS" value={s.eps != null ? `₹${s.eps.toFixed(2)}` : '—'} />
        <StatTile label="Avg Vol (1M)" value={vol(s.avg_volume_1m)} />
        <StatTile label="Avg Vol (3M)" value={vol(s.avg_volume_3m)} />
      </div>

      {/* Breakout signal */}
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Breakout Signal
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Breakout Score" value={`${s.breakout_score}/100`} valueClassName="text-emerald-600 dark:text-emerald-400" />
          <StatTile label="Signal" value={sig.label} />
          <StatTile label="Resistance" value={price(s.resistance_price)} />
          <StatTile
            label="Distance to Resistance"
            value={`${s.distance_pct.toFixed(2)}%`}
            valueClassName={s.distance_pct <= 2 && s.distance_pct >= -0.5 ? 'text-amber-600 dark:text-amber-400' : ''}
          />
          <StatTile label="Volume Surge (vs 1M)" value={`${s.volume_ratio.toFixed(2)}x`} valueClassName={s.volume_ratio >= 2 ? 'text-cyan-600 dark:text-cyan-400' : ''} />
          <StatTile label="Day Change" value={`${up ? '+' : ''}${s.price_change_pct.toFixed(2)}%`} valueClassName={up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} />
        </div>
      </Card>

      {/* About */}
      {s.description && (
        <Card className="p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            About {s.company_name}
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{s.description}</p>
        </Card>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-600">
        Data: Yahoo Finance (end-of-day). Not investment advice — for research only.
      </p>
    </div>
  );
}
