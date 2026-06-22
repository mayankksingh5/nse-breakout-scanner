import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeSync, ThemeToggle } from '@/components/ui/ThemeToggle';

/** Standalone layout for the /stocks/* and /indices/* detail routes. */
export function QuoteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <ThemeSync />

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 print:hidden">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-20 sm:px-6">{children}</main>
    </div>
  );
}
