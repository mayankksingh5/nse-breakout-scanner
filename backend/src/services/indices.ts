import { yahoo } from '../lib/yahoo';
import { IndexQuote } from '../types';

/** URL slug for an index, e.g. "NIFTY 50" -> "nifty-50". */
export function indexSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * The market indices shown at the top of the Stocks page. Symbols were verified
 * against Yahoo Finance (the same source the stock scan uses), so they refresh
 * automatically as part of the daily scan pipeline.
 */
export const INDICES: { name: string; symbol: string; group: 'NSE' | 'BSE' }[] = [
  // NSE
  { name: 'NIFTY 50', symbol: '^NSEI', group: 'NSE' },
  { name: 'NIFTY NEXT 50', symbol: '^NSMIDCP', group: 'NSE' },
  { name: 'NIFTY BANK', symbol: '^NSEBANK', group: 'NSE' },
  { name: 'NIFTY FIN SERVICES', symbol: 'NIFTY_FIN_SERVICE.NS', group: 'NSE' },
  { name: 'NIFTY MIDCAP 100', symbol: 'NIFTY_MIDCAP_100.NS', group: 'NSE' },
  { name: 'NIFTY SMALLCAP 100', symbol: '^CNXSC', group: 'NSE' },
  { name: 'NIFTY IT', symbol: '^CNXIT', group: 'NSE' },
  { name: 'NIFTY AUTO', symbol: '^CNXAUTO', group: 'NSE' },
  { name: 'NIFTY PHARMA', symbol: '^CNXPHARMA', group: 'NSE' },
  { name: 'NIFTY FMCG', symbol: '^CNXFMCG', group: 'NSE' },
  { name: 'NIFTY METAL', symbol: '^CNXMETAL', group: 'NSE' },
  { name: 'NIFTY REALTY', symbol: '^CNXREALTY', group: 'NSE' },
  // BSE
  { name: 'SENSEX', symbol: '^BSESN', group: 'BSE' },
  { name: 'BSE 100', symbol: 'BSE-100.BO', group: 'BSE' },
  { name: 'BSE 200', symbol: 'BSE-200.BO', group: 'BSE' },
  { name: 'BSE 500', symbol: 'BSE-500.BO', group: 'BSE' },
  { name: 'BSE MIDCAP', symbol: 'BSE-MIDCAP.BO', group: 'BSE' },
  { name: 'BSE SMALLCAP', symbol: 'BSE-SMLCAP.BO', group: 'BSE' },
  { name: 'BSE BANKEX', symbol: 'BSE-BANK.BO', group: 'BSE' },
  { name: 'BSE IT', symbol: 'BSE-IT.BO', group: 'BSE' },
];

/**
 * Fetches the latest level/change for every configured index in one batched
 * Yahoo quote call. Never throws — on failure it returns whatever it got (or an
 * empty list), so an index hiccup can't break the stock scan.
 */
export async function fetchIndices(): Promise<IndexQuote[]> {
  const symbols = INDICES.map((i) => i.symbol);
  const out: IndexQuote[] = [];

  try {
    const quotes = await yahoo.quote(symbols);
    const list = Array.isArray(quotes) ? quotes : [quotes];
    const bySymbol = new Map(list.map((q: any) => [q.symbol, q]));

    for (const idx of INDICES) {
      const q: any = bySymbol.get(idx.symbol);
      if (!q || q.regularMarketPrice == null) {
        console.warn(`[indices] no quote for ${idx.name} (${idx.symbol})`);
        continue;
      }
      const num = (v: any) => (v == null ? undefined : Number(Number(v).toFixed(2)));
      out.push({
        name: idx.name,
        slug: indexSlug(idx.name),
        symbol: idx.symbol,
        group: idx.group,
        value: Number(Number(q.regularMarketPrice).toFixed(2)),
        change: Number(Number(q.regularMarketChange ?? 0).toFixed(2)),
        change_pct: Number(Number(q.regularMarketChangePercent ?? 0).toFixed(2)),
        open: num(q.regularMarketOpen),
        high: num(q.regularMarketDayHigh),
        low: num(q.regularMarketDayLow),
        prev_close: num(q.regularMarketPreviousClose),
        week52_high: num(q.fiftyTwoWeekHigh),
        week52_low: num(q.fiftyTwoWeekLow),
      });
    }
    console.log(`[indices] fetched ${out.length}/${INDICES.length} indices`);
  } catch (err: any) {
    console.error('[indices] fetch failed:', err?.message || err);
  }

  return out;
}
