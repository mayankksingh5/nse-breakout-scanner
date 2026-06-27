import { ObjectId, auditlogs, TaskDoc } from './mongo';

// Audit-log helpers. Every create/update/delete on a task writes one entry so
// the task detail drawer can show a full change history.

export interface FieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

/** Fields worth tracking in the audit trail (in display order). */
const TRACKED: (keyof TaskDoc)[] = [
  'title',
  'description',
  'assignedTo',
  'priority',
  'status',
  'dueDate',
];

function normalize(v: unknown): unknown {
  if (v instanceof ObjectId) return v.toString();
  if (v instanceof Date) return v.toISOString();
  return v ?? null;
}

/** Compute the changed fields between two task states. */
export function diffTask(before: Partial<TaskDoc>, after: Partial<TaskDoc>): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of TRACKED) {
    if (!(field in after)) continue;
    const from = normalize(before[field]);
    const to = normalize(after[field]);
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes.push({ field, from, to });
    }
  }
  return changes;
}

export async function recordAudit(
  taskId: ObjectId,
  actorId: ObjectId | null,
  action: 'created' | 'updated' | 'deleted',
  changes: FieldChange[],
): Promise<void> {
  // Skip no-op updates (nothing actually changed).
  if (action === 'updated' && changes.length === 0) return;
  await (await auditlogs()).insertOne({
    taskId,
    actorId,
    action,
    changes,
    createdAt: new Date(),
  });
}
