'use client';

import { useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { FilterBar } from '@/components/tasks/FilterBar';
import { TaskTable } from '@/components/tasks/TaskTable';

export default function TablePage() {
  const tasks = useTaskStore((s) => s.tasks);
  const loading = useTaskStore((s) => s.loading);
  const filters = useTaskStore((s) => s.filters);
  const refreshSignal = useTaskStore((s) => s.refreshSignal);
  const refreshTasks = useTaskStore((s) => s.refreshTasks);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks, filters, refreshSignal]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">All Tasks</h1>
      <FilterBar />
      <TaskTable tasks={tasks} loading={loading} />
    </div>
  );
}
