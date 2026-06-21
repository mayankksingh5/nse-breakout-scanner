'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Layers, Rocket } from 'lucide-react';
import { ALL_IPOS, rankByReturn } from '@/data/ipo';
import { currentReturnPct } from '@/types/ipo';
import { useIpoStore } from '@/store/useIpoStore';
import { applyIpoFilters } from '@/lib/filterIpos';
import { PageHeader } from '@/components/ipo/PageHeader';
import { IpoFilters } from '@/components/ipo/IpoFilters';
import { IpoGrid } from '@/components/ipo/IpoGrid';
import { ExportButtons } from '@/components/ipo/ExportButtons';
import { Card } from '@/components/ui/Card';
import { pct, trendColor } from '@/lib/format';

export default function IpoOverviewPage() {
  const filters = useIpoStore((s) => s.filters);
  const filtered = useMemo(() => applyIpoFilters(ALL_IPOS, filters), [filters]);

  const stats = useMemo(() => {
    const listed = ALL_IPOS.filter((i) => i.status === 'LISTED');
    const upcoming = ALL_IPOS.filter((i) => i.status === 'UPCOMING');
    const returns = listed.map((i) => currentReturnPct(i) ?? 0);
    const avg = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const ranked = rankByReturn();
    return {
      total: ALL_IPOS.length,
      listed: listed.length,
      upcoming: upcoming.length,
      avg,
      best: ranked[0],
      worst: ranked[ranked.length - 1],
    };
  }, []);

  return (
    <>
      <PageHeader
        title="IPO Tracker"
        subtitle="Every Indian IPO, year-wise — listings, returns, fundamentals and charts."
        actions={<ExportButtons ipos={filtered} filename="all-ipos.csv" />}
      />

      {/* Hero stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Layers className="h-5 w-5" />} label="Total IPOs" value={String(stats.total)} hint={`${stats.listed} listed · ${stats.upcoming} upcoming`} />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Avg Return"
          value={pct(stats.avg, 0)}
          valueClass={trendColor(stats.avg)}
          hint="from issue price"
        />
        {stats.best && (
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Top Gainer"
            value={pct(currentReturnPct(stats.best), 0)}
            valueClass="text-emerald-600 dark:text-emerald-400"
            hint={stats.best.companyName}
            href={`/ipo/company/${stats.best.slug}`}
          />
        )}
        {stats.worst && (
          <StatCard
            icon={<TrendingDown className="h-5 w-5" />}
            label="Top Loser"
            value={pct(currentReturnPct(stats.worst), 0)}
            valueClass="text-rose-600 dark:text-rose-400"
            hint={stats.worst.companyName}
            href={`/ipo/company/${stats.worst.slug}`}
          />
        )}
      </div>

      <div className="mb-5">
        <IpoFilters />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> IPOs
        </p>
        <Link
          href="/ipo/upcoming"
          className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          <Rocket className="h-4 w-4" /> See upcoming IPOs
        </Link>
      </div>

      <IpoGrid ipos={filtered} />
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  valueClass = '',
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
  href?: string;
}) {
  const inner = (
    <Card className="h-full p-4">
      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 ${valueClass}`}>{value}</div>
      {hint && <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
    </Card>
  );
  return href ? (
    <Link href={href} className="transition hover:opacity-90">
      {inner}
    </Link>
  ) : (
    inner
  );
}
