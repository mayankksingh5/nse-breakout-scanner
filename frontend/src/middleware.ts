import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifyToken } from '@/lib/server/jwt';

// Gate the task-management app and its APIs behind a valid session. The public
// stock/IPO dashboard and the auth endpoints stay open. Runs on the edge, so it
// only verifies the JWT (no DB / bcrypt) — routes re-check the user in Node.

const PROTECTED_API = ['/api/tasks', '/api/users', '/api/dashboard'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  const isApi = PROTECTED_API.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isApi) {
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.next();
  }

  // /tasks pages (login excluded).
  if (pathname === '/tasks/login') {
    // Already signed in → skip the login screen.
    if (session) return NextResponse.redirect(new URL('/tasks', req.url));
    return NextResponse.next();
  }

  if (pathname === '/tasks' || pathname.startsWith('/tasks/')) {
    if (!session) {
      const url = new URL('/tasks/login', req.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/tasks/:path*', '/api/tasks/:path*', '/api/users/:path*', '/api/dashboard/:path*'],
};
