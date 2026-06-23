/**
 * Resolves our stream targets to Angel One instrument tokens (Phase 1).
 *
 * Stocks: NSE equity rows, symbol === `${SYMBOL}-EQ`.
 * Indices: matched by normalized display name within the right exchange
 *   segment, restricted to Angel's index token range (tokens starting "99",
 *   e.g. NIFTY 50 = 99926000, SENSEX = 99919000) to avoid colliding with
 *   equities/derivatives. Verified against Phase 0.
 *
 * Anything that doesn't resolve is reported (not thrown) — that symbol simply
 * won't get live data and the UI falls back to the daily snapshot.
 */
import { StreamTarget } from './dataset';
import { EXCHANGE } from '../../lib/smartapi';

const MASTER_URL =
  'https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json';

export interface ResolvedToken {
  key: string;
  kind: 'stock' | 'index';
  exchange: 'NSE' | 'BSE';
  exchangeType: number; // EXCHANGE.NSE / EXCHANGE.BSE
  token: string;
  prevClose: number | null;
  label: string;
}

export interface ResolveResult {
  resolved: ResolvedToken[];
  unresolved: string[];
}

const norm = (s: any) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Our index display name -> candidate Angel master display names. First match
// (by normalized comparison) within the index token range wins.
const INDEX_NAME_CANDIDATES: Record<string, string[]> = {
  'NIFTY 50': ['Nifty 50'],
  'NIFTY NEXT 50': ['Nifty Next 50'],
  'NIFTY BANK': ['Nifty Bank'],
  'NIFTY FIN SERVICES': ['Nifty Fin Service', 'Nifty Financial Services'],
  'NIFTY MIDCAP 100': ['Nifty Midcap 100'],
  'NIFTY SMALLCAP 100': ['NIFTY SMLCAP 100', 'Nifty Smallcap 100'],
  'NIFTY IT': ['Nifty IT'],
  'NIFTY AUTO': ['Nifty Auto'],
  'NIFTY PHARMA': ['Nifty Pharma'],
  'NIFTY FMCG': ['Nifty FMCG'],
  'NIFTY METAL': ['Nifty Metal'],
  'NIFTY REALTY': ['Nifty Realty'],
  SENSEX: ['SENSEX'],
  'BSE 100': ['BSE100', 'BSE 100'],
  'BSE 200': ['BSE200', 'BSE 200'],
  'BSE 500': ['BSE500', 'BSE 500'],
  'BSE MIDCAP': ['BSE MIDCAP', 'MIDCAP'],
  'BSE SMALLCAP': ['BSE SMLCAP', 'BSE SMALLCAP', 'SMLCAP'],
  'BSE BANKEX': ['BANKEX', 'BSE BANKEX'],
  'BSE IT': ['BSE IT', 'BSEIT'],
};

let masterCache: any[] | null = null;

/** Fetches (and memoizes) the Angel One instrument master. */
export async function loadMaster(force = false): Promise<any[]> {
  if (masterCache && !force) return masterCache;
  const res = await fetch(MASTER_URL);
  if (!res.ok) throw new Error(`instrument master fetch failed: HTTP ${res.status}`);
  masterCache = (await res.json()) as any[];
  return masterCache;
}

/** Resolves stocks + indices to tradable Angel tokens. Never throws on a miss. */
export async function resolveTokens(
  stocks: StreamTarget[],
  indices: StreamTarget[],
): Promise<ResolveResult> {
  const master = await loadMaster();
  const resolved: ResolvedToken[] = [];
  const unresolved: string[] = [];

  // --- Stocks: NSE equity, `${SYMBOL}-EQ` ---
  const nseEq = new Map<string, any>();
  for (const r of master) {
    if (r.exch_seg === 'NSE' && typeof r.symbol === 'string' && r.symbol.endsWith('-EQ')) {
      nseEq.set(r.symbol, r);
    }
  }
  for (const s of stocks) {
    const row = nseEq.get(`${s.symbol}-EQ`);
    if (row) {
      resolved.push({
        key: s.key, kind: 'stock', exchange: 'NSE', exchangeType: EXCHANGE.NSE,
        token: String(row.token), prevClose: s.prevClose, label: s.symbol,
      });
    } else {
      unresolved.push(`stock ${s.symbol}`);
    }
  }

  // --- Indices: normalized name match within the index token range ("99…") ---
  const idxSeg: Record<'NSE' | 'BSE', Map<string, any>> = { NSE: new Map(), BSE: new Map() };
  for (const r of master) {
    if ((r.exch_seg !== 'NSE' && r.exch_seg !== 'BSE') || !String(r.token).startsWith('99')) continue;
    const segMap = idxSeg[r.exch_seg as 'NSE' | 'BSE'];
    for (const field of [r.symbol, r.name]) {
      const k = norm(field);
      if (k && !segMap.has(k)) segMap.set(k, r);
    }
  }
  for (const idx of indices) {
    const candidates = INDEX_NAME_CANDIDATES[idx.symbol] || [idx.symbol];
    const segMap = idxSeg[idx.group];
    let row: any = null;
    for (const c of candidates) {
      row = segMap.get(norm(c));
      if (row) break;
    }
    if (row) {
      resolved.push({
        key: idx.key, kind: 'index', exchange: idx.group, exchangeType: EXCHANGE[idx.group],
        token: String(row.token), prevClose: idx.prevClose, label: idx.symbol,
      });
    } else {
      unresolved.push(`index ${idx.symbol}`);
    }
  }

  return { resolved, unresolved };
}
