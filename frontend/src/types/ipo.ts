/**
 * Domain model for the IPO Tracker.
 *
 * The data is stored year-wise as JSON (see src/data/ipo/<year>.json) and
 * accessed through the helpers in src/data/ipo/index.ts. Every numeric money
 * value is in INR. Amounts that are naturally large (issue size, revenue,
 * market cap) are stored in crore (Cr) and suffixed `_cr` for clarity.
 */

export type IpoStatus = 'LISTED' | 'UPCOMING';

export type IpoSector =
  | 'Renewable Energy'
  | 'Financial Services'
  | 'Technology'
  | 'Automobile'
  | 'Pharmaceuticals'
  | 'Consumer'
  | 'Infrastructure'
  | 'Manufacturing'
  | 'Healthcare'
  | 'Energy'
  | 'Internet';

/** A single point on the historical price line. */
export interface PricePoint {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  price: number;
}

/** Year-on-year financial line items (values in crore unless noted). */
export interface FinancialYear {
  /** Fiscal year label, e.g. "FY24". */
  year: string;
  revenueCr: number;
  profitCr: number;
  ebitdaCr: number;
  netWorthCr: number;
  debtCr: number;
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface NewsItem {
  date: string;
  title: string;
  source: string;
  /** Optional external link. */
  url?: string;
}

export interface SubscriptionData {
  /** Overall times subscribed, e.g. 76.4. */
  overall: number;
  retail: number;
  /** Qualified Institutional Buyers. */
  qib: number;
  /** Non-Institutional Investors. */
  nii: number;
}

/** Fundamentals / market performance once the stock is trading. */
export interface MarketPerformance {
  currentPrice: number;
  week52High: number;
  week52Low: number;
  marketCapCr: number;
  peRatio: number | null;
  roe: number | null;
  roce: number | null;
  dividendYield: number | null;
}

export interface IpoOverview {
  introduction: string;
  businessModel: string;
  industryAnalysis: string;
  promoters: string[];
}

export interface IpoDetails {
  issueSizeCr: number;
  priceBandLow: number;
  priceBandHigh: number;
  lotSize: number;
  subscription?: SubscriptionData;
}

/**
 * The full IPO record. Listing/return figures are optional because an
 * UPCOMING IPO has not listed yet.
 */
export interface Ipo {
  /** URL-safe unique id, e.g. "waaree-energies". */
  slug: string;
  companyName: string;
  sector: IpoSector;
  status: IpoStatus;
  /** Calendar year the IPO opened — drives the year-wise grouping. */
  year: number;

  openDate: string;
  closeDate: string;
  listingDate?: string;

  /** Final issue/allotment price per share. */
  issuePrice: number;
  /** Price at which the share opened on listing day. */
  listingPrice?: number;

  /** Grey Market Premium (₹) ahead of listing, if available. */
  gmp?: number;

  summary: string;

  overview: IpoOverview;
  ipoDetails: IpoDetails;
  financials: FinancialYear[];
  /** Revenue CAGR over the reported financial years (%). */
  cagrRevenue?: number;
  market: MarketPerformance;

  priceHistory: PricePoint[];
  news: NewsItem[];
  swot: SwotAnalysis;
}

/** Shape of each year-wise JSON file. */
export interface IpoYearFile {
  year: number;
  ipos: Ipo[];
}

/* ----------------------------- Derived helpers ---------------------------- */

/** % gain/loss on listing day vs the issue price. */
export function listingGainPct(ipo: Ipo): number | null {
  if (ipo.listingPrice == null) return null;
  return ((ipo.listingPrice - ipo.issuePrice) / ipo.issuePrice) * 100;
}

/** % return from the issue price to the current market price. */
export function currentReturnPct(ipo: Ipo): number | null {
  if (ipo.status !== 'LISTED') return null;
  return ((ipo.market.currentPrice - ipo.issuePrice) / ipo.issuePrice) * 100;
}
