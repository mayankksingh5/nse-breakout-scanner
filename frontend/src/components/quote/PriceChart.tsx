'use client';

import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { HistoryBundle, HistoryPoint } from '@/types/market';

type RangeKey = '1W' | '1M' | '6M' | '1Y' | '5Y';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '1W', label: '1W' },
  { key: '1M', label: '1M' },
  { key: '6M', label: '6M' },
  { key: '1Y', label: '1Y' },
  { key: '5Y', label: '5Y' },
];

// How many trailing points each range takes from the daily series (5Y uses weekly).
const DAILY_TAIL: Record<Exclude<RangeKey, '5Y'>, number> = {
  '1W': 5,
  '1M': 21,
  '6M': 126,
  '1Y': 252,
};

const EMERALD = '#10b981';
const ROSE = '#f43f5e';

function fmtPrice(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function PriceChart({ historyKey }: { historyKey: string }) {
  const [bundle, setBundle] = useState<HistoryBundle | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [range, setRange] = useState<RangeKey>('1Y');

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    fetch(`/history/${encodeURIComponent(historyKey)}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((d: HistoryBundle) => {
        if (!alive) return;
        setBundle(d);
        setStatus('ready');
      })
      .catch(() => alive && setStatus('error'));
    return () => {
      alive = false;
    };
  }, [historyKey]);

  const series = useMemo(() => {
    if (!bundle) return [];
    const raw: HistoryPoint[] =
      range === '5Y' ? bundle.weekly : bundle.daily.slice(-DAILY_TAIL[range]);
    return raw.map(([t, c]) => ({ t: t * 1000, price: c }));
  }, [bundle, range]);

  const up = series.length > 1 ? series[series.length - 1].price >= series[0].price : true;
  const colour = up ? EMERALD : ROSE;

  const tickFmt = (ms: number) => {
    const d = new Date(ms);
    if (range === '1W' || range === '1M')
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    if (range === '5Y') return String(d.getFullYear());
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={
              'rounded-md px-3 py-1 text-xs font-semibold transition ' +
              (range === r.key
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700')
            }
          >
            {r.label}
          </button>
        ))}
      </div>

      {status === 'loading' && (
        <div className="flex h-[300px] items-center justify-center text-sm text-slate-400 dark:text-slate-500">
          Loading chart…
        </div>
      )}
      {status === 'error' && (
        <div className="flex h-[300px] items-center justify-center text-sm text-slate-400 dark:text-slate-500">
          Price history unavailable.
        </div>
      )}
      {status === 'ready' && series.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -4 }}>
            <defs>
              <linearGradient id={`grad-${historyKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colour} stopOpacity={0.35} />
                <stop offset="100%" stopColor={colour} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.18} vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={tickFmt}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              width={60}
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => fmtPrice(v)}
            />
            <Tooltip
              contentStyle={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 8,
                color: '#e2e8f0',
                fontSize: 12,
              }}
              labelFormatter={(ms) =>
                new Date(Number(ms)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              }
              formatter={(v) => [`₹${fmtPrice(Number(v))}`, 'Close']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={colour}
              strokeWidth={2}
              fill={`url(#grad-${historyKey})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
