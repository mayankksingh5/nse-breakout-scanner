'use client';

import { useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { updateTask } from '@/lib/tasksApi';
import { TaskCard } from '@/components/tasks/TaskCard';
import { STATUSES, STATUS_LABELS, type Status, type Task } from '@/types/task';

const COLUMN_ACCENT: Record<Status, string> = {
  new: 'border-t-slate-400',
  in_progress: 'border-t-blue-500',
  review: 'border-t-violet-500',
  done: 'border-t-emerald-500',
  closed: 'border-t-slate-500',
};

/** Drag-and-drop Kanban board driven by the shared task store. */
export function KanbanBoard() {
  const tasks = useTaskStore((s) => s.tasks);
  const loading = useTaskStore((s) => s.loading);
  const openDetail = useTaskStore((s) => s.openDetail);
  const bumpRefresh = useTaskStore((s) => s.bumpRefresh);
  const pushToast = useTaskStore((s) => s.pushToast);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Status | null>(null);

  function onDragStart(e: React.DragEvent, task: Task) {
    setDragId(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  }

  async function onDrop(status: Status) {
    setDragOver(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    try {
      await updateTask(id, { status });
      bumpRefresh();
    } catch (e) {
      pushToast('error', e instanceof Error ? e.message : 'Could not move task');
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {STATUSES.map((status) => {
        const colTasks = tasks.filter((t) => t.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(status);
            }}
            onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
            onDrop={() => onDrop(status)}
            className={
              `flex min-h-[60vh] flex-col rounded-xl border border-t-4 bg-slate-100/60 p-2 dark:bg-slate-900/40 ${COLUMN_ACCENT[status]} ` +
              (dragOver === status
                ? 'border-emerald-400 ring-2 ring-emerald-400/30'
                : 'border-slate-200 dark:border-slate-800')
            }
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {STATUS_LABELS[status]}
              </span>
              <span className="rounded-full bg-slate-200 px-2 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {colTasks.length}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              {colTasks.map((task) => (
                <TaskCard key={task.id} task={task} onOpen={(t) => openDetail(t.id)} draggable onDragStart={onDragStart} />
              ))}
              {colTasks.length === 0 && !loading && (
                <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400 dark:border-slate-800">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
