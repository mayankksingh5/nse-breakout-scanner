'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  KanbanSquare,
  UserCircle,
  Users,
  User as UserIcon,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { TopBar } from '@/components/nav/TopBar';
import { TaskFormDrawer } from '@/components/tasks/TaskFormDrawer';
import { TaskDetailDrawer } from '@/components/tasks/TaskDetailDrawer';

const NAV = [
  { href: '/workspace', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/workspace/tasks', label: 'Tasks', icon: KanbanSquare },
  { href: '/workspace/my', label: 'My Tasks', icon: UserCircle },
  { href: '/workspace/profile', label: 'Profile', icon: UserIcon },
];

export function TasksShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const currentUser = useTaskStore((s) => s.currentUser);
  const bootstrap = useTaskStore((s) => s.bootstrap);

  const formOpen = useTaskStore((s) => s.formOpen);
  const editingTask = useTaskStore((s) => s.editingTask);
  const detailTaskId = useTaskStore((s) => s.detailTaskId);
  const openCreate = useTaskStore((s) => s.openCreate);
  const openEdit = useTaskStore((s) => s.openEdit);
  const closeDrawers = useTaskStore((s) => s.closeDrawers);
  const bumpRefresh = useTaskStore((s) => s.bumpRefresh);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const nav = [...NAV];
  if (currentUser?.role === 'admin') {
    // Insert Members before Profile.
    nav.splice(3, 0, { href: '/workspace/members', label: 'Members', icon: Users });
  }

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const linkClass = (active: boolean) =>
    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ' +
    (active
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800');

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <TopBar />

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 px-3 py-4 dark:border-slate-800 md:flex">
          <Link
            href="/"
            className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>

          <button
            onClick={openCreate}
            className="mb-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" /> New task
          </button>

          <nav className="space-y-1">
            {nav.map(({ href, label, icon: Icon, ...rest }) => (
              <Link key={href} href={href} className={linkClass(isActive({ href, ...rest }))}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          {currentUser && (
            <div className="mt-auto rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-900">
              <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{currentUser.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{currentUser.designation}</div>
            </div>
          )}
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile section nav */}
          <nav className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 px-3 py-2 dark:border-slate-800 md:hidden">
            <button
              onClick={openCreate}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> New
            </button>
            {nav.map(({ href, label, exact }) => (
              <Link
                key={href}
                href={href}
                className={
                  'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ' +
                  (isActive({ href, exact })
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-300')
                }
              >
                {label}
              </Link>
            ))}
          </nav>

          <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>

      {/* Shared drawers */}
      <TaskFormDrawer open={formOpen} task={editingTask} onClose={closeDrawers} onSaved={bumpRefresh} />
      <TaskDetailDrawer
        open={!!detailTaskId}
        taskId={detailTaskId}
        onClose={closeDrawers}
        onEdit={openEdit}
        onChanged={bumpRefresh}
      />
    </div>
  );
}
