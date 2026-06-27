'use client';

import { usePathname } from 'next/navigation';
import { TasksShell } from '@/components/tasks/TasksShell';

/**
 * Layout for the whole task-management section. The login page renders on its
 * own (no sidebar/topbar); every other /tasks/* route is wrapped in the shell.
 * Access is enforced by middleware before these pages ever render.
 */
export default function TasksLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/tasks/login') return <>{children}</>;
  return <TasksShell>{children}</TasksShell>;
}
