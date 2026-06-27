'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  KanbanSquare,
  Table2,
  UserCircle,
  Users,
  Plus,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { ThemeSync, ThemeToggle } from '@/components/ui/ThemeToggle';
import { MemberBadge } from '@/components/tasks/badges';
import { TaskFormDrawer } from '@/components/tasks/TaskFormDrawer';
import { TaskDetailDrawer } from '@/components/tasks/TaskDetailDrawer';
import { Toaster } from '@/components/tasks/Toaster';

const NAV = [
  { href: '/tasks', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/tasks/board', label: 'Board', icon: KanbanSquare },
  { href: '/tasks/table', label: 'Table', icon: Table2 },
  { href: '/tasks/my', label: 'My Tasks', icon: UserCircle },
];

export function TasksShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  const currentUser = useTaskStore((s) => s.currentUser);
  const bootstrap = useTaskStore((s) => s.bootstrap);
  const logout = useTaskStore((s) => s.logout);

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

  async function handleLogout() {
    await logout();
    router.replace('/tasks/login');
    router.refresh();
  }

  const nav = [...NAV];
  if (currentUser?.role === 'admin') {
    nav.push({ href: '/tasks/members', label: 'Members', icon: Users });
  }

  function isActive(item: { href: string; exact?: boolean }) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <ThemeSync />

      {/* Sidebar */}
      <aside
        className={
          'fixed inset-y-0 left-0 z-40 w-60 transform border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 md:static md:translate-x-0 ' +
          (navOpen ? 'translate-x-0' : '-translate-x-full')
        }
      >
        <div className="flex items-center justify-between px-5 py-4">
          <Link href="/tasks" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold">Team Tasks</span>
          </Link>
          <button onClick={() => setNavOpen(false)} className="text-slate-400 md:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 px-3">
          {nav.map(({ href, label, icon: Icon, ...rest }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setNavOpen(false)}
              className={
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ' +
                (isActive({ href, ...rest })
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-slate-200 p-3 dark:border-slate-800">
          {currentUser && (
            <div className="mb-2 px-2">
              <MemberBadge name={currentUser.name} />
              <div className="mt-0.5 pl-7 text-xs text-slate-400">{currentUser.designation}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {navOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 md:hidden" onClick={() => setNavOpen(false)} />
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
          <button onClick={() => setNavOpen(true)} className="text-slate-500 md:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" /> New task
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>

      {/* Shared drawers */}
      <TaskFormDrawer
        open={formOpen}
        task={editingTask}
        onClose={closeDrawers}
        onSaved={bumpRefresh}
      />
      <TaskDetailDrawer
        open={!!detailTaskId}
        taskId={detailTaskId}
        onClose={closeDrawers}
        onEdit={openEdit}
        onChanged={bumpRefresh}
      />

      <Toaster />
    </div>
  );
}
