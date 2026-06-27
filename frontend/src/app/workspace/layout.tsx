'use client';

import { TasksShell } from '@/components/tasks/TasksShell';

/**
 * Layout for the internal team workspace. Every /workspace/* route is wrapped in
 * the shell (sidebar + shared TopBar). Access is enforced by middleware before
 * these pages render; sign-in happens via the global modal or the /login page.
 */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <TasksShell>{children}</TasksShell>;
}
