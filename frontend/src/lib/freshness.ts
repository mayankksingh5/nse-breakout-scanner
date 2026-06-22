/**
 * Data-freshness helper. Turns an ISO timestamp into a human label plus a
 * "stale" flag so the UI can warn users when they're looking at data that
 * hasn't refreshed for more than a trading day.
 */
export interface Freshness {
  /** Localised absolute timestamp, e.g. "21 Jun 2026, 2:17 pm". */
  absolute: string;
  /** Relative label, e.g. "Updated today" / "Updated 3 days ago". */
  relative: string;
  /** Whole calendar days since the timestamp. */
  ageDays: number;
  /** Weekdays (Mon–Fri) elapsed since the timestamp — ignores weekends. */
  tradingDaysOld: number;
  /** True when the data is more than one trading day old. */
  isStale: boolean;
}

/** Count weekdays strictly after `from` up to and including `to`. */
function tradingDaysBetween(from: Date, to: Date): number {
  let count = 0;
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

export function getFreshness(iso: string | null | undefined): Freshness | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;

  const now = new Date();
  const ageMs = now.getTime() - then.getTime();
  const ageDays = Math.floor(ageMs / 86_400_000);
  const tradingDaysOld = tradingDaysBetween(then, now);

  let relative: string;
  if (ageDays <= 0) relative = 'Updated today';
  else if (ageDays === 1) relative = 'Updated yesterday';
  else relative = `Updated ${ageDays} days ago`;

  return {
    absolute: then.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    relative,
    ageDays,
    tradingDaysOld,
    // EOD data is naturally up to one trading day old; warn beyond that.
    isStale: tradingDaysOld > 1,
  };
}
