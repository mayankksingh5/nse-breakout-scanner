import { NextRequest, NextResponse } from 'next/server';
import { tasks, comments, toObjectId } from '@/lib/server/mongo';
import { requireAuth } from '@/lib/server/auth';
import { serializeComment } from '@/lib/server/serialize';

export const runtime = 'nodejs';

// GET /api/tasks/[id]/comments — comment history for a task, oldest first.
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;
  const taskId = toObjectId(id);
  if (!taskId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const docs = await (await comments()).find({ taskId }).sort({ createdAt: 1 }).toArray();
  return NextResponse.json(docs.map(serializeComment));
}

// POST /api/tasks/[id]/comments — add a comment (any authenticated member).
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;
  const taskId = toObjectId(id);
  if (!taskId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  if (!(await (await tasks()).findOne({ _id: taskId }))) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const text = body.body?.trim();
  if (!text) return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });

  const doc = {
    taskId,
    authorId: auth.user._id!,
    body: text,
    createdAt: new Date(),
  };
  const { insertedId } = await (await comments()).insertOne(doc);
  return NextResponse.json(serializeComment({ ...doc, _id: insertedId }), { status: 201 });
}
