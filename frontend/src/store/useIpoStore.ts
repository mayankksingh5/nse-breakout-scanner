import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

/** Top-level dashboard tabs. */
export type AppTab = 'stocks' | 'ipo';

/** Sub-views inside the IPO tab. */
export type IpoView =
  | 'overview'
  | 'upcoming'
  | 'calendar'
  | 'rankings'
  | 'watchlist'
  | 'compare'
  | 'allotment';

export type ReturnFilter = 'all' | 'positive' | 'negative';

export type IpoSort = 'default' | 'gainers' | 'losers' | 'newest' | 'marketcap';

export interface IpoFilters {
  /** null = all years. */
  year: number | null;
  /** empty = all sectors. */
  sector: string | null;
  /** Minimum market cap in crore. */
  minMarketCapCr: number;
  returns: ReturnFilter;
  sort: IpoSort;
  search: string;
}

export const DEFAULT_FILTERS: IpoFilters = {
  year: null,
  sector: null,
  minMarketCapCr: 0,
  returns: 'all',
  sort: 'default',
  search: '',
};

/** Max number of IPOs that can sit in the compare tray at once. */
export const MAX_COMPARE = 4;

interface IpoState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;

  /** Active top-level tab (Stocks vs IPO). */
  activeTab: AppTab;
  setActiveTab: (t: AppTab) => void;

  /** Active sub-view within the IPO tab. */
  ipoView: IpoView;
  setIpoView: (v: IpoView) => void;

  /** Slugs the user has favourited. */
  watchlist: string[];
  toggleWatch: (slug: string) => void;
  isWatched: (slug: string) => boolean;

  /** Slugs queued for side-by-side comparison. */
  compare: string[];
  toggleCompare: (slug: string) => void;
  clearCompare: () => void;
  inCompare: (slug: string) => boolean;

  filters: IpoFilters;
  setFilter: <K extends keyof IpoFilters>(key: K, value: IpoFilters[K]) => void;
  resetFilters: () => void;
}

export const useIpoStore = create<IpoState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (t) => set({ theme: t }),

      activeTab: 'stocks',
      setActiveTab: (t) => set({ activeTab: t }),

      ipoView: 'overview',
      setIpoView: (v) => set({ ipoView: v }),

      watchlist: [],
      toggleWatch: (slug) =>
        set((s) => ({
          watchlist: s.watchlist.includes(slug)
            ? s.watchlist.filter((x) => x !== slug)
            : [...s.watchlist, slug],
        })),
      isWatched: (slug) => get().watchlist.includes(slug),

      compare: [],
      toggleCompare: (slug) =>
        set((s) => {
          if (s.compare.includes(slug)) {
            return { compare: s.compare.filter((x) => x !== slug) };
          }
          if (s.compare.length >= MAX_COMPARE) return s; // tray full — ignore
          return { compare: [...s.compare, slug] };
        }),
      clearCompare: () => set({ compare: [] }),
      inCompare: (slug) => get().compare.includes(slug),

      filters: DEFAULT_FILTERS,
      setFilter: (key, value) =>
        set((s) => ({ filters: { ...s.filters, [key]: value } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
    }),
    {
      name: 'ipo-tracker',
      // Don't persist the transient search box; everything else is sticky.
      partialize: (s) => ({
        theme: s.theme,
        watchlist: s.watchlist,
        compare: s.compare,
        activeTab: s.activeTab,
        ipoView: s.ipoView,
      }),
    },
  ),
);
