import type { UserDoc, TaskDoc, CommentDoc, AuditDoc } from './mongo';
import type { User, Task, Comment, AuditEntry } from '@/types/task';

// Convert stored documents (ObjectIds + Dates) into the JSON-safe shapes the
// client consumes (string ids + ISO dates). passwordHash is never exposed.

const oid = (v: { toString(): string } | null | undefined): string | null =>
  v ? v.toString() : null;

const iso = (d: Date | null | undefined): string | null =>
  d ? new Date(d).toISOString() : null;

export function serializeUser(doc: UserDoc): User {
  return {
    id: oid(doc._id)!,
    name: doc.name,
    email: doc.email,
    role: doc.role,
    designation: doc.designation,
    active: doc.active,
    createdAt: iso(doc.createdAt)!,
    updatedAt: iso(doc.updatedAt)!,
  };
}

export function serializeTask(doc: TaskDoc): Task {
  return {
    id: oid(doc._id)!,
    title: doc.title,
    description: doc.description,
    createdBy: oid(doc.createdBy),
    assignedTo: oid(doc.assignedTo),
    priority: doc.priority,
    status: doc.status,
    dueDate: iso(doc.dueDate),
    createdAt: iso(doc.createdAt)!,
    updatedAt: iso(doc.updatedAt)!,
  };
}

export function serializeComment(doc: CommentDoc): Comment {
  return {
    id: oid(doc._id)!,
    taskId: oid(doc.taskId)!,
    authorId: oid(doc.authorId),
    body: doc.body,
    createdAt: iso(doc.createdAt)!,
  };
}

export function serializeAudit(doc: AuditDoc): AuditEntry {
  return {
    id: oid(doc._id)!,
    taskId: oid(doc.taskId)!,
    actorId: oid(doc.actorId),
    action: doc.action,
    changes: doc.changes ?? [],
    createdAt: iso(doc.createdAt)!,
  };
}
