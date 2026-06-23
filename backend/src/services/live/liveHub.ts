/**
 * Live price hub (Phase 1) — the always-on core.
 *
 * One upstream SmartAPI WebSocket → an in-memory price map → fan-out to many
 * browser SSE subscribers. Read-only: it never places orders and never touches
 * the scanner/scoring. Change% is computed locally from the daily snapshot's
 * previous close, so we only need the lightweight LTP feed.
 *
 * Resilience:
 *  - SDK-level auto-reconnect + re-subscribe for transient drops.
 *  - Daily 08:30 IST re-login (feed tokens expire daily); it also reloads the
 *    dataset so the live symbol set tracks the latest daily scan.
 */
import cron from 'node-cron';
import { LivePrice } from '../../types';
import { login, createFeedSocket, SmartSession, MODE_LTP, ACTION_SUBSCRIBE } from '../../lib/smartapi';
import { loadStreamTargets } from './dataset';
import { resolveTokens, ResolvedToken } from './instruments';

type Listener = (p: LivePrice) => void;

interface HubState {
  started: boolean;
  connected: boolean;
  lastTickAt: number | null;
  lastLoginAt: number | null;
  lastScanAt: string | null;
  resolvedCount: number;
  unresolved: string[];
}

const prices = new Map<string, LivePrice>();
const keyByToken = new Map<string, ResolvedToken>(); // normalized token -> meta
const listeners = new Set<Listener>();

let session: SmartSession | null = null;
let ws: any = null;
let resolved: ResolvedToken[] = [];

const state: HubState = {
  started: false,
  connected: false,
  lastTickAt: null,
  lastLoginAt: null,
  lastScanAt: null,
  resolvedCount: 0,
  unresolved: [],
};

/** NSE/BSE cash market hours: 09:15–15:30 IST, Mon–Fri. */
export function isMarketOpen(now = new Date()): boolean {
  // Convert to IST regardless of host timezone.
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getDay(); // 0 Sun .. 6 Sat
  if (day === 0 || day === 6) return false;
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30;
}

/** Resolve which tokens to stream from the current snapshot. */
async function buildTokenMap(): Promise<void> {
  const targets = loadStreamTargets();
  state.lastScanAt = targets.lastScanAt;
  const result = await resolveTokens(targets.stocks, targets.indices);
  resolved = result.resolved;
  state.resolvedCount = resolved.length;
  state.unresolved = result.unresolved;

  keyByToken.clear();
  for (const r of resolved) keyByToken.set(String(r.token).replace(/[^0-9]/g, ''), r);

  // Seed the price map with snapshot prev-closes so the API has data before the
  // first tick (and outside market hours).
  for (const r of resolved) {
    if (!prices.has(r.key)) {
      prices.set(r.key, {
        key: r.key, kind: r.kind, ltp: r.prevClose ?? 0,
        prevClose: r.prevClose, change: 0, changePct: 0, ts: 0,
      });
    }
  }
  console.log(`[live] tokens resolved: ${resolved.length}, unresolved: ${result.unresolved.length}`);
  if (result.unresolved.length) console.warn(`[live] unresolved: ${result.unresolved.join(', ')}`);
}

/** Subscribe all resolved tokens, grouped by exchange (one fetchData per group). */
function subscribeAll(): void {
  const byExch = new Map<number, string[]>();
  for (const r of resolved) {
    if (!byExch.has(r.exchangeType)) byExch.set(r.exchangeType, []);
    byExch.get(r.exchangeType)!.push(r.token);
  }
  for (const [exchangeType, tokens] of byExch) {
    ws.fetchData({ correlationID: 'ultra-live', action: ACTION_SUBSCRIBE, mode: MODE_LTP, exchangeType, tokens });
  }
  console.log(`[live] subscribed ${resolved.length} tokens across ${byExch.size} segment(s)`);
}

function onTick(data: any): void {
  const arr = Array.isArray(data) ? data : [data];
  for (const t of arr) {
    if (!t || t.token == null) continue;
    const tok = String(t.token).replace(/[^0-9]/g, '');
    const meta = keyByToken.get(tok);
    if (!meta) continue;
    const ltp = Number(t.last_traded_price) / 100;
    if (!Number.isFinite(ltp)) continue;
    const prevClose = meta.prevClose;
    const change = prevClose != null ? Number((ltp - prevClose).toFixed(2)) : null;
    const changePct = prevClose ? Number((((ltp - prevClose) / prevClose) * 100).toFixed(2)) : null;
    const price: LivePrice = { key: meta.key, kind: meta.kind, ltp, prevClose, change, changePct, ts: Date.now() };
    prices.set(meta.key, price);
    state.lastTickAt = price.ts;
    for (const l of listeners) {
      try { l(price); } catch { /* a dead listener must not break the loop */ }
    }
  }
}

/** Establish (or re-establish) the upstream socket using the current session. */
function connect(): void {
  ws = createFeedSocket(session!);
  // Enable SDK auto-reconnect (exponential) — it re-subscribes from its buffer.
  ws.reconnection?.('exponential', 2000, 2);
  ws.connect()
    .then(() => {
      state.connected = true;
      console.log('[live] websocket connected');
      subscribeAll();
    })
    .catch((e: any) => {
      state.connected = false;
      console.error('[live] connect failed:', e?.message || e);
    });
  ws.on('tick', onTick);
  ws.on('error', (e: any) => console.error('[live] ws error:', e?.message || e));
}

/** Full re-login: tear down the socket, get fresh tokens, reload + resubscribe. */
async function relogin(): Promise<void> {
  console.log('[live] re-login…');
  try { ws?.close?.(); } catch { /* ignore */ }
  state.connected = false;
  session = await login();
  state.lastLoginAt = Date.now();
  await buildTokenMap(); // pick up the latest daily scan's symbols
  connect();
}

/** Boot the hub: login, resolve tokens, connect, and arm the daily re-login. */
export async function startHub(): Promise<void> {
  if (state.started) return;
  state.started = true;
  session = await login();
  state.lastLoginAt = Date.now();
  await buildTokenMap();
  connect();

  // Daily re-login at 08:30 IST on weekdays (before the 09:15 open).
  cron.schedule('30 8 * * 1-5', () => { relogin().catch((e) => console.error('[live] relogin failed:', e?.message || e)); },
    { timezone: 'Asia/Kolkata' });

  console.log('[live] hub started');
}

// --- read side (used by the HTTP/SSE endpoints) ---

export function getSnapshot(): LivePrice[] {
  return [...prices.values()];
}

export function getHealth() {
  return {
    started: state.started,
    connected: state.connected,
    marketOpen: isMarketOpen(),
    lastTickAt: state.lastTickAt,
    lastLoginAt: state.lastLoginAt,
    lastScanAt: state.lastScanAt,
    tokenCount: state.resolvedCount,
    unresolvedCount: state.unresolved.length,
    listeners: listeners.size,
  };
}

export function addListener(fn: Listener): void { listeners.add(fn); }
export function removeListener(fn: Listener): void { listeners.delete(fn); }
