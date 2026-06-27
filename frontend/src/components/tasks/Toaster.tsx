'use client';

import { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { useTaskStore, type Toast } from '@/store/useTaskStore';

function ToastItem({ toast }: { toast: Toast }) {
  const dismissToast = useTaskStore((s) => s.dismissToast);

  // Auto-dismiss after 4s.
  useEffect(() => {
    const t = setTimeout(() => dismissToast(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, dismissToast]);

  const isError = toast.type === 'error';
  return (
    <div
      role="status"
      className={
        'flex items-start gap-2.5 rounded-lg border px-4 py-3 shadow-lg ' +
        (isError
          ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-950 dark:text-rose-300'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950 dark:text-emerald-300')
      }
    >
      {isError ? (
        <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
      )}
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => dismissToast(toast.id)}
        aria-label="Dismiss"
        className="ml-2 shrink-0 opacity-60 transition hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Fixed-position toast stack. Mount once in the shell. */
export function Toaster() {
  const toasts = useTaskStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
