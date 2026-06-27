import { NextRequest, NextResponse } from 'next/server';
import { tasks, comments, auditlogs, toObjectId } from '@/lib/server/mongo';
import type { TaskDoc, UserDoc } from '@/lib/server/mongo';
import { requireAuth } from '@/lib/server/auth';
import { serializeTask, serializeComment, serializeAudit } from '@/lib/server/serialize';
import { recordAudit, diffTask } from '@/lib/server/audit';
import { PRIORITIES, STATUSES } from '@/types/task';
import type { Priority, Status } from '@/types/task';

export const runtime = 'nodejs';

/** Members may edit tasks they created or are assigned to; admins may edit any. */
function canEdit(user: UserDoc, task: TaskDoc): boolean {
  if (user.role === 'admin') return true;
  return (
    !!task.createdBy && user._id!.equals(task.createdBy) ||
    (!!task.assignedTo && user._id!.equals(task.assignedTo))
  );
}

/** Reassigning a task is limited to admins and the task creator. */
function canReassign(user: UserDoc, task: TaskDoc): boolean {
  if (user.role === 'admin') return true;
  return !!task.createdBy && user._id!.equals(task.createdBy);
}

// GET /api/tasks/[id] — task plus its comments and audit history.
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;
  const _id = toObjectId(id);
  if (!_id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const task = await (await tasks()).findOne({ _id });
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  const [commentDocs, auditDocs] = await Promise.all([
    (await comments()).find({ taskId: _id }).sort({ createdAt: 1 }).toArray(),
    (await auditlogs()).find({ taskId: _id }).sort({ createdAt: -1 }).toArray(),
  ]);

  return NextResponse.json({
    task: serializeTask(task),
    comments: commentDocs.map(serializeComment),
    audit: auditDocs.map(serializeAudit),
  });
}

// PATCH /api/tasks/[id] — edit fields / reassign / change status, priority, due
// date. Writes an audit-log diff for every change.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;
  const _id = toObjectId(id);
  if (!_id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const col = await tasks();
  const existing = await col.findOne({ _id });
  if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  if (!canEdit(auth.user, existing)) {
    return NextResponse.json({ error: 'You do not have permission to edit this task' }, { status: 403 });
  }

  let body: {
    title?: string;
    description?: string;
    assignedTo?: string | null;
    priority?: Priority;
    status?: Status;
    dueDate?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const update: Partial<TaskDoc> = {};
  if (typeof body.title === 'string' && body.title.trim()) update.title = body.title.trim();
  if (typeof body.description === 'string') update.description = body.description.trim();
  if (body.priority && (PRIORITIES as string[]).includes(body.priority)) update.priority = body.priority;
  if (body.status && (STATUSES as string[]).includes(body.status)) update.status = body.status;
  if (body.dueDate !== undefined) {
    if (body.dueDate === null || body.dueDate === '') update.dueDate = null;
    else {
      const d = new Date(body.dueDate);
      if (!isNaN(d.getTime())) update.dueDate = d;
    }
  }

  // Reassignment is gated separately from general edits.
  if (body.assignedTo !== undefined) {
    const newAssignee = body.assignedTo ? toObjectId(body.assignedTo) : null;
    const changing =
      (newAssignee?.toString() ?? null) !== (existing.assignedTo?.toString() ?? null);
    if (changing && !canReassign(auth.user, existing)) {
      return NextResponse.json(
        { error: 'Only the creator or an admin can reassign this task' },
        { status: 403 },
      );
    }
    update.assignedTo = newAssignee;
  }

  const changes = diffTask(existing, update);
  if (changes.length === 0) {
    return NextResponse.json(serializeTask(existing));
  }

  update.updatedAt = new Date();
  const result = await col.findOneAndUpdate({ _id }, { $set: update }, { returnDocument: 'after' });
  await recordAudit(_id, auth.user._id!, 'updated', changes);

  return NextResponse.json(serializeTask(result!));
}

// DELETE /api/tasks/[id] — remove a task (admin or the task creator). Also
// cleans up its comments and writes a final audit entry.
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;
  const _id = toObjectId(id);
  if (!_id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const col = await tasks();
  const existing = await col.findOne({ _id });
  if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  const isCreator = !!existing.createdBy && auth.user._id!.equals(existing.createdBy);
  if (auth.user.role !== 'admin' && !isCreator) {
    return NextResponse.json(
      { error: 'Only the creator or an admin can delete this task' },
      { status: 403 },
    );
  }

  await recordAudit(_id, auth.user._id!, 'deleted', []);
  await col.deleteOne({ _id });
  await (await comments()).deleteMany({ taskId: _id });

  return NextResponse.json({ ok: true });
}
