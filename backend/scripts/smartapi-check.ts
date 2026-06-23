/**
 * Phase 0 — Angel One SmartAPI validation (standalone, throwaway-style).
 *
 * Proves the three things the live-data feature depends on, WITHOUT touching
 * any app code, placing any order, or exposing anything publicly:
 *   1. Login works (API key + client code + PIN + in-code TOTP).
 *   2. The instrument master resolves tokens for sample stocks + the indices
 *      we care about — NIFTY 50, NIFTY BANK, and SENSEX (the risky one, BSE).
 *   3. Live LTP ticks actually arrive over the WebSocket.
 *
 * Run locally:  cd backend && npm run smartapi:check
 * Requires backend/.env (git-ignored) with the SMARTAPI_* values.
 *
 * It connects read-only, streams ticks for ~20s, then exits. Best run during
 * NSE/BSE market hours (09:15–15:30 IST) — outside that you'll see login +
 * token resolution pass but few/no live ticks (expected).
 */
import 'dotenv/config';
import { authenticator } from 'otplib';
// smartapi-javascript ships CommonJS; import the whole module then destructure.
import pkg from 'smartapi-javascript';
const { SmartAPI, WebSocketV2 } = pkg as any;

const MASTER_URL =
  'https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json';

// What we want to resolve & stream. exchSeg matches the master file's exch_seg.
// tradingSymbol is how stocks appear in the master (NSE equities end in -EQ).
const WANTED: Array<{ label: string; exchSeg: string; match: (r: any) => boolean }> = [
  { label: 'RELIANCE', exchSeg: 'NSE', match: (r) => r.symbol === 'RELIANCE-EQ' },
  { label: 'TCS', exchSeg: 'NSE', match: (r) => r.symbol === 'TCS-EQ' },
  { label: 'HDFCBANK', exchSeg: 'NSE', match: (r) => r.symbol === 'HDFCBANK-EQ' },
  { label: 'NIFTY 50', exchSeg: 'NSE', match: (r) => r.name === 'NIFTY' && r.symbol === 'Nifty 50' },
  { label: 'NIFTY BANK', exchSeg: 'NSE', match: (r) => r.name === 'BANKNIFTY' && r.symbol === 'Nifty Bank' },
  { label: 'SENSEX', exchSeg: 'BSE', match: (r) => r.name === 'SENSEX' || r.symbol === 'SENSEX' },
];

// SmartWebSocketV2 exchangeType codes.
const EXCHANGE_TYPE: Record<string, number> = { NSE: 1, NSE_FO: 2, BSE: 3, BSE_FO: 4, MCX: 5 };
const LTP_MODE = 1;

function need(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`\n✗ Missing env var ${name}. Copy backend/.env.example → backend/.env and fill it in.`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const API_KEY = need('SMARTAPI_API_KEY');
  const CLIENT_CODE = need('SMARTAPI_CLIENT_CODE');
  const PIN = need('SMARTAPI_PIN');
  const TOTP_SECRET = need('SMARTAPI_TOTP_SECRET');

  // --- Step 1: login ------------------------------------------------------
  console.log('\n[1/3] Logging in to SmartAPI…');
  const totp = authenticator.generate(TOTP_SECRET);
  const smart = new SmartAPI({ api_key: API_KEY });
  const session = await smart.generateSession(CLIENT_CODE, PIN, totp);
  if (!session?.status || !session?.data) {
    console.error('✗ Login failed:', JSON.stringify(session, null, 2));
    process.exit(1);
  }
  const feedToken: string = session.data.feedToken;
  const jwt: string = session.data.jwtToken;
  const mask = (s: string) => (s ? s.slice(0, 6) + '…' + s.slice(-4) : '(none)');
  console.log(`    ✓ Logged in. jwt=${mask(jwt)} feedToken=${mask(feedToken)}`);

  // --- Step 2: resolve tokens from the instrument master ------------------
  console.log('\n[2/3] Fetching instrument master & resolving tokens…');
  const master: any[] = await fetch(MASTER_URL).then((r) => r.json() as Promise<any[]>);
  console.log(`    master rows: ${master.length.toLocaleString()}`);

  const resolved: Array<{ label: string; exchSeg: string; token: string }> = [];
  for (const w of WANTED) {
    const row = master.find((r) => r.exch_seg === w.exchSeg && w.match(r));
    if (row) {
      resolved.push({ label: w.label, exchSeg: w.exchSeg, token: String(row.token) });
      console.log(`    ✓ ${w.label.padEnd(12)} ${w.exchSeg}  token=${row.token}  (${row.symbol})`);
    } else {
      console.log(`    ✗ ${w.label.padEnd(12)} ${w.exchSeg}  NOT FOUND in master`);
    }
  }
  if (!resolved.length) {
    console.error('✗ No tokens resolved — cannot test the stream.');
    process.exit(1);
  }
  const sensex = resolved.find((r) => r.label === 'SENSEX');
  console.log(sensex ? '    → SENSEX resolved ✓ (BSE index available)' : '    → SENSEX NOT resolved ✗ (investigate BSE index naming)');

  // Group tokens by exchangeType for the subscription payload.
  const byExch = new Map<number, string[]>();
  for (const r of resolved) {
    const et = EXCHANGE_TYPE[r.exchSeg];
    if (!byExch.has(et)) byExch.set(et, []);
    byExch.get(et)!.push(r.token);
  }
  const tokenList = [...byExch.entries()].map(([exchangeType, tokens]) => ({ exchangeType, tokens }));

  // --- Step 3: stream live LTP ticks -------------------------------------
  console.log('\n[3/3] Connecting WebSocket & subscribing (LTP mode)…');
  const tokenToLabel = new Map(resolved.map((r) => [r.token, r.label]));
  const ws = new WebSocketV2({ jwttoken: jwt, apikey: API_KEY, clientcode: CLIENT_CODE, feedtype: feedToken });

  let ticks = 0;
  await ws.connect();
  console.log('    ✓ WebSocket connected. Subscribing…');
  // The SDK's fetchData takes ONE exchange per call (flat shape), so subscribe
  // once per exchange group (NSE stocks+indices, then BSE for SENSEX).
  for (const grp of tokenList) {
    ws.fetchData({ correlationID: 'phase0', action: 1, mode: LTP_MODE, exchangeType: grp.exchangeType, tokens: grp.tokens });
  }

  ws.on('tick', (data: any) => {
    const arr = Array.isArray(data) ? data : [data];
    for (const t of arr) {
      if (!t || t.token == null) continue;
      // The parser returns token as a quoted string (e.g. '"2885"') — strip to digits.
      const tok = String(t.token).replace(/[^0-9]/g, '');
      if (!tok) continue;
      // LTP arrives in paise — coerce to number (the parser may yield a
      // string/bigint) and divide by 100 to get rupees.
      const ltp = Number(t.last_traded_price) / 100;
      const label = tokenToLabel.get(tok) ?? tok;
      ticks++;
      console.log(`    tick  ${String(label).padEnd(12)} ltp=₹${ltp.toFixed(2)}`);
    }
  });
  ws.on('error', (e: any) => console.error('    ws error:', e?.message || e));

  // Stream for ~20s, then report and exit cleanly.
  setTimeout(() => {
    console.log(`\nDone. Received ${ticks} tick(s) in ~20s.`);
    console.log(
      ticks > 0
        ? '✓ PHASE 0 GREEN — login, token resolution, and live stream all work.'
        : '⚠ No ticks. If markets are open and tokens resolved, check exchangeType/mode; otherwise re-run during 09:15–15:30 IST.',
    );
    try { ws.close?.(); } catch {}
    process.exit(ticks > 0 ? 0 : 2);
  }, 20_000);
}

main().catch((e) => {
  console.error('\n✗ Phase 0 failed:', e?.message || e);
  process.exit(1);
});
