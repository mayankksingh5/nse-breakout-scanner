import dataset from '@/data/signals.json';
import type { StockSignal, IndexQuote } from '@/types/market';

// The committed dataset, typed for the detail pages.
const data = dataset as unknown as {
  lastScanAt?: string;
  signals?: StockSignal[];
  indices?: IndexQuote[];
};

export const ALL_SIGNALS: StockSignal[] = data.signals ?? [];
export const ALL_INDICES: IndexQuote[] = data.indices ?? [];
export const LAST_SCAN_AT: string | null = data.lastScanAt ?? null;

const SIGNAL_BY_SYMBOL = new Map(ALL_SIGNALS.map((s) => [s.symbol.toUpperCase(), s]));
const INDEX_BY_SLUG = new Map(ALL_INDICES.map((i) => [i.slug, i]));

export function getSignal(symbol: string): StockSignal | undefined {
  return SIGNAL_BY_SYMBOL.get(symbol.toUpperCase());
}

export function getIndex(slug: string): IndexQuote | undefined {
  return INDEX_BY_SLUG.get(slug);
}
