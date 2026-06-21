'use client';

import { useIpoStore } from '@/store/useIpoStore';
import { AppHeader } from '@/components/AppHeader';
import { WelcomeSplash } from '@/components/WelcomeSplash';
import { StocksView } from '@/components/stocks/StocksView';
import { IpoDashboard } from '@/components/ipo/IpoDashboard';
import { CompareTray } from '@/components/ipo/CompareTray';
import { ThemeSync } from '@/components/ui/ThemeToggle';

/**
 * Single-page dashboard. The Stocks and IPO views are BOTH mounted at all
 * times and only toggled with `hidden`, so switching tabs is instant and
 * preserves each view's internal state (filters, fetched signals, scroll) —
 * no route change, no refetch, no full refresh.
 */
export default function Home() {
  const activeTab = useIpoStore((s) => s.activeTab);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <ThemeSync />
      <WelcomeSplash />
      <AppHeader />

      <main className="mx-auto max-w-7xl pb-28">
        <div className={activeTab === 'stocks' ? '' : 'hidden'}>
          <StocksView />
        </div>
        <div className={activeTab === 'ipo' ? '' : 'hidden'}>
          <IpoDashboard />
        </div>
      </main>

      <CompareTray />
    </div>
  );
}
