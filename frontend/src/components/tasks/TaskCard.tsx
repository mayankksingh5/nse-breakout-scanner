'use client';

import { CalendarClock } from 'lucide-react';
import type { Task } from '@/types/task';
import { useTaskStore } from '@/store/useTaskStore';
import { PriorityBadge } from '@/components/tasks/badges';
import { dueState, DUE_CLASS, formatDate } from '@/lib/taskFormat';

interface TaskCardProps {
  task: Task;
  onOpen: (task: Task) => void;
  /** Enables native HTML5 drag (Kanban). */
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
}

/** Compact task card shared by the Kanban board. */
export function TaskCard({ task, onOpen, draggable, onDragStart }: TaskCardProps) {
  const memberName = useTaskStore((s) => s.memberName);
  const due = dueState(task.dueDate);

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart ? (e) => onDragStart(e, task) : undefined}
      onClick={() => onOpen(task)}
      className="group w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/40"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {task.title}
        </span>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-slate-600 dark:text-slate-300">
          {memberName(task.assignedTo)}
        </span>
        {task.dueDate && (
          <span className={`inline-flex items-center gap-1 ${DUE_CLASS[due]}`}>
            <CalendarClock className="h-3.5 w-3.5" />
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </button>
  );
}
