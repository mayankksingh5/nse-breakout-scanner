import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import { yahoo } from '../lib/yahoo';
import { Signal, IndexQuote, HistoryBundle, HistoryPoint } from '../types';

/**
 * Detail-page enrichment, run as part of the publish step (where Yahoo is
 * reachable). Adds company fundamentals to each signal and writes a per-symbol
 * price-history file for every stock and index so the detail pages can render
 * charts without any live calls from the website.
 */

const CONCURRENCY = 6;
const FIVE_YEARS_MS = 5 * 365 * 24 * 60 * 60 * 1000;
const DAILY_POINTS = 252; // ~1 trading year, drives the 1W/1M/6M/1Y views

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (/delisted|not found|No data/i.test(err?.message || '')) throw err;
      if (i < attempts - 1) await sleep(400 * Math.pow(2, i));
    }
  }
  throw lastErr;
}

// Group daily points into one (last) close per calendar week.
function resampleWeekly(points: HistoryPoint[]): HistoryPoint[] {
  const out: HistoryPoint[] = [];
  let lastKey: number | null = null;
  for (const p of points) {
    const d = new Date(p[0] * 1000);
    const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
    const key = d.getUTCFullYear() * 100 + Math.floor((d.getTime() - yearStart) / (7 * 86_400_000));
    if (key !== lastKey) {
      out.push(p);
      lastKey = key;
    } else {
      out[out.length - 1] = p; // keep the latest close within the week
    }
  }
  return out;
}

async function buildBundle(yahooSymbol: string): Promise<HistoryBundle | null> {
  const period1 = new Date(Date.now() - FIVE_YEARS_MS - 7 * 86_400_000);
  const chart: any = await withRetry(() => yahoo.chart(yahooSymbol, { period1, interval: '1d' }));
  const points: HistoryPoint[] = (chart.quotes || [])
    .filter((q: any) => q.close != null && q.date != null)
    .map((q: any): HistoryPoint => [Math.floor(new Date(q.date).getTime() / 1000), Number(Number(q.close).toFixed(2))]);

  if (points.length === 0) return null;
  return {
    daily: points.slice(-DAILY_POINTS),
    weekly: resampleWeekly(points),
  };
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Mutates `signals` (adds sector/industry/description) and writes a history
 * file per stock and per index into `historyDir`.
 */
export async function enrichAndWriteHistories(
  signals: Signal[],
  indices: IndexQuote[],
  historyDir: string,
): Promise<void> {
  ensureDir(historyDir);
  const limit = pLimit(CONCURRENCY);

  // 1) Company fundamentals for each signal (sector / industry / description).
  let profiled = 0;
  await Promise.all(
    signals.map((s) =>
      limit(async () => {
        try {
          const res: any = await withRetry(() =>
            yahoo.quoteSummary(`${s.symbol}.NS`, { modules: ['assetProfile'] }),
          );
          const p = res?.assetProfile;
          if (p) {
            s.sector = p.sector || undefined;
            s.industry = p.industry || undefined;
            s.description = p.longBusinessSummary || undefined;
            profiled++;
          }
        } catch {
          /* leave fundamentals undefined for this stock */
        }
      }),
    ),
  );
  console.log(`[enrich] fundamentals for ${profiled}/${signals.length} stocks`);

  // 2) Price-history files for every stock and index.
  const items: { key: string; yahoo: string }[] = [
    ...signals.map((s) => ({ key: s.symbol, yahoo: `${s.symbol}.NS` })),
    ...indices.map((i) => ({ key: i.slug, yahoo: i.symbol })),
  ];

  let written = 0;
  await Promise.all(
    items.map((it) =>
      limit(async () => {
        try {
          const bundle = await buildBundle(it.yahoo);
          if (!bundle) return;
          fs.writeFileSync(path.join(historyDir, `${it.key}.json`), JSON.stringify(bundle));
          written++;
        } catch (err: any) {
          console.warn(`[enrich] history failed for ${it.key}: ${err?.message || err}`);
        }
      }),
    ),
  );
  console.log(`[enrich] wrote ${written}/${items.length} history files to ${historyDir}`);
}
