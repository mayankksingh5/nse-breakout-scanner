import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth';
import { serializeUser } from '@/lib/server/serialize';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: serializeUser(user) });
}
