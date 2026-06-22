import fs from 'fs';
import path from 'path';
import { runScan, getSignals, getIndices } from './services/scanner';
import { enrichAndWriteHistories } from './services/enrich';

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
  const indices = getIndices();

  if (signals.length === 0) {
    console.error('[publish] scan produced 0 signals — not overwriting dataset.');
    process.exit(1);
  }

  // Enrich for the detail pages: company fundamentals on each signal, plus a
  // per-symbol price-history file for every stock and index.
  const historyDir = path.join(process.cwd(), '..', 'frontend', 'public', 'history');
  try {
    await enrichAndWriteHistories(signals, indices, historyDir);
  } catch (err) {
    console.error('[publish] enrichment failed (continuing with summary data):', err);
  }

  const payload = {
    lastScanAt: new Date().toISOString(),
    signals,
    indices,
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
