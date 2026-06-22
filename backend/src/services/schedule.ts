import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import { runScan, getSignals, getState } from './scanner';

/**
 * Automatic end-of-day refresh.
 *
 * NSE/BSE cash markets close at 15:30 IST on weekdays. We run a fresh scan a
 * little after the close (16:00 IST, Mon–Fri) so the dataset always reflects
 * the latest available end-of-day data and never goes stale for multiple days.
 *
 * When the scan succeeds we also mirror the results into the frontend's
 * `signals.json` (the file the deployed UI reads) so a locally-running backend
 * keeps the committed dataset current — commit & push to publish.
 */

const FRONTEND_SIGNALS = path.join(
  process.cwd(),
  '..',
  'frontend',
  'src',
  'data',
  'signals.json',
);

function mirrorToFrontend() {
  const signals = getSignals();
  if (signals.length === 0) return;
  try {
    if (!fs.existsSync(path.dirname(FRONTEND_SIGNALS))) return; // not running next to the frontend
    fs.writeFileSync(
      FRONTEND_SIGNALS,
      JSON.stringify({ lastScanAt: getState().lastScanAt, signals }),
    );
    console.log(`[schedule] mirrored ${signals.length} signals to frontend dataset`);
  } catch (err) {
    console.error('[schedule] failed to mirror signals to frontend:', err);
  }
}

async function refresh(reason: string) {
  console.log(`[schedule] ${reason} — running end-of-day scan`);
  await runScan(false);
  mirrorToFrontend();
}

export function startScheduler() {
  // 16:00 IST, Monday–Friday (after the 15:30 market close).
  cron.schedule(
    '0 16 * * 1-5',
    () => {
      refresh('market close').catch((e) => console.error('[schedule] EOD scan failed:', e));
    },
    { timezone: 'Asia/Kolkata' },
  );
  console.log('[schedule] EOD auto-refresh armed for 16:00 IST on weekdays');

  // On boot, refresh if the cached data is more than a day old so a server that
  // was offline over the close catches up immediately.
  const last = getState().lastScanAt;
  const ageMs = last ? Date.now() - new Date(last).getTime() : Infinity;
  if (ageMs > 24 * 60 * 60 * 1000) {
    refresh('cached data older than a day').catch((e) =>
      console.error('[schedule] catch-up scan failed:', e),
    );
  }
}
