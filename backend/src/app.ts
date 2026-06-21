import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { runScan, getSignals, getState } from './services/scanner';
import { Signal } from './types';

const app = express();
app.use(cors());
app.use(express.json());

// Map the UI's "volume period" choice to the right average-volume field.
function avgVolumeField(period: string): keyof Signal {
  if (period === '2m') return 'avg_volume_2m';
  if (period === '3m') return 'avg_volume_3m';
  return 'avg_volume_1m';
}

/**
 * GET /api/signals
 * Query filters (all optional):
 *   minScore        - minimum breakout score (default 50)
 *   minVolumeRatio  - minimum today-vs-1m volume surge
 *   minMarketCapCr  - minimum market cap in crore (default 5000)
 *   volPeriod       - 1m | 2m | 3m   (which avg-volume column to filter on)
 *   minAvgVolume    - minimum average daily volume for the chosen period
 *   signal          - STRONG_BUY | BREAKOUT_WATCH | MONITOR
 *   search          - substring match on symbol / company name
 */
app.get('/api/signals', (req: Request, res: Response) => {
  const minScore = Number(req.query.minScore ?? 50);
  const minVolumeRatio = Number(req.query.minVolumeRatio ?? 0);
  const minMarketCapCr = Number(req.query.minMarketCapCr ?? 5000);
  const minAvgVolume = Number(req.query.minAvgVolume ?? 0);
  const volPeriod = String(req.query.volPeriod ?? '1m');
  const signalFilter = req.query.signal ? String(req.query.signal) : null;
  const search = req.query.search ? String(req.query.search).toUpperCase() : null;

  const volField = avgVolumeField(volPeriod);

  const filtered = getSignals().filter((s) => {
    if (s.breakout_score < minScore) return false;
    if (s.volume_ratio < minVolumeRatio) return false;
    if (s.market_cap_cr < minMarketCapCr) return false;
    if ((s[volField] as number) < minAvgVolume) return false;
    if (signalFilter && s.signal_type !== signalFilter) return false;
    if (search && !s.symbol.includes(search) && !s.company_name.toUpperCase().includes(search))
      return false;
    return true;
  });

  res.json(filtered);
});

// GET /api/status - last scan info / progress.
app.get('/api/status', (_req: Request, res: Response) => {
  res.json(getState());
});

// POST /api/scan - trigger a fresh scan. Returns immediately; runs in background.
// Pass ?wait=1 to wait for completion (slow), ?refresh=1 to re-download universe.
app.post('/api/scan', async (req: Request, res: Response) => {
  const refresh = req.query.refresh === '1';
  if (req.query.wait === '1') {
    const result = await runScan(refresh);
    return res.json(result);
  }
  runScan(refresh); // fire and forget
  res.json({ status: 'scan started', ...getState() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Scanner server active on port ${PORT}`);
  // Kick off an initial scan if we have no data yet.
  if (getSignals().length === 0) {
    console.log('[startup] no cached signals — running initial scan');
    runScan();
  } else {
    console.log(`[startup] serving ${getSignals().length} cached signals; POST /api/scan to refresh`);
  }
});
