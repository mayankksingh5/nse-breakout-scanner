'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ALL_IPOS, IPO_YEARS } from '@/data/ipo';
import { useIpoStore } from '@/store/useIpoStore';
import { applyIpoFilters } from '@/lib/filterIpos';
import { PageHeader } from '@/components/ipo/PageHeader';
import { IpoFilters } from '@/components/ipo/IpoFilters';
import { IpoGrid } from '@/components/ipo/IpoGrid';
import { ExportButtons } from '@/components/ipo/ExportButtons';

export default function IpoYearPage() {
  const params = useParams<{ year: string }>();
  const year = Number(params.year);
  const filters = useIpoStore((s) => s.filters);

  // The route owns the year; merge the rest of the active filters on top.
  const list = useMemo(
    () => applyIpoFilters(ALL_IPOS, { ...filters, year }),
    [filters, year],
  );

  const known = IPO_YEARS.includes(year);

  return (
    <>
      <PageHeader
        title={`IPOs in ${year}`}
        subtitle={
          known
            ? `${list.length} IPO${list.length === 1 ? '' : 's'} for the year ${year}.`
            : `No data tracked for ${year}.`
        }
        actions={<ExportButtons ipos={list} filename={`ipos-${year}.csv`} />}
      />

      <div className="mb-5">
        <IpoFilters showYear={false} />
      </div>

      <IpoGrid ipos={list} emptyHint={`No IPOs found for ${year} with these filters.`} />
    </>
  );
}
