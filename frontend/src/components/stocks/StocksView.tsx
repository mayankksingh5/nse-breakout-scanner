"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, ShieldAlert, RefreshCw, Layers, Search, AlertTriangle } from 'lucide-react';
import { getFreshness } from '@/lib/freshness';
import { MarketIndices } from '@/components/stocks/MarketIndices';

interface SignalRow {
  id: string;
  symbol: string;
  company_name: string;
  market_cap_cr: number;
  current_price: number;
  resistance_price: number;
  distance_pct: number;
  price_change_pct: number;
  current_volume: number;
  avg_volume_1m: number;
  avg_volume_2m: number;
  avg_volume_3m: number;
  volume_ratio: number;
  breakout_score: number;
  signal_type: 'STRONG_BUY' | 'BREAKOUT_WATCH' | 'MONITOR' | 'IGNORE';
}

interface ScanStatus {
  lastScanAt: string | null;
  signalCount: number;
  source?: string;
}

// Format big share volumes -> 1.2M / 850K
function fmtVol(n: number): string {
  if (!n) return '-';
  if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
  if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

// Market cap in crore -> ₹1.2L Cr / ₹8,500 Cr
function fmtCap(cr: number): string {
  if (cr >= 100000) return '₹' + (cr / 100000).toFixed(2) + 'L Cr';
  return '₹' + cr.toLocaleString('en-IN') + ' Cr';
}

// Shared theme-aware styles for the filter/select controls.
const CARD_CLS =
  'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900';
const LABEL_CLS =
  'mb-2 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400';
const SELECT_CLS =
  'block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200';

/**
 * The Ultra Scanner breakout dashboard. Theme-aware (light + dark) so it stays
 * consistent with the rest of the app, and stays mounted (state + fetched data
 * preserved) while the user switches to the IPO tab.
 */
export function StocksView() {
  const router = useRouter();
  const [data, setData] = useState<SignalRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<ScanStatus | null>(null);

  // Filters
  const [minMarketCapCr, setMinMarketCapCr] = useState<number>(5000);
  const [scoreFilter, setScoreFilter] = useState<number>(50);
  const [volRatioFilter, setVolRatioFilter] = useState<number>(0);
  const [volPeriod, setVolPeriod] = useState<string>('1m');
  const [minAvgVolume, setMinAvgVolume] = useState<number>(0);
  const [search, setSearch] = useState<string>('');

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        minScore: String(scoreFilter),
        minVolumeRatio: String(volRatioFilter),
        minMarketCapCr: String(minMarketCapCr),
        volPeriod,
        minAvgVolume: String(minAvgVolume),
      });
      if (search.trim()) params.set('search', search.trim());

      const response = await fetch(`/api/signals?${params.toString()}`);
      const output = await response.json();
      setData(Array.isArray(output) ? output : []);
    } catch (err) {
      console.error('Failed to pull signals.', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [scoreFilter, volRatioFilter, minMarketCapCr, volPeriod, minAvgVolume, search]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      setStatus(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  // Debounced refetch when filters change
  useEffect(() => {
    const t = setTimeout(fetchSignals, 250);
    return () => clearTimeout(t);
  }, [fetchSignals]);

  // Load dataset metadata (date / count) once.
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const freshness = getFreshness(status?.lastScanAt);

  return (
    <div className="bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Market indices strip — pinned at the very top of the Stocks page */}
      <MarketIndices asOf={freshness?.absolute} />

      <div className="p-6">
      {/* Top banner */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            ULTRA SCANNER
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Breakout discovery across every listed stock above ₹5,000 Cr market cap
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {freshness && (
            <div className="text-right text-xs text-slate-500 dark:text-slate-400">
              <div className="font-medium text-slate-700 dark:text-slate-300">{freshness.relative}</div>
              <div>Data as of {freshness.absolute}</div>
              <div>{status?.signalCount} signals in dataset</div>
            </div>
          )}
          <button
            onClick={fetchSignals}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Stale-data warning */}
      {freshness?.isStale && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            This data is {freshness.ageDays} days old — the latest end-of-day refresh hasn&apos;t run yet.
            Figures may not reflect the most recent market close.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className={CARD_CLS}>
          <label className={LABEL_CLS}>Min Market Cap</label>
          <select
            value={minMarketCapCr}
            onChange={(e) => setMinMarketCapCr(Number(e.target.value))}
            className={SELECT_CLS}
          >
            <option value={5000}>₹5,000 Cr+ (all eligible)</option>
            <option value={20000}>₹20,000 Cr+ (large mid)</option>
            <option value={50000}>₹50,000 Cr+ (large cap)</option>
            <option value={100000}>₹1L Cr+ (mega cap)</option>
          </select>
        </div>

        <div className={CARD_CLS}>
          <label className={LABEL_CLS}>Min Breakout Score</label>
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(Number(e.target.value))}
            className={SELECT_CLS}
          >
            <option value={85}>★ Strong Breakouts (&gt;=85)</option>
            <option value={70}>⚑ Active Watchlist (&gt;=70)</option>
            <option value={50}>All Monitored (&gt;=50)</option>
          </select>
        </div>

        <div className={CARD_CLS}>
          <label className={LABEL_CLS}>Volume Surge (today vs 1M)</label>
          <select
            value={volRatioFilter}
            onChange={(e) => setVolRatioFilter(Number(e.target.value))}
            className={SELECT_CLS}
          >
            <option value={0}>Any volume</option>
            <option value={1.5}>&gt; 1.5x</option>
            <option value={2.0}>&gt; 2.0x</option>
            <option value={3.0}>&gt; 3.0x Hyper</option>
          </select>
        </div>

        <div className={CARD_CLS}>
          <label className={LABEL_CLS}>Avg Volume Period / Min</label>
          <div className="flex gap-2">
            <select
              value={volPeriod}
              onChange={(e) => setVolPeriod(e.target.value)}
              className={SELECT_CLS + ' w-auto'}
            >
              <option value="1m">1M</option>
              <option value="2m">2M</option>
              <option value="3m">3M</option>
            </select>
            <select
              value={minAvgVolume}
              onChange={(e) => setMinAvgVolume(Number(e.target.value))}
              className={SELECT_CLS}
            >
              <option value={0}>Any liquidity</option>
              <option value={100000}>&gt; 1L shares/day</option>
              <option value={500000}>&gt; 5L shares/day</option>
              <option value={1000000}>&gt; 10L shares/day</option>
            </select>
          </div>
        </div>

        <div className={CARD_CLS + ' flex items-center justify-between'}>
          <div>
            <span className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Identified</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{data.length}</span>
            <span className="text-sm text-slate-500"> stocks</span>
          </div>
          <Layers className="h-8 w-8 text-slate-300 dark:text-slate-700" />
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symbol or company…"
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-100 text-[11px] uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-4 py-4">Symbol</th>
                <th className="px-4 py-4">Price</th>
                <th className="px-4 py-4">Change %</th>
                <th className="px-4 py-4">Market Cap</th>
                <th className="px-4 py-4">Resistance</th>
                <th className="px-4 py-4">Distance %</th>
                <th className="px-4 py-4">Avg Vol 1M</th>
                <th className="px-4 py-4">Avg Vol 2M</th>
                <th className="px-4 py-4">Avg Vol 3M</th>
                <th className="px-4 py-4">Vol Surge</th>
                <th className="px-4 py-4 text-center">Score</th>
                <th className="px-4 py-4 text-right">Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
                    Loading signals…
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    No breakouts match these filters. Try lowering the score or market-cap filter.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/stocks/${row.symbol}`)}
                    className="cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-300">
                      <div>{row.symbol}</div>
                      <div className="max-w-[160px] truncate text-[11px] font-normal text-slate-500">{row.company_name}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">₹{Number(row.current_price).toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono">
                      <span className={row.price_change_pct >= 0 ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {row.price_change_pct >= 0 ? '+' : ''}{Number(row.price_change_pct).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{fmtCap(row.market_cap_cr)}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">₹{Number(row.resistance_price).toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono">
                      <span className={`rounded px-2 py-0.5 text-xs ${row.distance_pct <= 2 && row.distance_pct >= -0.5 ? 'border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {Number(row.distance_pct).toFixed(2)}%
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-mono ${volPeriod === '1m' ? 'text-cyan-600 dark:text-cyan-300' : 'text-slate-500 dark:text-slate-400'}`}>{fmtVol(row.avg_volume_1m)}</td>
                    <td className={`px-4 py-3 font-mono ${volPeriod === '2m' ? 'text-cyan-600 dark:text-cyan-300' : 'text-slate-500 dark:text-slate-400'}`}>{fmtVol(row.avg_volume_2m)}</td>
                    <td className={`px-4 py-3 font-mono ${volPeriod === '3m' ? 'text-cyan-600 dark:text-cyan-300' : 'text-slate-500 dark:text-slate-400'}`}>{fmtVol(row.avg_volume_3m)}</td>
                    <td className="px-4 py-3 font-mono">
                      <span className={`font-semibold ${row.volume_ratio >= 2.0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {Number(row.volume_ratio).toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-block rounded-full border border-slate-200 bg-slate-100 px-3 py-1 font-mono font-bold text-emerald-600 dark:border-slate-800 dark:bg-slate-950 dark:text-emerald-400">
                        {row.breakout_score}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${
                        row.signal_type === 'STRONG_BUY' ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        row.signal_type === 'BREAKOUT_WATCH' ? 'border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                        'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {row.signal_type === 'STRONG_BUY' && <ArrowUpRight className="h-3.5 w-3.5" />}
                        {row.signal_type === 'BREAKOUT_WATCH' && <ShieldAlert className="h-3.5 w-3.5" />}
                        {row.signal_type.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500 dark:text-slate-600">
        Data: Yahoo Finance (end-of-day). Not investment advice — for research only.
      </p>
      </div>
    </div>
  );
}
