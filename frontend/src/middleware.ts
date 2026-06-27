import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifyToken } from '@/lib/server/jwt';

// Gate the internal workspace and its APIs behind a valid session. The public
// stock/IPO dashboard and the auth endpoints stay open. Runs on the edge, so it
// only verifies the JWT (no DB / bcrypt) — routes re-check the user in Node.
// Legacy /tasks/* URLs are redirected to /workspace/* via next.config.

const PROTECTED_API = ['/api/tasks', '/api/users', '/api/dashboard'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  // Protected APIs → 401 JSON when unauthenticated.
  if (PROTECTED_API.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.next();
  }

  // /login → bounce to the workspace if already signed in.
  if (pathname === '/login') {
    if (session) return NextResponse.redirect(new URL('/workspace', req.url));
    return NextResponse.next();
  }

  // /workspace pages → require a session, else redirect to login with return path.
  if (pathname === '/workspace' || pathname.startsWith('/workspace/')) {
    if (!session) {
      const url = new URL('/login', req.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/workspace/:path*',
    '/api/tasks/:path*',
    '/api/users/:path*',
    '/api/dashboard/:path*',
  ],
};
