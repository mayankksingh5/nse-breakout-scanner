import { ThemeSync, ThemeToggle } from '@/components/ui/ThemeToggle';
import { BackButton } from '@/components/ui/BackButton';

/** Standalone layout for the /stocks/* and /indices/* detail routes. */
export function QuoteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <ThemeSync />

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 print:hidden">
        <BackButton />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-20 sm:px-6">{children}</main>
    </div>
  );
}
