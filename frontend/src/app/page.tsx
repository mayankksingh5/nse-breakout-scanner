"use client";

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ShieldAlert, RefreshCw, Layers } from 'lucide-react';

interface SignalRow {
  id: string;
  symbol: string;
  company_name: string;
  current_price: number;
  resistance_price: number;
  distance_pct: number;
  price_change_pct: number;
  current_volume: number;
  avg_volume_30d: number;
  volume_ratio: number;
  prev_resistance_volume: number;
  breakout_score: number;
  signal_type: 'STRONG_BUY' | 'BREAKOUT_WATCH' | 'MONITOR' | 'IGNORE';
}

export default function Dashboard() {
  const [data, setData] = useState<SignalRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [universe, setUniverse] = useState<string>('nifty500');
  const [scoreFilter, setScoreFilter] = useState<number>(70);
  const [volRatioFilter, setVolRatioFilter] = useState<number>(1.5);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/signals?minScore=${scoreFilter}&minVolumeRatio=${volRatioFilter}`);
      const output = await response.json();
      // Safe boundary check: ensuring output is always an array
      if (Array.isArray(output)) {
        setData(output);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Failed to pull analytical signals data frame.", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, [universe, scoreFilter, volRatioFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 font-sans">
      {/* Top Banner Control Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-emerald-400">
            ALPHA-SCANNER <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">NSE INDIA</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Institutional Breakout Discovery & Multi-factor Quant Filter System</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={fetchSignals} 
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync Live
          </button>
        </div>
      </div>

      {/* Grid Filter Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <label className="text-xs text-slate-400 block mb-2 uppercase font-semibold">Market Segment Universe</label>
          <select 
            value={universe} 
            onChange={(e) => setUniverse(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-sm rounded-lg block w-full p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Entire NSE Market</option>
            <option value="nifty500">NIFTY 500 Index</option>
            <option value="watchlist">Custom Watchlist (200)</option>
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
            <option value={50}>All Monitored Assets (&gt;=50)</option>
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <label className="text-xs text-slate-400 block mb-2 uppercase font-semibold">Volume Surge Factor</label>
          <select 
            value={volRatioFilter} 
            onChange={(e) => setVolRatioFilter(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 text-sm rounded-lg block w-full p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value={1.5}>&gt; 1.5x Volume</option>
            <option value={2.0}>&gt; 2.0x Volume Surge</option>
            <option value={3.0}>&gt; 3.0x Hyper Expansion</option>
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block uppercase font-semibold">Identified Assets</span>
            <span className="text-2xl font-bold text-slate-100">{(data && data.length) || 0} Stocks</span>
          </div>
          <Layers className="w-8 h-8 text-slate-700" />
        </div>
      </div>

      {/* Main Quantitative Matrix Table View */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Symbol</th>
                <th className="px-6 py-4">Current Price</th>
                <th className="px-6 py-4">Resistance Level</th>
                <th className="px-6 py-4">Distance %</th>
                <th className="px-6 py-4">Price Change %</th>
                <th className="px-6 py-4">Volume Ratio</th>
                <th className="px-6 py-4 text-center">Score</th>
                <th className="px-6 py-4 text-right">Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Compiling quantitative variance data frames...
                  </td>
                </tr>
              ) : (!data || data.length === 0) ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    No active breakout matrices detected matching active filters.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-200">
                      <div>{row.symbol}</div>
                      <div className="text-[11px] font-normal text-slate-500 truncate max-w-[180px]">{row.company_name}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium">₹{Number(row.current_price).toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono text-slate-300">₹{Number(row.resistance_price).toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono">
                      <span className={`px-2 py-0.5 rounded text-xs ${row.distance_pct <= 2 ? 'bg-amber-950 text-amber-400 border border-amber-900' : 'text-slate-400'}`}>
                        {Number(row.distance_pct).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <span className={row.price_change_pct >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400'}>
                        {row.price_change_pct >= 0 ? '+' : ''}{Number(row.price_change_pct).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <span className={`font-semibold ${row.volume_ratio >= 2.0 ? 'text-cyan-400' : 'text-slate-300'}`}>
                        {Number(row.volume_ratio).toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-block px-3 py-1 bg-slate-950 rounded-full border border-slate-800 font-mono font-bold text-emerald-400">
                        {row.breakout_score}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
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
    </div>
  );
}