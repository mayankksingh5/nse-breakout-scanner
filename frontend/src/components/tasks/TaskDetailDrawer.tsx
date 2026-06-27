'use client';

import { useCallback, useEffect, useState } from 'react';
import { History, Pencil, Send, Trash2 } from 'lucide-react';
import { Drawer } from '@/components/tasks/Drawer';
import { PriorityBadge, StatusBadge } from '@/components/tasks/badges';
import { useTaskStore } from '@/store/useTaskStore';
import {
  addComment,
  deleteTask,
  fetchTaskDetail,
  updateTask,
} from '@/lib/tasksApi';
import { formatDate, formatDateTime } from '@/lib/taskFormat';
import {
  STATUSES,
  STATUS_LABELS,
  PRIORITY_LABELS,
  type Task,
  type Comment,
  type AuditEntry,
  type AuditChange,
  type Status,
} from '@/types/task';

interface TaskDetailDrawerProps {
  open: boolean;
  taskId: string | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onChanged: () => void;
}

export function TaskDetailDrawer({ open, taskId, onClose, onEdit, onChanged }: TaskDetailDrawerProps) {
  const memberName = useTaskStore((s) => s.memberName);
  const currentUser = useTaskStore((s) => s.currentUser);

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchTaskDetail(taskId);
      setTask(detail.task);
      setComments(detail.comments);
      setAudit(detail.audit);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (open && taskId) load();
  }, [open, taskId, load]);

  const canModify =
    !!task &&
    !!currentUser &&
    (currentUser.role === 'admin' ||
      task.createdBy === currentUser.id ||
      task.assignedTo === currentUser.id);
  const canDelete =
    !!task && !!currentUser && (currentUser.role === 'admin' || task.createdBy === currentUser.id);

  async function handleStatus(status: Status) {
    if (!task) return;
    try {
      const updated = await updateTask(task.id, { status });
      setTask(updated);
      onChanged();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    }
  }

  async function handleComment() {
    if (!task || !commentText.trim()) return;
    setPosting(true);
    try {
      const c = await addComment(task.id, commentText.trim());
      setComments((prev) => [...prev, c]);
      setCommentText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add comment');
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
      await deleteTask(task.id);
      onChanged();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete task');
    }
  }

  function renderChangeValue(field: string, value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (field === 'assignedTo') return memberName(String(value));
    if (field === 'status') return STATUS_LABELS[value as Status] ?? String(value);
    if (field === 'priority') return PRIORITY_LABELS[value as keyof typeof PRIORITY_LABELS] ?? String(value);
    if (field === 'dueDate') return formatDate(String(value));
    return String(value);
  }

  function changeLine(c: AuditChange): string {
    const label = c.field === 'assignedTo' ? 'assignee' : c.field === 'dueDate' ? 'due date' : c.field;
    return `${label}: ${renderChangeValue(c.field, c.from)} → ${renderChangeValue(c.field, c.to)}`;
  }

  return (
    <Drawer open={open} onClose={onClose} title="Task details">
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      )}

      {task && (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{task.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
          </div>

          {task.description && (
            <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
              {task.description}
            </p>
          )}

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs uppercase text-slate-400">Assigned to</dt>
              <dd className="text-slate-700 dark:text-slate-200">{memberName(task.assignedTo)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Created by</dt>
              <dd className="text-slate-700 dark:text-slate-200">{memberName(task.createdBy)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Due date</dt>
              <dd className="text-slate-700 dark:text-slate-200">{formatDate(task.dueDate)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Updated</dt>
              <dd className="text-slate-700 dark:text-slate-200">{formatDateTime(task.updatedAt)}</dd>
            </div>
          </dl>

          {/* Quick status + actions */}
          {canModify && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
              <select
                value={task.status}
                onChange={(e) => handleStatus(e.target.value as Status)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                aria-label="Change status"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <button
                onClick={() => onEdit(task)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              )}
            </div>
          )}

          {/* Comments */}
          <section className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Comments ({comments.length})
            </h4>
            <div className="space-y-3">
              {comments.length === 0 && (
                <p className="text-sm text-slate-400">No comments yet.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {memberName(c.authorId)}
                    </span>
                    <span className="text-xs text-slate-400">{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-end gap-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
                placeholder="Add a comment…"
                className="flex-1 resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                onClick={handleComment}
                disabled={posting || !commentText.trim()}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </section>

          {/* Audit history */}
          <section className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <h4 className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <History className="h-4 w-4" /> Activity
            </h4>
            <ol className="space-y-2">
              {audit.length === 0 && <p className="text-sm text-slate-400">No activity recorded.</p>}
              {audit.map((a) => (
                <li key={a.id} className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {memberName(a.actorId)}
                  </span>{' '}
                  {a.action}{' '}
                  <span className="text-slate-400">· {formatDateTime(a.createdAt)}</span>
                  {a.changes.length > 0 && (
                    <ul className="ml-3 mt-0.5 list-disc text-slate-400">
                      {a.changes.map((c, i) => (
                        <li key={i}>{changeLine(c)}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Drawer>
  );
}
