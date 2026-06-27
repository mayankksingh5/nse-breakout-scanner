import { NextRequest, NextResponse } from 'next/server';
import { users, toObjectId } from '@/lib/server/mongo';
import { hashPassword, requireAuth } from '@/lib/server/auth';
import { serializeUser } from '@/lib/server/serialize';
import type { UserDoc } from '@/lib/server/mongo';
import type { Role } from '@/types/task';

export const runtime = 'nodejs';

// PATCH /api/users/[id] — update a member (admin only): role, designation,
// name, active flag, and optionally reset the password.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin']);
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;
  const _id = toObjectId(id);
  if (!_id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  let body: {
    name?: string;
    role?: Role;
    designation?: string;
    active?: boolean;
    password?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const update: Partial<UserDoc> = { updatedAt: new Date() };
  if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim();
  if (body.role === 'admin' || body.role === 'member') update.role = body.role;
  if (typeof body.designation === 'string') update.designation = body.designation.trim();
  if (typeof body.active === 'boolean') update.active = body.active;
  if (typeof body.password === 'string' && body.password.length >= 6) {
    update.passwordHash = await hashPassword(body.password);
  }

  // Guard: an admin must not lock themselves out by demoting/deactivating self.
  if (auth.user._id!.equals(_id) && (update.role === 'member' || update.active === false)) {
    return NextResponse.json(
      { error: 'You cannot demote or deactivate your own admin account' },
      { status: 400 },
    );
  }

  const col = await users();
  const result = await col.findOneAndUpdate(
    { _id },
    { $set: update },
    { returnDocument: 'after' },
  );
  if (!result) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(serializeUser(result));
}

// DELETE /api/users/[id] — soft-deactivate a member (admin only). We never hard
// delete so existing task history (createdBy/assignedTo) stays intact.
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin']);
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;
  const _id = toObjectId(id);
  if (!_id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  if (auth.user._id!.equals(_id)) {
    return NextResponse.json({ error: 'You cannot deactivate yourself' }, { status: 400 });
  }

  const col = await users();
  const result = await col.findOneAndUpdate(
    { _id },
    { $set: { active: false, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!result) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(serializeUser(result));
}
