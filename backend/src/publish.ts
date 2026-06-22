import fs from 'fs';
import path from 'path';
import { runScan, getSignals, getIndices } from './services/scanner';

/**
 * Runs a full scan locally (where Yahoo Finance is reachable) and writes the
 * results into the frontend so they can be committed and deployed.
 *
 * Usage (from the backend folder):  npm run refresh
 * Then:  git add -A && git commit -m "refresh data" && git push
 */
async function main() {
  console.log('[publish] running full scan locally...');
  await runScan(true);
  const signals = getSignals();

  if (signals.length === 0) {
    console.error('[publish] scan produced 0 signals — not overwriting dataset.');
    process.exit(1);
  }

  const payload = {
    lastScanAt: new Date().toISOString(),
    signals,
    indices: getIndices(),
  };

  const target = path.join(process.cwd(), '..', 'frontend', 'src', 'data', 'signals.json');
  fs.writeFileSync(target, JSON.stringify(payload));
  console.log(`[publish] wrote ${signals.length} signals to ${target}`);
  console.log('[publish] now run:  git add -A && git commit -m "refresh data" && git push');
  process.exit(0);
}

main().catch((err) => {
  console.error('[publish] failed:', err);
  process.exit(1);
});
