/** Shared formatting helpers for the IPO Tracker (all values in INR). */

/** ₹1,503 — whole-rupee price with Indian grouping. */
export function inr(value: number): string {
  return '₹' + Math.round(value).toLocaleString('en-IN');
}

/** ₹1,503.50 — price keeping paise. */
export function inrPrecise(value: number): string {
  return '₹' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Crore value -> ₹91,900 Cr / ₹1.03L Cr. */
export function crore(cr: number): string {
  if (!cr) return '—';
  if (cr >= 100000) return '₹' + (cr / 100000).toFixed(2) + 'L Cr';
  return '₹' + cr.toLocaleString('en-IN') + ' Cr';
}

/** Signed percentage, e.g. +113.0% / -12.4%. */
export function pct(value: number | null | undefined, digits = 1): string {
  if (value == null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

/** Plain number with optional unit; em-dash for null. */
export function num(value: number | null | undefined, suffix = ''): string {
  if (value == null) return '—';
  return value.toLocaleString('en-IN') + suffix;
}

/** "21 Oct 2024" from an ISO date string. */
export function shortDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Tailwind text-colour class for a signed value. */
export function trendColor(value: number | null | undefined): string {
  if (value == null) return 'text-slate-500 dark:text-slate-400';
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (value < 0) return 'text-rose-600 dark:text-rose-400';
  return 'text-slate-500 dark:text-slate-400';
}
