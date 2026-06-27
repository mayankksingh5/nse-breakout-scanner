import { SignJWT, jwtVerify } from 'jose';

// Edge-safe JWT helpers (jose only — no Node-specific deps). Used by both the
// edge middleware and the Node API routes, so keep this module free of bcrypt
// or the mongodb driver.

export const SESSION_COOKIE = 'team_session';

const SESSION_DAYS = 7;
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60; // seconds

export interface SessionPayload {
  sub: string; // user id
  role: 'admin' | 'member';
  name: string;
}

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      'JWT_SECRET is missing or too short. Set a long random value in .env.local (and Vercel env).',
    );
  }
  return new TextEncoder().encode(s);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return {
      sub: String(payload.sub),
      role: (payload.role as 'admin' | 'member') ?? 'member',
      name: String(payload.name ?? ''),
    };
  } catch {
    return null;
  }
}
