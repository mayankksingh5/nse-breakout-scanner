'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LineChart,
  KanbanSquare,
  ChevronDown,
  LogOut,
  User as UserIcon,
  ListTodo,
  Users,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react';
import { useIpoStore, type AppTab } from '@/store/useIpoStore';
import { useTaskStore } from '@/store/useTaskStore';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface MarketLink {
  label: string;
  tab: AppTab;
  anchor?: string;
}

// Public market sections. Stocks/Scanner/Market Data are facets of the Stocks
// view (which renders the market-indices strip + the breakout scanner table).
const MARKET_LINKS: MarketLink[] = [
  { label: 'Home', tab: 'stocks' },
  { label: 'Stocks', tab: 'stocks' },
  { label: 'IPO', tab: 'ipo' },
  { label: 'Scanner', tab: 'stocks', anchor: 'scanner' },
  { label: 'Market Data', tab: 'stocks', anchor: 'market-data' },
];

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();

  const setActiveTab = useIpoStore((s) => s.setActiveTab);
  const currentUser = useTaskStore((s) => s.currentUser);
  const openSignIn = useTaskStore((s) => s.openSignIn);

  const [mobileOpen, setMobileOpen] = useState(false);

  function goMarket(link: MarketLink) {
    setActiveTab(link.tab);
    setMobileOpen(false);
    if (pathname !== '/') {
      router.push(link.anchor ? `/#${link.anchor}` : '/');
    } else if (link.anchor) {
      document.getElementById(link.anchor)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-slate-950">
            <LineChart className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold leading-tight text-slate-900 dark:text-slate-100">Ultra Scanner</div>
            <div className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">Markets &amp; Team Workspace</div>
          </div>
        </Link>

        {/* Desktop market nav */}
        <nav className="ml-2 hidden items-center gap-0.5 md:flex">
          {MARKET_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => goMarket(link)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {currentUser && (
            <Link
              href="/workspace"
              className={
                'hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition sm:inline-flex ' +
                (pathname.startsWith('/workspace')
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')
              }
            >
              <KanbanSquare className="h-4 w-4" /> Workspace
            </Link>
          )}

          <ThemeToggle />

          {currentUser ? (
            <AvatarMenu />
          ) : (
            <button
              onClick={() => openSignIn()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Sign in
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg p-1.5 text-slate-500 md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-slate-200 px-4 py-2 md:hidden dark:border-slate-800">
          {MARKET_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => goMarket(link)}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {link.label}
            </button>
          ))}
          {currentUser && (
            <Link
              href="/workspace"
              onClick={() => setMobileOpen(false)}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-emerald-600 dark:text-emerald-400"
            >
              Workspace
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

/** Avatar dropdown shown when signed in. */
function AvatarMenu() {
  const router = useRouter();
  const currentUser = useTaskStore((s) => s.currentUser);
  const logout = useTaskStore((s) => s.logout);
  const pushToast = useTaskStore((s) => s.pushToast);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!currentUser) return null;

  const initials = currentUser.name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function handleLogout() {
    setOpen(false);
    await logout();
    pushToast('success', 'Signed out');
    router.push('/');
    router.refresh();
  }

  const item =
    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 py-1 pl-1 pr-2 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          {initials || '?'}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="px-3 py-2">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{currentUser.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{currentUser.designation}</div>
          </div>
          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
          <Link href="/workspace" onClick={() => setOpen(false)} className={item}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link href="/workspace/my" onClick={() => setOpen(false)} className={item}>
            <ListTodo className="h-4 w-4" /> My Tasks
          </Link>
          {currentUser.role === 'admin' && (
            <Link href="/workspace/members" onClick={() => setOpen(false)} className={item}>
              <Users className="h-4 w-4" /> Members
            </Link>
          )}
          <Link href="/workspace/profile" onClick={() => setOpen(false)} className={item}>
            <UserIcon className="h-4 w-4" /> Profile
          </Link>
          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
          <button onClick={handleLogout} className={item}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
