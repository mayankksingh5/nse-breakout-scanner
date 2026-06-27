import { NextRequest, NextResponse } from 'next/server';
import { users, tasks, toObjectId } from '@/lib/server/mongo';
import { hashPassword, requireAuth } from '@/lib/server/auth';
import { serializeUser } from '@/lib/server/serialize';
import type { UserDoc } from '@/lib/server/mongo';
import type { Role } from '@/types/task';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// PATCH /api/users/[id] — update a member (admin only): name, email, role,
// designation, active flag, and optionally reset the password.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin']);
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;
  const _id = toObjectId(id);
  if (!_id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  let body: {
    name?: string;
    email?: string;
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

  const col = await users();

  const update: Partial<UserDoc> = { updatedAt: new Date() };
  if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim();
  if (body.role === 'admin' || body.role === 'member') update.role = body.role;
  if (typeof body.designation === 'string') update.designation = body.designation.trim();
  if (typeof body.active === 'boolean') update.active = body.active;
  if (typeof body.password === 'string' && body.password.length >= 6) {
    update.passwordHash = await hashPassword(body.password);
  }

  // Email change: validate format and enforce uniqueness against other users.
  if (typeof body.email === 'string') {
    const email = body.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }
    const clash = await col.findOne({ email, _id: { $ne: _id } });
    if (clash) {
      return NextResponse.json({ error: 'Another user already uses that email' }, { status: 409 });
    }
    update.email = email;
  }

  // Guard: an admin must not lock themselves out by demoting/deactivating self.
  if (auth.user._id!.equals(_id) && (update.role === 'member' || update.active === false)) {
    return NextResponse.json(
      { error: 'You cannot demote or deactivate your own admin account' },
      { status: 400 },
    );
  }

  const result = await col.findOneAndUpdate({ _id }, { $set: update }, { returnDocument: 'after' });
  if (!result) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(serializeUser(result));
}

// DELETE /api/users/[id] — permanently delete a non-admin member (admin only).
// Owned tasks are handled first: if `reassignTo` is supplied their assigned
// tasks move to that member; otherwise those tasks become unassigned. Tasks the
// member created keep their createdBy reference (shown as "Unknown" in history).
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin']);
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;
  const _id = toObjectId(id);
  if (!_id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  if (auth.user._id!.equals(_id)) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
  }

  const col = await users();
  const target = await col.findOne({ _id });
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.role === 'admin') {
    return NextResponse.json({ error: 'Admins cannot be deleted. Demote to member first.' }, { status: 400 });
  }

  // Optional reassignment target for this member's assigned tasks.
  let reassignTo: string | null = null;
  try {
    const body = await req.json();
    if (body && typeof body.reassignTo === 'string') reassignTo = body.reassignTo;
  } catch {
    /* no body — default to unassigning their tasks */
  }

  const taskCol = await tasks();
  if (reassignTo) {
    const newAssignee = toObjectId(reassignTo);
    if (!newAssignee) {
      return NextResponse.json({ error: 'Invalid reassignTo id' }, { status: 400 });
    }
    if (!(await col.findOne({ _id: newAssignee }))) {
      return NextResponse.json({ error: 'Reassignment target not found' }, { status: 404 });
    }
    await taskCol.updateMany(
      { assignedTo: _id },
      { $set: { assignedTo: newAssignee, updatedAt: new Date() } },
    );
  } else {
    await taskCol.updateMany(
      { assignedTo: _id },
      { $set: { assignedTo: null, updatedAt: new Date() } },
    );
  }

  await col.deleteOne({ _id });
  return NextResponse.json({ ok: true });
}
