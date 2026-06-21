'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Trophy, TrendingDown } from 'lucide-react';
import type { Ipo } from '@/types/ipo';
import { currentReturnPct } from '@/types/ipo';
import { rankByReturn } from '@/data/ipo';
import { PageHeader } from '@/components/ipo/PageHeader';
import { ExportButtons } from '@/components/ipo/ExportButtons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { inr, crore, pct, trendColor } from '@/lib/format';

export function RankingsView() {
  const ranked = useMemo(() => rankByReturn(), []);
  const gainers = ranked.filter((i) => (currentReturnPct(i) ?? 0) > 0);
  const losers = ranked.filter((i) => (currentReturnPct(i) ?? 0) < 0).reverse();

  return (
    <>
      <PageHeader
        title="IPO Performance Rankings"
        subtitle="Best and worst listed IPOs ranked by total return from issue price."
        actions={<ExportButtons ipos={ranked} filename="ipo-rankings.csv" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RankList
          title="Top Performing IPOs of All Time"
          icon={<Trophy className="h-4 w-4 text-amber-500" />}
          ipos={gainers}
        />
        <RankList
          title="Worst Performing IPOs"
          icon={<TrendingDown className="h-4 w-4 text-rose-500" />}
          ipos={losers}
        />
      </div>
    </>
  );
}

function RankList({
  title,
  icon,
  ipos,
}: {
  title: string;
  icon: React.ReactNode;
  ipos: Ipo[];
}) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {icon} {title}
      </h2>
      {ipos.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No IPOs in this bucket.</p>
      ) : (
        <ol className="space-y-2">
          {ipos.map((ipo, idx) => {
            const ret = currentReturnPct(ipo);
            return (
              <li key={ipo.slug}>
                <Link
                  href={`/ipo/company/${ipo.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition hover:border-emerald-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-emerald-500/30 dark:hover:bg-slate-800/50"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-800 dark:text-slate-100">
                      {ipo.companyName}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Badge tone="blue">{ipo.sector}</Badge>
                      {ipo.year} · {crore(ipo.market.marketCapCr)}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className={`block text-lg font-bold ${trendColor(ret)}`}>{pct(ret, 0)}</span>
                    <span className="block text-xs text-slate-400 dark:text-slate-500">
                      {inr(ipo.issuePrice)} → {inr(ipo.market.currentPrice)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
