import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import { yahoo } from '../lib/yahoo';
import { getUniverse, UniverseStock } from './universe';
import { QuantEngine } from './QuantEngine';
import { OHLCV, Signal, IndexQuote } from '../types';
import { AlertManager } from './AlertManager';
import { fetchIndices } from './indices';

const ONE_CRORE = 10_000_000; // 1 crore = 10^7
const MIN_MARKET_CAP_CR = Number(process.env.MIN_MARKET_CAP_CR || 5000);
const MIN_MARKET_CAP = MIN_MARKET_CAP_CR * ONE_CRORE;

const QUOTE_BATCH = 50;        // symbols per Yahoo quote() call
const HISTORY_CONCURRENCY = 6; // parallel chart() requests
const HISTORY_DAYS = 130;      // calendar days of daily candles to pull (~90 trading days)
const ALERT_SCORE = 85;        // dispatch alert at/above this score

const DATA_DIR = path.join(process.cwd(), 'data');
const SIGNALS_FILE = path.join(DATA_DIR, 'signals.json');

export interface ScanState {
  running: boolean;
  lastScanAt: string | null;
  lastScanMs: number | null;
  universeCount: number;
  passedMarketCap: number;
  scannedCount: number;
  signalCount: number;
  error: string | null;
}

const state: ScanState = {
  running: false,
  lastScanAt: null,
  lastScanMs: null,
  universeCount: 0,
  passedMarketCap: 0,
  scannedCount: 0,
  signalCount: 0,
  error: null,
};

let signals: Signal[] = [];
let indices: IndexQuote[] = [];

// ---- persistence so a server restart keeps the last scan ---------------------

function loadPersisted() {
  try {
    if (fs.existsSync(SIGNALS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(SIGNALS_FILE, 'utf-8'));
      if (Array.isArray(raw.signals)) signals = raw.signals;
      if (Array.isArray(raw.indices)) indices = raw.indices;
      if (raw.lastScanAt) state.lastScanAt = raw.lastScanAt;
      state.signalCount = signals.length;
      console.log(`[scanner] restored ${signals.length} signals from disk`);
    }
  } catch (err) {
    console.error('[scanner] failed to load persisted signals:', err);
  }
}

function persist() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
      SIGNALS_FILE,
      JSON.stringify({ lastScanAt: state.lastScanAt, signals, indices }),
      'utf-8'
    );
  } catch (err) {
    console.error('[scanner] failed to persist signals:', err);
  }
}

loadPersisted();

// ---- helpers -----------------------------------------------------------------

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

interface QuoteInfo {
  stock: UniverseStock;
  marketCap: number;
  price: number;
  volume: number;
  // Extra point-in-time fields for the stock detail page (free from the quote).
  open?: number;
  high?: number;
  low?: number;
  prevClose?: number;
  week52High?: number;
  week52Low?: number;
  pe?: number;
  eps?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Retry a Yahoo call a few times with exponential backoff. Yahoo occasionally
// rate-limits or returns transient errors, especially from cloud IPs.
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 500): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      // A genuine "delisted / no data" is not worth retrying.
      if (/delisted|not found|No data/i.test(err?.message || '')) throw err;
      if (i < attempts - 1) await sleep(baseMs * Math.pow(2, i));
    }
  }
  throw lastErr;
}

// Step 1: batched quotes -> market cap filter.
async function fetchMarketCaps(universe: UniverseStock[]): Promise<QuoteInfo[]> {
  const bySymbol = new Map(universe.map((s) => [s.yahooSymbol, s]));
  const passed: QuoteInfo[] = [];
  const batches = chunk(universe, QUOTE_BATCH);

  for (let b = 0; b < batches.length; b++) {
    const symbols = batches[b].map((s) => s.yahooSymbol);
    try {
      const quotes = await withRetry(() => yahoo.quote(symbols));
      const list = Array.isArray(quotes) ? quotes : [quotes];
      for (const q of list) {
        const stock = bySymbol.get(q.symbol as string);
        const marketCap = (q.marketCap as number) || 0;
        if (!stock || marketCap < MIN_MARKET_CAP) continue;
        const num = (v: any) => (v == null ? undefined : Number(Number(v).toFixed(2)));
        passed.push({
          stock,
          marketCap,
          price: (q.regularMarketPrice as number) || 0,
          volume: (q.regularMarketVolume as number) || 0,
          open: num(q.regularMarketOpen),
          high: num(q.regularMarketDayHigh),
          low: num(q.regularMarketDayLow),
          prevClose: num(q.regularMarketPreviousClose),
          week52High: num(q.fiftyTwoWeekHigh),
          week52Low: num(q.fiftyTwoWeekLow),
          pe: num(q.trailingPE),
          eps: num(q.epsTrailingTwelveMonths),
        });
      }
    } catch (err: any) {
      console.error(`[scanner] quote batch ${b + 1}/${batches.length} failed:`, err.message);
    }
    if ((b + 1) % 10 === 0) {
      console.log(`[scanner] market-cap scan ${b + 1}/${batches.length} batches, ${passed.length} passed`);
    }
  }
  return passed;
}

// Step 2: history -> metrics -> score for one stock.
async function analyze(info: QuoteInfo): Promise<Signal | null> {
  const period1 = new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000);
  let history: OHLCV[];
  try {
    const chart: any = await withRetry(() => yahoo.chart(info.stock.yahooSymbol, { period1, interval: '1d' }));
    history = (chart.quotes || [])
      .filter((q: any) => q.close != null && q.high != null && q.volume != null)
      .map((q: any) => ({
        date: new Date(q.date),
        open: q.open ?? q.close!,
        high: q.high!,
        low: q.low ?? q.close!,
        close: q.close!,
        volume: q.volume!,
      }));
  } catch (err: any) {
    return null;
  }

  if (history.length < 25) return null; // not enough data to be meaningful

  const today = history[history.length - 1];
  const yesterday = history[history.length - 2];

  const metrics = QuantEngine.calculateVolumeMetrics(
    history,
    today.close,
    yesterday.close,
    today.volume
  );

  const levels = QuantEngine.calculateResistanceLevels(history, today.close);
  const resistance = QuantEngine.pickResistance(levels, today.close);
  if (!resistance) return null;

  const { score, signal } = QuantEngine.evaluateBreakout(metrics, resistance);
  if (signal === 'IGNORE') return null; // below the MONITOR threshold (score < 50)

  const distancePct = ((resistance.price - today.close) / resistance.price) * 100;

  return {
    id: info.stock.symbol,
    symbol: info.stock.symbol,
    company_name: info.stock.name,
    market_cap: info.marketCap,
    market_cap_cr: Math.round(info.marketCap / ONE_CRORE),
    current_price: Number(today.close.toFixed(2)),
    price_change_pct: Number(metrics.priceChangePct.toFixed(2)),
    resistance_price: Number(resistance.price.toFixed(2)),
    distance_pct: Number(distancePct.toFixed(2)),
    current_volume: metrics.currentVolume,
    avg_volume_1m: metrics.avgVolume1m,
    avg_volume_2m: metrics.avgVolume2m,
    avg_volume_3m: metrics.avgVolume3m,
    volume_ratio: Number(metrics.volumeRatio1m.toFixed(2)),
    breakout_score: score,
    signal_type: signal,
    open: info.open,
    high: info.high,
    low: info.low,
    prev_close: info.prevClose,
    week52_high: info.week52High,
    week52_low: info.week52Low,
    pe: info.pe,
    eps: info.eps,
    volume: info.volume || metrics.currentVolume,
  };
}

// ---- public API --------------------------------------------------------------

export function getSignals(): Signal[] {
  return signals;
}

export function getIndices(): IndexQuote[] {
  return indices;
}

export function getState(): ScanState {
  return state;
}

/**
 * Full scan: universe -> market-cap filter -> per-stock analysis -> score.
 * Returns when complete. Guards against concurrent runs.
 */
export async function runScan(forceUniverseRefresh = false): Promise<ScanState> {
  if (state.running) {
    console.log('[scanner] scan already running, ignoring trigger');
    return state;
  }

  state.running = true;
  state.error = null;
  const start = Date.now();

  try {
    const universe = await getUniverse(forceUniverseRefresh);
    state.universeCount = universe.length;
    console.log(`[scanner] scanning ${universe.length} stocks (min market cap ₹${MIN_MARKET_CAP_CR} cr)`);

    const passed = await fetchMarketCaps(universe);
    state.passedMarketCap = passed.length;
    console.log(`[scanner] ${passed.length} stocks above market-cap floor; pulling history...`);

    const limit = pLimit(HISTORY_CONCURRENCY);
    let done = 0;
    const results = await Promise.all(
      passed.map((info) =>
        limit(async () => {
          const sig = await analyze(info);
          done++;
          if (done % 50 === 0) console.log(`[scanner] analyzed ${done}/${passed.length}`);
          return sig;
        })
      )
    );

    const fresh = results.filter((s): s is Signal => s !== null);
    fresh.sort((a, b) => b.breakout_score - a.breakout_score);

    signals = fresh;

    // Pull the market indices for the dashboard's top strip. Isolated so an
    // index failure never aborts the (much more expensive) stock scan.
    try {
      indices = await fetchIndices();
    } catch (err: any) {
      console.error('[scanner] index fetch failed:', err?.message || err);
    }

    state.scannedCount = passed.length;
    state.signalCount = fresh.length;
    state.lastScanAt = new Date().toISOString();
    state.lastScanMs = Date.now() - start;
    persist();

    console.log(
      `[scanner] done: ${fresh.length} signals in ${(state.lastScanMs / 1000).toFixed(1)}s`
    );

    // Fire alerts for the strongest fresh breakouts.
    for (const s of fresh) {
      if (s.breakout_score >= ALERT_SCORE) {
        AlertManager.dispatch({
          symbol: s.symbol,
          type: s.signal_type,
          score: s.breakout_score,
          message: `${s.company_name} @ ₹${s.current_price} | ${s.volume_ratio}x vol | resistance ₹${s.resistance_price}`,
        });
      }
    }
  } catch (err: any) {
    state.error = err.message;
    console.error('[scanner] scan failed:', err);
  } finally {
    state.running = false;
  }

  return state;
}
