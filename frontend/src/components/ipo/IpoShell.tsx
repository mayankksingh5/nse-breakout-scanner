'use client';

import { IpoSearch } from './IpoSearch';
import { CompareTray } from './CompareTray';
import { ThemeSync, ThemeToggle } from '@/components/ui/ThemeToggle';
import { BackButton } from '@/components/ui/BackButton';

/**
 * Minimal layout for standalone /ipo/* routes (e.g. the company detail page and
 * deep links). The primary navigation now lives in the homepage tab dashboard,
 * so this just offers a way back plus search and theme controls.
 */
export function IpoShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <ThemeSync />

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 print:hidden">
        <BackButton />
        <IpoSearch />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-28">{children}</main>

      <CompareTray />
    </div>
  );
}
