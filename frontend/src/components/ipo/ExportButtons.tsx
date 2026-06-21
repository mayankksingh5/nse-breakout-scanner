'use client';

import { FileSpreadsheet, FileText } from 'lucide-react';
import type { Ipo } from '@/types/ipo';
import { exportIposToCsv, exportToPdf } from '@/lib/export';

const btn =
  'flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800';

/** Excel (CSV) + PDF export for a given list of IPOs. */
export function ExportButtons({ ipos, filename = 'ipo-data.csv' }: { ipos: Ipo[]; filename?: string }) {
  return (
    <div className="flex gap-2 print:hidden">
      <button onClick={() => exportIposToCsv(ipos, filename)} className={btn} title="Export to Excel/CSV">
        <FileSpreadsheet className="h-4 w-4" /> Excel
      </button>
      <button onClick={exportToPdf} className={btn} title="Save as PDF (via print)">
        <FileText className="h-4 w-4" /> PDF
      </button>
    </div>
  );
}
