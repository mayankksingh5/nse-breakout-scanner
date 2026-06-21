'use client';

import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useIpoStore } from '@/store/useIpoStore';

/**
 * Applies the persisted theme to <html> and keeps it in sync. Mount once near
 * the top of the IPO section. Returns nothing — purely a side-effect.
 */
export function ThemeSync() {
  const theme = useIpoStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  return null;
}

/** Light/dark switch button. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useIpoStore((s) => s.theme);
  const toggleTheme = useIpoStore((s) => s.toggleTheme);

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 ' +
        'bg-white text-slate-600 transition hover:bg-slate-100 ' +
        'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 ' +
        className
      }
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
