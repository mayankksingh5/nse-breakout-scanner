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

// Set NEXT_PUBLIC_LIVE_HUB_URL to the hub origin (e.g. http://localhost:8080).
// Unset => the whole live layer is inert and the app behaves exactly as before.
const HUB = process.env.NEXT_PUBLIC_LIVE_HUB_URL;

let es: EventSource | null = null;

// Ticks are buffered and flushed on an interval so a busy market (many ticks/sec)
// can't trigger more than a handful of React re-renders per second.
let buffer: Record<string, LivePrice> = {};
let flushTimer: ReturnType<typeof setInterval> | null = null;

export const useLiveStore = create<LiveState>((set) => ({
  enabled: !!HUB,
  connected: false,
  prices: {},

  connect: () => {
    if (!HUB || es) return;
    es = new EventSource(`${HUB}/live`);

    es.addEventListener('snapshot', (ev) => {
      try {
        const arr = JSON.parse((ev as MessageEvent).data) as LivePrice[];
        const map: Record<string, LivePrice> = {};
        for (const p of arr) map[p.key] = p;
        set({ prices: map, connected: true });
      } catch {
        /* ignore malformed frame */
      }
    });

    es.onmessage = (ev) => {
      try {
        const p = JSON.parse(ev.data) as LivePrice;
        buffer[p.key] = p;
      } catch {
        /* ignore */
      }
    };

    es.onopen = () => set({ connected: true });
    es.onerror = () => set({ connected: false }); // EventSource auto-reconnects

    if (!flushTimer) {
      flushTimer = setInterval(() => {
        if (Object.keys(buffer).length === 0) return;
        const batch = buffer;
        buffer = {};
        set((s) => ({ prices: { ...s.prices, ...batch }, connected: true }));
      }, 200);
    }
  },

  disconnect: () => {
    es?.close();
    es = null;
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
    buffer = {};
    set({ connected: false });
  },
}));
