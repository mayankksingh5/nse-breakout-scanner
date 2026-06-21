import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';

export const maxDuration = 30;

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/status`, { cache: 'no-store' });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: 'backend unreachable' }, { status: 502 });
  }
}

// Trigger a fresh scan on the backend.
export async function POST() {
  try {
    const res = await fetch(`${BACKEND}/api/scan`, { method: 'POST', cache: 'no-store' });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: 'backend unreachable' }, { status: 502 });
  }
}
