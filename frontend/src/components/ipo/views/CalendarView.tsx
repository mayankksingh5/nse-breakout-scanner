'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import type { Ipo } from '@/types/ipo';
import { ALL_IPOS } from '@/data/ipo';
import { PageHeader } from '@/components/ipo/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { shortDate } from '@/lib/format';

function monthKey(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function CalendarView() {
  const groups = useMemo(() => {
    const sorted = [...ALL_IPOS].sort((a, b) => b.openDate.localeCompare(a.openDate));
    const map = new Map<string, Ipo[]>();
    for (const ipo of sorted) {
      const key = monthKey(ipo.openDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ipo);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <>
      <PageHeader title="IPO Calendar" subtitle="Open, close and listing dates across every tracked IPO." />

      <div className="space-y-8">
        {groups.map(([month, ipos]) => (
          <div key={month}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <CalendarDays className="h-4 w-4" /> {month}
            </h2>
            <div className="space-y-2">
              {ipos.map((ipo) => (
                <Link key={ipo.slug} href={`/ipo/company/${ipo.slug}`}>
                  <Card className="flex flex-col gap-2 p-4 transition hover:border-emerald-300 dark:hover:border-emerald-500/30 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold leading-none text-slate-900 dark:text-slate-100">
                          {new Date(ipo.openDate + 'T00:00:00').getDate()}
                        </div>
                        <div className="text-[11px] uppercase text-slate-400">
                          {new Date(ipo.openDate + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-100">{ipo.companyName}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Badge tone="blue">{ipo.sector}</Badge>
                          <Badge tone={ipo.status === 'LISTED' ? 'green' : 'amber'}>
                            {ipo.status === 'LISTED' ? 'Listed' : 'Upcoming'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs sm:text-right">
                      <DateCol label="Open" value={shortDate(ipo.openDate)} />
                      <DateCol label="Close" value={shortDate(ipo.closeDate)} />
                      <DateCol label="Listing" value={shortDate(ipo.listingDate)} />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function DateCol({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</div>
      <div className="font-medium text-slate-700 dark:text-slate-300">{value}</div>
    </div>
  );
}
