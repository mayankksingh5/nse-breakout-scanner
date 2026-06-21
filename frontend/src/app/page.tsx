"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpRight, ShieldAlert, RefreshCw, Layers, Search, Activity } from 'lucide-react';

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
  running: boolean;
  lastScanAt: string | null;
  lastScanMs: number | null;
  universeCount: number;
  passedMarketCap: number;
  signalCount: number;
  error: string | null;
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

export default function Dashboard() {
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

  // Poll scan status every 5s so progress shows while a scan runs
  useEffect(() => {
    fetchStatus();
    const i = setInterval(fetchStatus, 5000);
    return () => clearInterval(i);
  }, [fetchStatus]);

  const triggerScan = async () => {
    await fetch('/api/status', { method: 'POST' });
    fetchStatus();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 font-sans">
      {/* Top banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-emerald-400">
            ALPHA-SCANNER <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">NSE INDIA</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Breakout discovery across every NSE stock above ₹5,000 Cr market cap</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {status?.lastScanAt && (
            <div className="text-xs text-slate-500 text-right">
              <div>Last scan: {new Date(status.lastScanAt).toLocaleString('en-IN')}</div>
              <div>{status.passedMarketCap} stocks scanned · {status.signalCount} signals</div>
            </div>
          )}
          <button
            onClick={triggerScan}
            disabled={status?.running}
            className="flex items-center gap-2 bg-emerald-900/40 border border-emerald-700 hover:bg-emerald-800/50 disabled:opacity-50 px-4 py-2 rounded-lg text-sm transition text-emerald-300"
          >
            <Activity className={`w-4 h-4 ${status?.running ? 'animate-pulse' : ''}`} />
            {status?.running ? 'Scanning…' : 'Run Full Scan'}
          </button>
          <button
            onClick={fetchSignals}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {status?.running && (
        <div className="mb-4 text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-lg px-4 py-2">
          Scan in progress — pulling live data from Yahoo Finance. Results will refresh automatically.
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <label className="text-xs text-slate-400 block mb-2 uppercase font-semibold">Min Market Cap</label>
          <select
            value={minMarketCapCr}
            onChange={(e) => setMinMarketCapCr(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 text-sm rounded-lg block w-full p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value={5000}>₹5,000 Cr+ (all eligible)</option>
            <option value={20000}>₹20,000 Cr+ (large mid)</option>
            <option value={50000}>₹50,000 Cr+ (large cap)</option>
            <option value={100000}>₹1L Cr+ (mega cap)</option>
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <label className="text-xs text-slate-400 block mb-2 uppercase font-semibold">Min Breakout Score</label>
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 text-sm rounded-lg block w-full p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value={85}>★ Strong Breakouts (&gt;=85)</option>
            <option value={70}>⚑ Active Watchlist (&gt;=70)</option>
            <option value={50}>All Monitored (&gt;=50)</option>
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <label className="text-xs text-slate-400 block mb-2 uppercase font-semibold">Volume Surge (today vs 1M)</label>
          <select
            value={volRatioFilter}
            onChange={(e) => setVolRatioFilter(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 text-sm rounded-lg block w-full p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value={0}>Any volume</option>
            <option value={1.5}>&gt; 1.5x</option>
            <option value={2.0}>&gt; 2.0x</option>
            <option value={3.0}>&gt; 3.0x Hyper</option>
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <label className="text-xs text-slate-400 block mb-2 uppercase font-semibold">Avg Volume Period / Min</label>
          <div className="flex gap-2">
            <select
              value={volPeriod}
              onChange={(e) => setVolPeriod(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-sm rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="1m">1M</option>
              <option value="2m">2M</option>
              <option value="3m">3M</option>
            </select>
            <select
              value={minAvgVolume}
              onChange={(e) => setMinAvgVolume(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-sm rounded-lg p-2.5 text-slate-200 w-full focus:outline-none focus:border-emerald-500"
            >
              <option value={0}>Any liquidity</option>
              <option value={100000}>&gt; 1L shares/day</option>
              <option value={500000}>&gt; 5L shares/day</option>
              <option value={1000000}>&gt; 10L shares/day</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block uppercase font-semibold">Identified</span>
            <span className="text-2xl font-bold text-slate-100">{data.length}</span>
            <span className="text-slate-500 text-sm"> stocks</span>
          </div>
          <Layers className="w-8 h-8 text-slate-700" />
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symbol or company…"
          className="bg-slate-900 border border-slate-800 text-sm rounded-lg w-full pl-9 pr-3 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] tracking-wider border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading signals…
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-slate-500">
                    No breakouts match these filters. {status?.lastScanAt ? '' : 'Try “Run Full Scan” to fetch live data.'}
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      <div>{row.symbol}</div>
                      <div className="text-[11px] font-normal text-slate-500 truncate max-w-[160px]">{row.company_name}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">₹{Number(row.current_price).toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono">
                      <span className={row.price_change_pct >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400'}>
                        {row.price_change_pct >= 0 ? '+' : ''}{Number(row.price_change_pct).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{fmtCap(row.market_cap_cr)}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">₹{Number(row.resistance_price).toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono">
                      <span className={`px-2 py-0.5 rounded text-xs ${row.distance_pct <= 2 && row.distance_pct >= -0.5 ? 'bg-amber-950 text-amber-400 border border-amber-900' : 'text-slate-400'}`}>
                        {Number(row.distance_pct).toFixed(2)}%
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-mono ${volPeriod === '1m' ? 'text-cyan-300' : 'text-slate-400'}`}>{fmtVol(row.avg_volume_1m)}</td>
                    <td className={`px-4 py-3 font-mono ${volPeriod === '2m' ? 'text-cyan-300' : 'text-slate-400'}`}>{fmtVol(row.avg_volume_2m)}</td>
                    <td className={`px-4 py-3 font-mono ${volPeriod === '3m' ? 'text-cyan-300' : 'text-slate-400'}`}>{fmtVol(row.avg_volume_3m)}</td>
                    <td className="px-4 py-3 font-mono">
                      <span className={`font-semibold ${row.volume_ratio >= 2.0 ? 'text-cyan-400' : 'text-slate-300'}`}>
                        {Number(row.volume_ratio).toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-block px-3 py-1 bg-slate-950 rounded-full border border-slate-800 font-mono font-bold text-emerald-400">
                        {row.breakout_score}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md ${
                        row.signal_type === 'STRONG_BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        row.signal_type === 'BREAKOUT_WATCH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {row.signal_type === 'STRONG_BUY' && <ArrowUpRight className="w-3.5 h-3.5" />}
                        {row.signal_type === 'BREAKOUT_WATCH' && <ShieldAlert className="w-3.5 h-3.5" />}
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

      <p className="text-xs text-slate-600 mt-4">
        Data: Yahoo Finance (end-of-day). Not investment advice — for research only.
      </p>
    </div>
  );
}
