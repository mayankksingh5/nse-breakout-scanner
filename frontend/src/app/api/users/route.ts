import { NextRequest, NextResponse } from 'next/server';
import { users, tasks, toObjectId } from '@/lib/server/mongo';
import { hashPassword, requireAuth } from '@/lib/server/auth';
import { serializeUser } from '@/lib/server/serialize';
import type { Role } from '@/types/task';

export const runtime = 'nodejs';

// GET /api/users — list team members (any authenticated user; used for
// assignment dropdowns and rendering names). Sorted by manual `order` (then
// name), with the count of tasks currently assigned to each member.
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const docs = await (await users())
    .find({})
    .sort({ order: 1, name: 1 })
    .toArray();

  // Tally assigned tasks per member in one aggregation.
  const counts = await (await tasks())
    .aggregate<{ _id: unknown; count: number }>([
      { $match: { assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
    ])
    .toArray();
  const countById = new Map(counts.map((c) => [String(c._id), c.count]));

  const list = docs.map((d) => ({
    ...serializeUser(d),
    assignedCount: countById.get(d._id!.toString()) ?? 0,
  }));
  return NextResponse.json(list);
}

// PUT /api/users — persist a new manual ordering (admin only). Body:
// { order: string[] } — user ids in the desired display order.
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['admin']);
  if (!auth.ok) return auth.res;

  let body: { order?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!Array.isArray(body.order)) {
    return NextResponse.json({ error: 'order must be an array of user ids' }, { status: 400 });
  }

  const col = await users();
  const ops = body.order
    .map((id, index) => {
      const _id = toObjectId(id);
      if (!_id) return null;
      return {
        updateOne: { filter: { _id }, update: { $set: { order: index } } },
      };
    })
    .filter(Boolean) as Parameters<typeof col.bulkWrite>[0];

  if (ops.length) await col.bulkWrite(ops);
  return NextResponse.json({ ok: true, count: ops.length });
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

  // New members append to the end of the manual order.
  const last = await col.find({}).sort({ order: -1 }).limit(1).next();
  const nextOrder = (last?.order ?? -1) + 1;

  const now = new Date();
  const doc = {
    name,
    email,
    passwordHash: await hashPassword(password),
    role,
    designation,
    active: true,
    order: nextOrder,
    createdAt: now,
    updatedAt: now,
  };
  const { insertedId } = await col.insertOne(doc);
  return NextResponse.json(serializeUser({ ...doc, _id: insertedId }), { status: 201 });
}
