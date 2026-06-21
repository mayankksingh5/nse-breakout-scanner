'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { GitCompareArrows, X } from 'lucide-react';
import type { Ipo } from '@/types/ipo';
import { currentReturnPct, listingGainPct } from '@/types/ipo';
import { getIpoBySlug } from '@/data/ipo';
import { useIpoStore } from '@/store/useIpoStore';
import { PageHeader } from '@/components/ipo/PageHeader';
import { ExportButtons } from '@/components/ipo/ExportButtons';
import { Card } from '@/components/ui/Card';
import { inr, crore, pct, trendColor } from '@/lib/format';

interface Row {
  label: string;
  render: (ipo: Ipo) => React.ReactNode;
}

const ROWS: Row[] = [
  { label: 'Sector', render: (i) => i.sector },
  { label: 'Year', render: (i) => i.year },
  { label: 'Status', render: (i) => (i.status === 'LISTED' ? 'Listed' : 'Upcoming') },
  { label: 'Issue Price', render: (i) => (i.issuePrice ? inr(i.issuePrice) : '—') },
  { label: 'Listing Price', render: (i) => (i.listingPrice != null ? inr(i.listingPrice) : '—') },
  { label: 'Current Price', render: (i) => (i.status === 'LISTED' ? inr(i.market.currentPrice) : '—') },
  {
    label: 'Listing Gain',
    render: (i) => <span className={trendColor(listingGainPct(i))}>{pct(listingGainPct(i))}</span>,
  },
  {
    label: 'Return from IPO',
    render: (i) => <span className={trendColor(currentReturnPct(i))}>{pct(currentReturnPct(i))}</span>,
  },
  { label: 'Market Cap', render: (i) => (i.market.marketCapCr ? crore(i.market.marketCapCr) : '—') },
  { label: 'P/E Ratio', render: (i) => (i.market.peRatio != null ? i.market.peRatio.toFixed(1) : '—') },
  { label: 'ROE', render: (i) => (i.market.roe != null ? `${i.market.roe}%` : '—') },
  { label: 'ROCE', render: (i) => (i.market.roce != null ? `${i.market.roce}%` : '—') },
  { label: 'Issue Size', render: (i) => crore(i.ipoDetails.issueSizeCr) },
  { label: 'Revenue CAGR', render: (i) => (i.cagrRevenue != null ? pct(i.cagrRevenue) : '—') },
];

export function CompareView() {
  const compare = useIpoStore((s) => s.compare);
  const toggleCompare = useIpoStore((s) => s.toggleCompare);
  const clearCompare = useIpoStore((s) => s.clearCompare);
  const setIpoView = useIpoStore((s) => s.setIpoView);

  const ipos = useMemo(
    () => compare.map(getIpoBySlug).filter((x): x is Ipo => Boolean(x)),
    [compare],
  );

  return (
    <>
      <PageHeader
        title="Compare IPOs"
        subtitle="Stack IPOs side by side across valuation, returns and fundamentals."
        actions={
          ipos.length > 0 ? (
            <div className="flex gap-2">
              <ExportButtons ipos={ipos} filename="ipo-comparison.csv" />
              <button
                onClick={clearCompare}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Clear all
              </button>
            </div>
          ) : undefined
        }
      />

      {ipos.length < 2 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <GitCompareArrows className="mb-3 h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Add at least 2 IPOs to compare. Use the{' '}
            <GitCompareArrows className="inline h-3.5 w-3.5 -translate-y-0.5" /> button on any IPO.
          </p>
          <button
            onClick={() => setIpoView('overview')}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Browse IPOs
          </button>
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="sticky left-0 bg-white p-4 text-xs uppercase tracking-wide text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                  Metric
                </th>
                {ipos.map((ipo) => (
                  <th key={ipo.slug} className="min-w-[160px] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/ipo/company/${ipo.slug}`}
                        className="font-semibold text-slate-900 hover:text-emerald-600 dark:text-slate-100 dark:hover:text-emerald-400"
                      >
                        {ipo.companyName}
                      </Link>
                      <button
                        onClick={() => toggleCompare(ipo.slug)}
                        aria-label={`Remove ${ipo.companyName}`}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <td className="sticky left-0 bg-white p-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    {row.label}
                  </td>
                  {ipos.map((ipo) => (
                    <td key={ipo.slug} className="p-4 text-slate-700 dark:text-slate-200">
                      {row.render(ipo)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
