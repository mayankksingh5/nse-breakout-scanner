'use client';

import { useEffect, useState } from 'react';
import { KanbanSquare, Table2, Plus } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { FilterBar } from '@/components/tasks/FilterBar';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { TaskTable } from '@/components/tasks/TaskTable';

type View = 'board' | 'table';

export default function TasksPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const loading = useTaskStore((s) => s.loading);
  const filters = useTaskStore((s) => s.filters);
  const refreshSignal = useTaskStore((s) => s.refreshSignal);
  const refreshTasks = useTaskStore((s) => s.refreshTasks);
  const openCreate = useTaskStore((s) => s.openCreate);

  const [view, setView] = useState<View>('board');

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks, filters, refreshSignal]);

  const toggle = (v: View, label: string, Icon: typeof KanbanSquare) => (
    <button
      onClick={() => setView(v)}
      className={
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ' +
        (view === v
          ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-800 dark:text-emerald-400'
          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200')
      }
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Tasks</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
            {toggle('board', 'Board', KanbanSquare)}
            {toggle('table', 'Table', Table2)}
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" /> New task
          </button>
        </div>
      </div>

      <FilterBar />

      {view === 'board' ? <KanbanBoard /> : <TaskTable tasks={tasks} loading={loading} />}
    </div>
  );
}
