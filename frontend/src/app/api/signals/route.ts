import { NextRequest, NextResponse } from 'next/server';

// Proxy to the scanner backend so the browser stays same-origin (no CORS).
const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.search; // forward all filter query params as-is
  try {
    const res = await fetch(`${BACKEND}/api/signals${qs}`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'Scanner backend not reachable. Start it with: cd backend && npm run dev' },
      { status: 502 }
    );
  }
}
