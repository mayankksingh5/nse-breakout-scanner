// Shared types for the internal team task-management system.
// These mirror the MongoDB documents but use string ids (ObjectIds are
// serialized to strings before leaving the API — see lib/server/serialize.ts).

export type Role = 'admin' | 'member';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type Status = 'new' | 'in_progress' | 'review' | 'done' | 'closed';

export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];

export const STATUSES: Status[] = ['new', 'in_progress', 'review', 'done', 'closed'];

export const STATUS_LABELS: Record<Status, string> = {
  new: 'New',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  closed: 'Closed',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

/** Order used to rank priority for sorting (higher = more urgent). */
export const PRIORITY_RANK: Record<Priority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  designation: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  createdBy: string | null;
  assignedTo: string | null;
  priority: Priority;
  status: Status;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string | null;
  body: string;
  createdAt: string;
}

export interface AuditChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface AuditEntry {
  id: string;
  taskId: string;
  actorId: string | null;
  action: 'created' | 'updated' | 'deleted';
  changes: AuditChange[];
  createdAt: string;
}

/** Task plus the people-lookup needed to render names without N requests. */
export interface TaskDetail {
  task: Task;
  comments: Comment[];
  audit: AuditEntry[];
}

export interface DashboardStats {
  total: number;
  pending: number; // new + in_progress
  inReview: number;
  completed: number; // done + closed
  byMember: { userId: string | null; name: string; open: number; total: number }[];
  recent: Task[];
}
