'use client';

import { LineChart, Rocket } from 'lucide-react';
import type { AppTab } from '@/store/useIpoStore';
import { useIpoStore } from '@/store/useIpoStore';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const TABS: { key: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'stocks', label: 'Stocks', icon: LineChart },
  { key: 'ipo', label: 'IPO', icon: Rocket },
];

/**
 * Sticky top bar with the primary Stocks / IPO tabs. Switching only updates
 * store state — both views stay mounted, so there is no navigation or refresh.
 */
export function AppHeader() {
  const activeTab = useIpoStore((s) => s.activeTab);
  const setActiveTab = useIpoStore((s) => s.setActiveTab);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-slate-950">
            <LineChart className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold leading-tight text-slate-900 dark:text-slate-100">Alpha Terminal</div>
            <div className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">NSE India</div>
          </div>
        </div>

        {/* Tab switcher */}
        <nav className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                aria-current={active ? 'page' : undefined}
                className={
                  'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition ' +
                  (active
                    ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-800 dark:text-emerald-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200')
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
