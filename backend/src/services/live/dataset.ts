/**
 * Reads the committed daily snapshot to decide WHAT to stream live (Phase 1).
 *
 * The live hub overlays real-time LTP onto the exact symbols + indices the
 * frontend already shows, so the stream targets come straight from
 * signals.json. We also carry each row's prev_close so the hub can compute
 * change% locally (live LTP vs the snapshot's previous close).
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface StreamTarget {
  key: string;                 // signal symbol (stock) or index slug
  kind: 'stock' | 'index';
  symbol: string;              // NSE symbol (stock) or display name (index)
  group: 'NSE' | 'BSE';
  prevClose: number | null;    // for change math
}

export interface DatasetTargets {
  lastScanAt: string | null;
  stocks: StreamTarget[];
  indices: StreamTarget[];
}

/** Where the committed dataset lives. Override with DATASET_PATH on the host. */
function datasetPath(): string {
  return (
    process.env.DATASET_PATH ||
    resolve(__dirname, '../../../../frontend/src/data/signals.json')
  );
}

/** Derives previous close, preferring the explicit field, else current/change%. */
function prevCloseOf(prevClose: any, current: any, changePct: any): number | null {
  if (prevClose != null) return Number(prevClose);
  if (current != null && changePct != null) {
    const denom = 1 + Number(changePct) / 100;
    if (denom !== 0) return Number((Number(current) / denom).toFixed(2));
  }
  return null;
}

/** Loads the stream targets (stocks + indices) from the snapshot on disk. */
export function loadStreamTargets(): DatasetTargets {
  const path = datasetPath();
  const data = JSON.parse(readFileSync(path, 'utf8'));

  const stocks: StreamTarget[] = (data.signals || []).map((s: any) => ({
    key: s.symbol,
    kind: 'stock' as const,
    symbol: s.symbol,
    group: 'NSE' as const,
    prevClose: prevCloseOf(s.prev_close, s.current_price, s.price_change_pct),
  }));

  const indices: StreamTarget[] = (data.indices || []).map((i: any) => ({
    key: i.slug,
    kind: 'index' as const,
    symbol: i.name,
    group: (i.group as 'NSE' | 'BSE') ?? 'NSE',
    prevClose: prevCloseOf(i.prev_close, i.value, i.change_pct),
  }));

  return { lastScanAt: data.lastScanAt ?? null, stocks, indices };
}
