'use client';

import { useEffect, useState } from 'react';
import { Drawer } from '@/components/tasks/Drawer';
import { useTaskStore } from '@/store/useTaskStore';
import { createTask, updateTask, type TaskInput } from '@/lib/tasksApi';
import { toDateInput } from '@/lib/taskFormat';
import {
  PRIORITIES,
  STATUSES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type Task,
  type Priority,
  type Status,
} from '@/types/task';

interface TaskFormDrawerProps {
  open: boolean;
  onClose: () => void;
  /** null/undefined → create mode; a task → edit mode. */
  task?: Task | null;
  onSaved: () => void;
}

const fieldClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400';

export function TaskFormDrawer({ open, onClose, task, onSaved }: TaskFormDrawerProps) {
  const members = useTaskStore((s) => s.members);
  const isEdit = !!task;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>('new');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the form whenever the drawer opens for a (different) task.
  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setAssignedTo(task?.assignedTo ?? '');
    setPriority(task?.priority ?? 'medium');
    setStatus(task?.status ?? 'new');
    setDueDate(toDateInput(task?.dueDate ?? null));
    setError(null);
  }, [open, task]);

  async function handleSubmit() {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError(null);
    const payload: TaskInput = {
      title: title.trim(),
      description: description.trim(),
      assignedTo: assignedTo || null,
      priority,
      status,
      dueDate: dueDate || null,
    };
    try {
      if (isEdit && task) await updateTask(task.id, payload);
      else await createTask(payload);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save task');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'Create task'}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
            {error}
          </div>
        )}

        <div>
          <label className={labelClass}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short, action-oriented title"
            className={fieldClass}
            autoFocus
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Add detail, acceptance criteria, links…"
            className={`${fieldClass} resize-y`}
          />
        </div>

        <div>
          <label className={labelClass}>Assignee</label>
          <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={fieldClass}>
            <option value="">Unassigned</option>
            {members
              .filter((m) => m.active)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.designation}
                </option>
              ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={fieldClass}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={fieldClass}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Due date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={fieldClass} />
        </div>
      </div>
    </Drawer>
  );
}
