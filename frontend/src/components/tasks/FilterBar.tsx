'use client';

import { Search, X } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import {
  PRIORITIES,
  STATUSES,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '@/types/task';

const SORTS: { value: string; label: string }[] = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'created', label: 'Newest' },
  { value: 'due', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
];

const selectClass =
  'rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200';

interface FilterBarProps {
  /** Hide the assignee filter (e.g. on My Tasks). */
  showAssignee?: boolean;
}

export function FilterBar({ showAssignee = true }: FilterBarProps) {
  const filters = useTaskStore((s) => s.filters);
  const setFilter = useTaskStore((s) => s.setFilter);
  const resetFilters = useTaskStore((s) => s.resetFilters);
  const members = useTaskStore((s) => s.members);

  const dirty =
    filters.status || filters.priority || filters.assignedTo || filters.search;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          placeholder="Search tasks…"
          className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-700 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        />
      </div>

      <select
        value={filters.status}
        onChange={(e) => setFilter('status', e.target.value as typeof filters.status)}
        className={selectClass}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        value={filters.priority}
        onChange={(e) => setFilter('priority', e.target.value as typeof filters.priority)}
        className={selectClass}
        aria-label="Filter by priority"
      >
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABELS[p]}
          </option>
        ))}
      </select>

      {showAssignee && (
        <select
          value={filters.assignedTo}
          onChange={(e) => setFilter('assignedTo', e.target.value)}
          className={selectClass}
          aria-label="Filter by assignee"
        >
          <option value="">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      )}

      <select
        value={filters.sort}
        onChange={(e) => setFilter('sort', e.target.value)}
        className={selectClass}
        aria-label="Sort"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            Sort: {s.label}
          </option>
        ))}
      </select>

      {dirty && (
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      )}
    </div>
  );
}
