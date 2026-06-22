/**
 * Year-wise IPO data access layer.
 *
 * Each year lives in its own JSON file so the dataset stays easy to maintain
 * and could later be swapped for a real API without touching the UI. All
 * lookups go through the helpers below.
 */
import type { Ipo, IpoYearFile, IpoSector } from '@/types/ipo';
import { listingGainPct, currentReturnPct } from '@/types/ipo';

import y2023 from './2023.json';
import y2024 from './2024.json';
import y2025 from './2025.json';
import y2026 from './2026.json';
import y2027 from './2027.json';

// JSON loses our string-literal unions (status/sector), so cast on the boundary.
const yearFiles = [y2023, y2024, y2025, y2026, y2027] as unknown as IpoYearFile[];

/**
 * When the curated IPO dataset was last reviewed/updated (ISO date).
 * Bump this whenever the year files change so the UI shows an honest timestamp.
 */
export const IPO_DATA_UPDATED = '2026-06-21';

/** Years exposed in the sidebar accordion, newest first. */
export const IPO_YEARS = yearFiles
  .map((f) => f.year)
  .sort((a, b) => b - a);

/** Flat list of every IPO across all years. */
export const ALL_IPOS: Ipo[] = yearFiles.flatMap((f) => f.ipos);

const BY_SLUG = new Map(ALL_IPOS.map((ipo) => [ipo.slug, ipo]));

export function getIposByYear(year: number): Ipo[] {
  return ALL_IPOS.filter((ipo) => ipo.year === year);
}

export function getIpoBySlug(slug: string): Ipo | undefined {
  return BY_SLUG.get(slug);
}

/** Case-insensitive search over company name, sector and slug. */
export function searchIpos(query: string): Ipo[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ALL_IPOS.filter(
    (ipo) =>
      ipo.companyName.toLowerCase().includes(q) ||
      ipo.sector.toLowerCase().includes(q) ||
      ipo.slug.includes(q.replace(/\s+/g, '-')),
  );
}

/** Distinct sectors present in the dataset, alphabetised — used for filters. */
export const ALL_SECTORS: IpoSector[] = Array.from(
  new Set(ALL_IPOS.map((ipo) => ipo.sector)),
).sort() as IpoSector[];

/** Listed IPOs ranked by current return from issue price (best first). */
export function rankByReturn(desc = true): Ipo[] {
  return ALL_IPOS.filter((ipo) => ipo.status === 'LISTED')
    .slice()
    .sort((a, b) => {
      const ra = currentReturnPct(a) ?? 0;
      const rb = currentReturnPct(b) ?? 0;
      return desc ? rb - ra : ra - rb;
    });
}

export { listingGainPct, currentReturnPct };
