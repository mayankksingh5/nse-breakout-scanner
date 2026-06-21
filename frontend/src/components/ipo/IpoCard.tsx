'use client';

import Link from 'next/link';
import { Star, GitCompareArrows, ArrowUpRight } from 'lucide-react';
import type { Ipo } from '@/types/ipo';
import { currentReturnPct, listingGainPct } from '@/types/ipo';
import { useIpoStore } from '@/store/useIpoStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { inr, crore, pct, trendColor } from '@/lib/format';

export function IpoCard({ ipo }: { ipo: Ipo }) {
  const isWatched = useIpoStore((s) => s.watchlist.includes(ipo.slug));
  const inCompare = useIpoStore((s) => s.compare.includes(ipo.slug));
  const toggleWatch = useIpoStore((s) => s.toggleWatch);
  const toggleCompare = useIpoStore((s) => s.toggleCompare);

  const ret = currentReturnPct(ipo);
  const listed = ipo.status === 'LISTED';

  return (
    <Card className="group flex flex-col transition hover:border-emerald-400 hover:shadow-md dark:hover:border-emerald-500/40">
      <div className="flex items-start justify-between gap-2 p-5 pb-3">
        <Link href={`/ipo/company/${ipo.slug}`} className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-400">
            {ipo.companyName}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge tone="blue">{ipo.sector}</Badge>
            <Badge tone={listed ? 'green' : 'amber'}>{listed ? 'Listed' : 'Upcoming'}</Badge>
          </div>
        </Link>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => toggleWatch(ipo.slug)}
            aria-label="Toggle watchlist"
            className={
              'rounded-md p-1.5 transition ' +
              (isWatched
                ? 'text-amber-500'
                : 'text-slate-400 hover:text-amber-500 dark:text-slate-500')
            }
          >
            <Star className="h-4 w-4" fill={isWatched ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => toggleCompare(ipo.slug)}
            aria-label="Toggle compare"
            className={
              'rounded-md p-1.5 transition ' +
              (inCompare
                ? 'text-blue-500'
                : 'text-slate-400 hover:text-blue-500 dark:text-slate-500')
            }
          >
            <GitCompareArrows className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Link href={`/ipo/company/${ipo.slug}`} className="flex flex-1 flex-col px-5 pb-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Field label="Issue Price" value={inr(ipo.issuePrice || 0)} />
          <Field
            label="Listing Price"
            value={ipo.listingPrice != null ? inr(ipo.listingPrice) : '—'}
          />
          <Field
            label="Current Price"
            value={listed ? inr(ipo.market.currentPrice) : '—'}
          />
          <Field
            label="Market Cap"
            value={listed ? crore(ipo.market.marketCapCr) : '—'}
          />
          <Field label="52W High" value={listed ? inr(ipo.market.week52High) : '—'} />
          <Field label="52W Low" value={listed ? inr(ipo.market.week52Low) : '—'} />
          <Field label="P/E" value={ipo.market.peRatio != null ? ipo.market.peRatio.toFixed(1) : '—'} />
          <Field
            label="Listing Gain"
            value={pct(listingGainPct(ipo))}
            valueClass={trendColor(listingGainPct(ipo))}
          />
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Return from IPO
            </div>
            <div className={`text-2xl font-bold ${trendColor(ret)}`}>
              {ret != null ? pct(ret, 0) : 'Awaiting listing'}
            </div>
          </div>
          {ipo.gmp != null && !listed && (
            <Badge tone="violet">GMP {inr(ipo.gmp)}</Badge>
          )}
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Details <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>

        <p className="mt-3 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{ipo.summary}</p>
      </Link>
    </Card>
  );
}

function Field({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</div>
      <div className={`font-medium text-slate-800 dark:text-slate-200 ${valueClass}`}>{value}</div>
    </div>
  );
}
