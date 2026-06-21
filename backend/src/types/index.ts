export interface OHLCV {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ResistanceLevel {
  price: number;
  type: 'SWING_HIGH' | 'PSYCHOLOGICAL';
  peakDate?: Date;
  peakVolume?: number;
}

export interface VolumeMetrics {
  currentPrice: number;
  priceChangePct: number;
  currentVolume: number;
  avgVolume1m: number; // ~21 trading days
  avgVolume2m: number; // ~42 trading days
  avgVolume3m: number; // ~63 trading days
  volumeRatio1m: number; // today's volume / 1-month average
}

export type SignalType = 'STRONG_BUY' | 'BREAKOUT_WATCH' | 'MONITOR' | 'IGNORE';

// One row as served to the dashboard.
export interface Signal {
  id: string;
  symbol: string;
  company_name: string;
  market_cap: number;        // absolute rupees
  market_cap_cr: number;     // crore (for display)
  current_price: number;
  price_change_pct: number;
  resistance_price: number;
  distance_pct: number;
  current_volume: number;
  avg_volume_1m: number;
  avg_volume_2m: number;
  avg_volume_3m: number;
  volume_ratio: number;      // today vs 1-month avg
  breakout_score: number;
  signal_type: SignalType;
}
