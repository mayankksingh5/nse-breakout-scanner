/** Shared types for the Stocks + Market Indices detail experience. */

export type SignalType = 'STRONG_BUY' | 'BREAKOUT_WATCH' | 'MONITOR' | 'IGNORE';

export interface StockSignal {
  id: string;
  symbol: string;
  company_name: string;
  market_cap_cr: number;
  current_price: number;
  price_change_pct: number;
  resistance_price: number;
  distance_pct: number;
  current_volume: number;
  avg_volume_1m: number;
  avg_volume_2m: number;
  avg_volume_3m: number;
  volume_ratio: number;
  breakout_score: number;
  signal_type: SignalType;
  // detail fields (optional — present once enriched)
  open?: number;
  high?: number;
  low?: number;
  prev_close?: number;
  week52_high?: number;
  week52_low?: number;
  pe?: number;
  eps?: number;
  volume?: number;
  sector?: string;
  industry?: string;
  description?: string;
}

export interface IndexQuote {
  name: string;
  slug: string;
  symbol: string;
  group: 'NSE' | 'BSE';
  value: number;
  change: number;
  change_pct: number;
  open?: number;
  high?: number;
  low?: number;
  prev_close?: number;
  week52_high?: number;
  week52_low?: number;
}

/** A point on a price series: [epochSeconds, close]. */
export type HistoryPoint = [number, number];

export interface HistoryBundle {
  daily: HistoryPoint[];
  weekly: HistoryPoint[];
}
