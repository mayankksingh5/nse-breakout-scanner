'use client';

import { useEffect } from 'react';
import { useLiveStore } from '@/store/useLiveStore';

/**
 * Ensures the single live-price SSE connection is open, and exposes the current
 * price map + connection status. Safe to call from multiple components — the
 * store guards against opening more than one EventSource.
 *
 * When NEXT_PUBLIC_LIVE_HUB_URL is unset, `enabled` is false and `prices` stays
 * empty, so callers transparently fall back to the static snapshot.
 */
export function useLivePrices() {
  const enabled = useLiveStore((s) => s.enabled);
  const connect = useLiveStore((s) => s.connect);

  useEffect(() => {
    if (enabled) connect();
  }, [enabled, connect]);

  const prices = useLiveStore((s) => s.prices);
  const connected = useLiveStore((s) => s.connected);
  return { enabled, connected, prices };
}
