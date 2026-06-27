import { NextRequest, NextResponse } from 'next/server';
import { users } from '@/lib/server/mongo';
import { hashPassword, requireAuth } from '@/lib/server/auth';
import { serializeUser } from '@/lib/server/serialize';
import type { Role } from '@/types/task';

export const runtime = 'nodejs';

// GET /api/users — list team members (any authenticated user; used for
// assignment dropdowns and rendering names).
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const docs = await (await users()).find({}).sort({ name: 1 }).toArray();
  return NextResponse.json(docs.map(serializeUser));
}

// POST /api/users — create a team member (admin only).
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['admin']);
  if (!auth.ok) return auth.res;

  let body: {
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
    designation?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';
  const role: Role = body.role === 'admin' ? 'admin' : 'member';
  const designation = body.designation?.trim() || 'Team Member';

  if (!name || !email || password.length < 6) {
    return NextResponse.json(
      { error: 'Name, email and a password of at least 6 characters are required' },
      { status: 400 },
    );
  }

  const col = await users();
  if (await col.findOne({ email })) {
    return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });
  }

  const now = new Date();
  const doc = {
    name,
    email,
    passwordHash: await hashPassword(password),
    role,
    designation,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  const { insertedId } = await col.insertOne(doc);
  return NextResponse.json(serializeUser({ ...doc, _id: insertedId }), { status: 201 });
}
