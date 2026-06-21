'use client';

import { LayoutDashboard, Rocket, CalendarDays, Trophy, Star, GitCompareArrows } from 'lucide-react';
import type { IpoView } from '@/store/useIpoStore';
import { useIpoStore } from '@/store/useIpoStore';
import { IpoSearch } from '@/components/ipo/IpoSearch';
import { OverviewView } from '@/components/ipo/views/OverviewView';
import { UpcomingView } from '@/components/ipo/views/UpcomingView';
import { CalendarView } from '@/components/ipo/views/CalendarView';
import { RankingsView } from '@/components/ipo/views/RankingsView';
import { WatchlistView } from '@/components/ipo/views/WatchlistView';
import { CompareView } from '@/components/ipo/views/CompareView';

const SUB_NAV: { key: IpoView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'upcoming', label: 'Upcoming', icon: Rocket },
  { key: 'calendar', label: 'Calendar', icon: CalendarDays },
  { key: 'rankings', label: 'Rankings', icon: Trophy },
  { key: 'watchlist', label: 'Watchlist', icon: Star },
  { key: 'compare', label: 'Compare', icon: GitCompareArrows },
];

/** The IPO tab: global search + in-place secondary navigation between views. */
export function IpoDashboard() {
  const ipoView = useIpoStore((s) => s.ipoView);
  const setIpoView = useIpoStore((s) => s.setIpoView);
  const watchCount = useIpoStore((s) => s.watchlist.length);
  const compareCount = useIpoStore((s) => s.compare.length);

  return (
    <div className="px-4 py-6 sm:px-6">
      {/* Search + secondary nav */}
      <div className="mb-6 flex flex-col gap-4">
        <IpoSearch />
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
          {SUB_NAV.map(({ key, label, icon: Icon }) => {
            const active = ipoView === key;
            const badge = key === 'watchlist' ? watchCount : key === 'compare' ? compareCount : 0;
            return (
              <button
                key={key}
                onClick={() => setIpoView(key)}
                className={
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ' +
                  (active
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')
                }
              >
                <Icon className="h-4 w-4" />
                {label}
                {badge > 0 && (
                  <span
                    className={
                      'rounded-full px-1.5 text-xs font-semibold ' +
                      (active ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200')
                    }
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active view */}
      {ipoView === 'overview' && <OverviewView />}
      {ipoView === 'upcoming' && <UpcomingView />}
      {ipoView === 'calendar' && <CalendarView />}
      {ipoView === 'rankings' && <RankingsView />}
      {ipoView === 'watchlist' && <WatchlistView />}
      {ipoView === 'compare' && <CompareView />}
    </div>
  );
}
