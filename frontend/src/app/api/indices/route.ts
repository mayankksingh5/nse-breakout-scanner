import { NextResponse } from 'next/server';
import dataset from '@/data/signals.json';

// Market indices are generated alongside the stock scan and committed into the
// same dataset, so they refresh on the same automated pipeline.
export async function GET() {
  const d = dataset as unknown as { indices?: unknown[] };
  return NextResponse.json(d.indices ?? []);
}
