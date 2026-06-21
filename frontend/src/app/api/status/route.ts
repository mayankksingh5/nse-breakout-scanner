import { NextResponse } from 'next/server';
import dataset from '@/data/signals.json';

// Reports metadata about the bundled dataset (generated locally, served static).
export async function GET() {
  const d = dataset as { lastScanAt?: string; signals?: unknown[] };
  return NextResponse.json({
    lastScanAt: d.lastScanAt ?? null,
    signalCount: d.signals?.length ?? 0,
    source: 'precomputed',
  });
}
