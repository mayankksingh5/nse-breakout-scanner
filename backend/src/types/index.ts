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

export interface OptimizationMetrics {
  currentPrice: number;
  priceChangePct: number;
  currentVolume: number;
  avgVolume30d: number;
  avgVolume90d: number;
  volumeRatio: number;
}