import axios from 'axios';
import fs from 'fs';
import path from 'path';

// One entry per tradable NSE stock (the "universe" we scan).
export interface UniverseStock {
  symbol: string;       // NSE symbol, e.g. "RELIANCE"
  yahooSymbol: string;  // Yahoo ticker, e.g. "RELIANCE.NS"
  name: string;         // Company name
}

const NSE_EQUITY_LIST_URL =
  'https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv';

const DATA_DIR = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(DATA_DIR, 'universe.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // refresh the symbol list once a day

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Parse the NSE EQUITY_L.csv into our universe shape.
// We keep only the regular "EQ" series (normal equity), dropping bonds, ETFs etc.
function parseCsv(csv: string): UniverseStock[] {
  const lines = csv.trim().split(/\r?\n/);
  const stocks: UniverseStock[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 3) continue;

    const symbol = cols[0].trim();
    const name = cols[1].trim();
    const series = cols[2].trim();

    if (series !== 'EQ') continue;
    if (!symbol) continue;

    stocks.push({
      symbol,
      yahooSymbol: `${symbol}.NS`,
      name,
    });
  }

  return stocks;
}

function readCache(): UniverseStock[] | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    const stat = fs.statSync(CACHE_FILE);
    if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) return null;
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as UniverseStock[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(stocks: UniverseStock[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(stocks), 'utf-8');
  } catch (err) {
    console.error('[universe] failed to write cache:', err);
  }
}

/**
 * Returns the full list of NSE EQ-series stocks.
 * Uses a 1-day file cache so we don't hammer NSE on every scan.
 */
export async function getUniverse(forceRefresh = false): Promise<UniverseStock[]> {
  if (!forceRefresh) {
    const cached = readCache();
    if (cached) {
      console.log(`[universe] using cached list (${cached.length} stocks)`);
      return cached;
    }
  }

  console.log('[universe] downloading fresh NSE equity list...');
  const res = await axios.get<string>(NSE_EQUITY_LIST_URL, {
    timeout: 30000,
    responseType: 'text',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      Accept: 'text/csv,*/*',
    },
  });

  const stocks = parseCsv(res.data);
  if (stocks.length === 0) {
    // Don't overwrite a good cache with an empty result.
    const cached = readCache();
    if (cached) return cached;
    throw new Error('NSE equity list returned no usable rows');
  }

  writeCache(stocks);
  console.log(`[universe] loaded ${stocks.length} EQ-series stocks`);
  return stocks;
}
