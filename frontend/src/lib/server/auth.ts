import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { users, toObjectId, UserDoc } from './mongo';
import { SESSION_COOKIE, verifyToken } from './jwt';
import type { Role } from '@/types/task';

// Node-runtime auth helpers: password hashing (bcrypt) + session resolution
// against the database. Route handlers use these; the edge middleware uses the
// lighter jwt.ts directly.

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Resolve the logged-in user from the request cookie, or null. */
export async function getSession(req: NextRequest): Promise<UserDoc | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const id = toObjectId(payload.sub);
  if (!id) return null;
  const user = await (await users()).findOne({ _id: id });
  if (!user || !user.active) return null;
  return user;
}

export type AuthResult =
  | { ok: true; user: UserDoc }
  | { ok: false; res: NextResponse };

/**
 * Guard a route handler. Returns the authenticated user, or an error response
 * to return immediately. Pass `roles` to require a specific role.
 */
export async function requireAuth(req: NextRequest, roles?: Role[]): Promise<AuthResult> {
  const user = await getSession(req);
  if (!user) {
    return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (roles && roles.length && !roles.includes(user.role)) {
    return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true, user };
}
