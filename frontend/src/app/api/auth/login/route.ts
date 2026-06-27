import { NextRequest, NextResponse } from 'next/server';
import { users } from '@/lib/server/mongo';
import { verifyPassword } from '@/lib/server/auth';
import { serializeUser } from '@/lib/server/serialize';
import { SESSION_COOKIE, SESSION_MAX_AGE, signToken } from '@/lib/server/jwt';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const user = await (await users()).findOne({ email });
  // Same response whether the email is unknown or the password is wrong.
  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const token = await signToken({ sub: user._id!.toString(), role: user.role, name: user.name });

  const res = NextResponse.json({ user: serializeUser(user) });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
