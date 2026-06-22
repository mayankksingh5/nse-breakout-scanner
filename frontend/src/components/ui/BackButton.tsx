'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

/**
 * Goes back to the immediately previous screen (preserving its scroll/state),
 * falling back to the dashboard when the page was opened directly (e.g. a
 * shared deep link with no in-app history to return to).
 */
export function BackButton({ label = 'Back' }: { label?: string }) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}
