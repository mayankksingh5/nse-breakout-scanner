import { NextRequest, NextResponse } from 'next/server';
import { tasks, toObjectId, ObjectId } from '@/lib/server/mongo';
import type { TaskDoc } from '@/lib/server/mongo';
import { requireAuth } from '@/lib/server/auth';
import { serializeTask } from '@/lib/server/serialize';
import { recordAudit, diffTask } from '@/lib/server/audit';
import { PRIORITY_RANK, PRIORITIES, STATUSES } from '@/types/task';
import type { Priority, Status } from '@/types/task';

export const runtime = 'nodejs';

// GET /api/tasks — list with optional filters: status, priority, assignedTo,
// search (title/description), mine=1, and sort (updated|created|due|priority|status).
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const q = req.nextUrl.searchParams;
  const filter: Record<string, unknown> = {};

  const status = q.get('status');
  if (status && (STATUSES as string[]).includes(status)) filter.status = status;

  const priority = q.get('priority');
  if (priority && (PRIORITIES as string[]).includes(priority)) filter.priority = priority;

  const assignedTo = q.get('assignedTo');
  if (assignedTo === 'unassigned') filter.assignedTo = null;
  else if (assignedTo) filter.assignedTo = toObjectId(assignedTo);

  if (q.get('mine') === '1') filter.assignedTo = auth.user._id;

  const search = q.get('search')?.trim();
  if (search) {
    const rx = { $regex: search, $options: 'i' };
    filter.$or = [{ title: rx }, { description: rx }];
  }

  const docs = await (await tasks()).find(filter).toArray();

  // Sort in JS so priority can use a custom rank ordering.
  const sort = q.get('sort') ?? 'updated';
  docs.sort((a, b) => {
    switch (sort) {
      case 'due': {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return da - db;
      }
      case 'priority':
        return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      case 'status':
        return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'updated':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  return NextResponse.json(docs.map(serializeTask));
}

// POST /api/tasks — create a task (any authenticated user).
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

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

  const title = body.title?.trim();
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const priority: Priority = (PRIORITIES as string[]).includes(body.priority ?? '')
    ? (body.priority as Priority)
    : 'medium';
  const status: Status = (STATUSES as string[]).includes(body.status ?? '')
    ? (body.status as Status)
    : 'new';
  const assignedTo = body.assignedTo ? toObjectId(body.assignedTo) : null;
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;

  const now = new Date();
  const doc: TaskDoc = {
    title,
    description: body.description?.trim() ?? '',
    createdBy: auth.user._id as ObjectId,
    assignedTo,
    priority,
    status,
    dueDate: dueDate && !isNaN(dueDate.getTime()) ? dueDate : null,
    createdAt: now,
    updatedAt: now,
  };

  const { insertedId } = await (await tasks()).insertOne(doc);
  await recordAudit(insertedId, auth.user._id as ObjectId, 'created', diffTask({}, doc));

  return NextResponse.json(serializeTask({ ...doc, _id: insertedId }), { status: 201 });
}
