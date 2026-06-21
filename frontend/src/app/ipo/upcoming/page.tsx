'use client';

import { useMemo } from 'react';
import { ALL_IPOS } from '@/data/ipo';
import { PageHeader } from '@/components/ipo/PageHeader';
import { IpoGrid } from '@/components/ipo/IpoGrid';
import { ExportButtons } from '@/components/ipo/ExportButtons';

export default function UpcomingPage() {
  const upcoming = useMemo(
    () =>
      ALL_IPOS.filter((i) => i.status === 'UPCOMING').sort((a, b) =>
        a.openDate.localeCompare(b.openDate),
      ),
    [],
  );

  return (
    <>
      <PageHeader
        title="Upcoming IPOs"
        subtitle="IPOs that are open soon or awaiting their market debut."
        actions={<ExportButtons ipos={upcoming} filename="upcoming-ipos.csv" />}
      />
      <IpoGrid ipos={upcoming} emptyHint="No upcoming IPOs tracked right now." />
    </>
  );
}
