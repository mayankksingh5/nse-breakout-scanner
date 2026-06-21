/**
 * Client-side export helpers.
 *
 * - CSV: works in any spreadsheet (Excel, Google Sheets) — no dependency.
 * - PDF: uses the browser's native print-to-PDF so we avoid a heavy library;
 *   the caller styles a printable view and we trigger window.print().
 */
import type { Ipo } from '@/types/ipo';
import { currentReturnPct, listingGainPct } from '@/types/ipo';

const CSV_HEADERS = [
  'Company',
  'Sector',
  'Year',
  'Status',
  'Open Date',
  'Close Date',
  'Listing Date',
  'Issue Price',
  'Listing Price',
  'Current Price',
  'Listing Gain %',
  'Return from IPO %',
  'Market Cap (Cr)',
  'P/E',
];

function escapeCsv(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toRow(ipo: Ipo): (string | number | null)[] {
  return [
    ipo.companyName,
    ipo.sector,
    ipo.year,
    ipo.status,
    ipo.openDate,
    ipo.closeDate,
    ipo.listingDate ?? '',
    ipo.issuePrice || '',
    ipo.listingPrice ?? '',
    ipo.status === 'LISTED' ? ipo.market.currentPrice : '',
    listingGainPct(ipo)?.toFixed(1) ?? '',
    currentReturnPct(ipo)?.toFixed(1) ?? '',
    ipo.market.marketCapCr || '',
    ipo.market.peRatio ?? '',
  ];
}

export function exportIposToCsv(ipos: Ipo[], filename = 'ipo-data.csv'): void {
  const lines = [CSV_HEADERS, ...ipos.map(toRow)]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');

  const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Trigger the browser print dialog (user picks "Save as PDF"). */
export function exportToPdf(): void {
  window.print();
}
