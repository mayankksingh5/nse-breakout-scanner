import type { Ipo } from '@/types/ipo';
import { currentReturnPct } from '@/types/ipo';
import type { IpoFilters } from '@/store/useIpoStore';

/** Apply the active filter set and sort order to a list of IPOs. */
export function applyIpoFilters(ipos: Ipo[], f: IpoFilters): Ipo[] {
  const q = f.search.trim().toLowerCase();

  let out = ipos.filter((ipo) => {
    if (f.year != null && ipo.year !== f.year) return false;
    if (f.sector && ipo.sector !== f.sector) return false;
    if (f.minMarketCapCr > 0 && ipo.market.marketCapCr < f.minMarketCapCr) return false;

    if (f.returns !== 'all') {
      const r = currentReturnPct(ipo);
      if (r == null) return false; // unlisted has no return
      if (f.returns === 'positive' && r <= 0) return false;
      if (f.returns === 'negative' && r >= 0) return false;
    }

    if (q && !ipo.companyName.toLowerCase().includes(q) && !ipo.sector.toLowerCase().includes(q))
      return false;

    return true;
  });

  out = out.slice();
  switch (f.sort) {
    case 'gainers':
      out.sort((a, b) => (currentReturnPct(b) ?? -Infinity) - (currentReturnPct(a) ?? -Infinity));
      break;
    case 'losers':
      out.sort((a, b) => (currentReturnPct(a) ?? Infinity) - (currentReturnPct(b) ?? Infinity));
      break;
    case 'marketcap':
      out.sort((a, b) => b.market.marketCapCr - a.market.marketCapCr);
      break;
    case 'newest':
      out.sort((a, b) => b.openDate.localeCompare(a.openDate));
      break;
    default:
      break;
  }

  return out;
}
