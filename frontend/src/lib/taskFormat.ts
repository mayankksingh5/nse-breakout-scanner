// Date/label helpers for the task UI.

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** For <input type="date"> values (yyyy-mm-dd). */
export function toDateInput(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

export type DueState = 'none' | 'overdue' | 'soon' | 'normal';

/** Classify a due date relative to today for colour cues. */
export function dueState(iso: string | null): DueState {
  if (!iso) return 'none';
  const due = new Date(iso);
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / dayMs);
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 2) return 'soon';
  return 'normal';
}

export const DUE_CLASS: Record<DueState, string> = {
  none: 'text-slate-400 dark:text-slate-500',
  overdue: 'text-rose-600 dark:text-rose-400 font-semibold',
  soon: 'text-amber-600 dark:text-amber-400 font-medium',
  normal: 'text-slate-600 dark:text-slate-300',
};
