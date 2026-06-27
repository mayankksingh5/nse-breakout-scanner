'use client';

import { ArrowUpDown } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { PriorityBadge, StatusBadge } from '@/components/tasks/badges';
import { formatDate, formatDateTime, dueState, DUE_CLASS } from '@/lib/taskFormat';
import type { Task } from '@/types/task';

const SORTABLE: { key: string; label: string; sort?: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'priority', label: 'Priority', sort: 'priority' },
  { key: 'status', label: 'Status', sort: 'status' },
  { key: 'due', label: 'Due', sort: 'due' },
  { key: 'updated', label: 'Updated', sort: 'updated' },
];

export function TaskTable({ tasks, loading }: { tasks: Task[]; loading: boolean }) {
  const memberName = useTaskStore((s) => s.memberName);
  const openDetail = useTaskStore((s) => s.openDetail);
  const setFilter = useTaskStore((s) => s.setFilter);
  const currentSort = useTaskStore((s) => s.filters.sort);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            {SORTABLE.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium">
                {col.sort ? (
                  <button
                    onClick={() => setFilter('sort', col.sort!)}
                    className={
                      'inline-flex items-center gap-1 transition hover:text-slate-700 dark:hover:text-slate-200 ' +
                      (currentSort === col.sort ? 'text-emerald-600 dark:text-emerald-400' : '')
                    }
                  >
                    {col.label}
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {tasks.map((t) => (
            <tr
              key={t.id}
              onClick={() => openDetail(t.id)}
              className="cursor-pointer bg-white transition hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900"
            >
              <td className="max-w-xs px-4 py-3">
                <div className="truncate font-medium text-slate-800 dark:text-slate-100">{t.title}</div>
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{memberName(t.assignedTo)}</td>
              <td className="px-4 py-3">
                <PriorityBadge priority={t.priority} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={t.status} />
              </td>
              <td className={`px-4 py-3 ${DUE_CLASS[dueState(t.dueDate)]}`}>{formatDate(t.dueDate)}</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDateTime(t.updatedAt)}</td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={SORTABLE.length} className="px-4 py-10 text-center text-slate-400">
                {loading ? 'Loading…' : 'No tasks match the current filters.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
