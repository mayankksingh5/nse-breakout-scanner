'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  LayoutDashboard,
  TrendingUp,
  CalendarDays,
  Rocket,
  Trophy,
  Star,
  GitCompareArrows,
  LineChart,
} from 'lucide-react';
import { IPO_YEARS } from '@/data/ipo';
import { useIpoStore } from '@/store/useIpoStore';

interface SidebarProps {
  /** Called when a link is tapped (used to close the mobile drawer). */
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const watchCount = useIpoStore((s) => s.watchlist.length);
  const compareCount = useIpoStore((s) => s.compare.length);

  // Keep the IPO accordion open whenever we're inside the IPO section.
  const [ipoOpen, setIpoOpen] = useState(true);

  const isActive = (href: string) =>
    href === '/ipo' ? pathname === '/ipo' : pathname.startsWith(href);

  const linkCls = (active: boolean) =>
    'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ' +
    (active
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800');

  return (
    <nav className="flex h-full flex-col gap-1 p-4">
      <Link href="/" onClick={onNavigate} className="mb-4 flex items-center gap-2 px-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-slate-950">
          <LineChart className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">IPO Tracker</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">NSE / BSE India</div>
        </div>
      </Link>

      <Link href="/ipo" onClick={onNavigate} className={linkCls(isActive('/ipo') && pathname === '/ipo')}>
        <span className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4" /> Overview
        </span>
      </Link>

      {/* IPO accordion */}
      <button
        onClick={() => setIpoOpen((o) => !o)}
        className="mt-1 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <span className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> IPO
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${ipoOpen ? 'rotate-180' : ''}`} />
      </button>

      {ipoOpen && (
        <div className="ml-3 flex flex-col gap-0.5 border-l border-slate-200 pl-3 dark:border-slate-800">
          {IPO_YEARS.map((year) => {
            const href = `/ipo/year/${year}`;
            const active = pathname === href;
            return (
              <Link
                key={year}
                href={href}
                onClick={onNavigate}
                className={
                  'rounded-md px-3 py-1.5 text-sm transition ' +
                  (active
                    ? 'bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800')
                }
              >
                {year}
              </Link>
            );
          })}
        </div>
      )}

      <div className="my-3 border-t border-slate-200 dark:border-slate-800" />

      <Link href="/ipo/upcoming" onClick={onNavigate} className={linkCls(isActive('/ipo/upcoming'))}>
        <span className="flex items-center gap-2">
          <Rocket className="h-4 w-4" /> Upcoming
        </span>
      </Link>
      <Link href="/ipo/calendar" onClick={onNavigate} className={linkCls(isActive('/ipo/calendar'))}>
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> IPO Calendar
        </span>
      </Link>
      <Link href="/ipo/rankings" onClick={onNavigate} className={linkCls(isActive('/ipo/rankings'))}>
        <span className="flex items-center gap-2">
          <Trophy className="h-4 w-4" /> Rankings
        </span>
      </Link>
      <Link href="/ipo/watchlist" onClick={onNavigate} className={linkCls(isActive('/ipo/watchlist'))}>
        <span className="flex items-center gap-2">
          <Star className="h-4 w-4" /> Watchlist
        </span>
        {watchCount > 0 && (
          <span className="rounded-full bg-amber-500/20 px-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            {watchCount}
          </span>
        )}
      </Link>
      <Link href="/ipo/compare" onClick={onNavigate} className={linkCls(isActive('/ipo/compare'))}>
        <span className="flex items-center gap-2">
          <GitCompareArrows className="h-4 w-4" /> Compare
        </span>
        {compareCount > 0 && (
          <span className="rounded-full bg-blue-500/20 px-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            {compareCount}
          </span>
        )}
      </Link>

      <div className="mt-auto pt-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="block rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          ← Breakout Scanner
        </Link>
      </div>
    </nav>
  );
}
