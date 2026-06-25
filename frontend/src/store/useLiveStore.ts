import { create } from 'zustand';

/** Mirrors the backend hub's LivePrice (key = signal symbol or index slug). */
export interface LivePrice {
  key: string;
  kind: 'stock' | 'index';
  ltp: number;
  prevClose: number | null;
  change: number | null;
  changePct: number | null;
  ts: number;
}

interface LiveState {
  enabled: boolean; // hub URL configured?
  connected: boolean;
  prices: Record<string, LivePrice>;
  connect: () => void;
  disconnect: () => void;
}

// Set NEXT_PUBLIC_LIVE_HUB_URL to the hub origin (e.g. https://xxx.ngrok-free.dev).
// Unset => the whole live layer is inert and the app behaves exactly as before.
const HUB = process.env.NEXT_PUBLIC_LIVE_HUB_URL;

// NOTE: we consume the SSE stream with fetch()+ReadableStream rather than
// EventSource. EventSource cannot set request headers, and ngrok's free tier
// serves a browser-warning interstitial (HTML) unless the request carries the
// `ngrok-skip-browser-warning` header — which would break EventSource. fetch()
// lets us send that header so the stream comes through for every visitor.

let started = false;
let stopped = false;
let abort: AbortController | null = null;

// Ticks are buffered and flushed on an interval so a busy market (many ticks/sec)
// can't trigger more than a handful of React re-renders per second.
let buffer: Record<string, LivePrice> = {};
let flushTimer: ReturnType<typeof setInterval> | null = null;

export const useLiveStore = create<LiveState>((set) => {
  function handleFrame(frame: string) {
    let event = 'message';
    let data = '';
    for (const line of frame.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data += line.slice(5).trim();
      // lines starting with ':' are comments (keep-alive pings) — ignored.
    }
    if (!data) return;
    try {
      if (event === 'snapshot') {
        const arr = JSON.parse(data) as LivePrice[];
        const map: Record<string, LivePrice> = {};
        for (const p of arr) map[p.key] = p;
        set({ prices: map, connected: true });
      } else {
        const p = JSON.parse(data) as LivePrice;
        buffer[p.key] = p;
      }
    } catch {
      /* ignore malformed frame */
    }
  }

  async function run() {
    while (!stopped) {
      try {
        abort = new AbortController();
        const resp = await fetch(`${HUB}/live`, {
          headers: {
            Accept: 'text/event-stream',
            'ngrok-skip-browser-warning': 'true',
          },
          signal: abort.signal,
          cache: 'no-store',
        });
        if (!resp.ok || !resp.body) throw new Error(`bad response ${resp.status}`);
        set({ connected: true });

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (!stopped) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf('\n\n')) >= 0) {
            handleFrame(buf.slice(0, idx));
            buf = buf.slice(idx + 2);
          }
        }
      } catch {
        set({ connected: false });
      }
      if (stopped) break;
      await new Promise((r) => setTimeout(r, 3000)); // reconnect backoff
    }
  }

  return {
    enabled: !!HUB,
    connected: false,
    prices: {},

    connect: () => {
      if (!HUB || started) return;
      started = true;
      stopped = false;

      if (!flushTimer) {
        flushTimer = setInterval(() => {
          if (Object.keys(buffer).length === 0) return;
          const batch = buffer;
          buffer = {};
          set((s) => ({ prices: { ...s.prices, ...batch }, connected: true }));
        }, 200);
      }

      run();
    },

    disconnect: () => {
      stopped = true;
      started = false;
      abort?.abort();
      abort = null;
      if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = null;
      }
      buffer = {};
      set({ connected: false });
    },
  };
});
