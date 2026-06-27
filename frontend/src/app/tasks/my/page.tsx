'use client';

import { useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { FilterBar } from '@/components/tasks/FilterBar';
import { TaskTable } from '@/components/tasks/TaskTable';

export default function MyTasksPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const loading = useTaskStore((s) => s.loading);
  const filters = useTaskStore((s) => s.filters);
  const refreshSignal = useTaskStore((s) => s.refreshSignal);
  const refreshTasks = useTaskStore((s) => s.refreshTasks);
  const currentUser = useTaskStore((s) => s.currentUser);

  // Only the tasks assigned to me (server enforces via mine=1).
  useEffect(() => {
    refreshTasks({ mine: true });
  }, [refreshTasks, filters, refreshSignal, currentUser]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Tasks</h1>
      <FilterBar showAssignee={false} />
      <TaskTable tasks={tasks} loading={loading} />
    </div>
  );
}
