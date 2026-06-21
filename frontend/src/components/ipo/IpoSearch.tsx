'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { searchIpos } from '@/data/ipo';
import { Badge } from '@/components/ui/Badge';

/** Global IPO search with instant dropdown results. */
export function IpoSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchIpos(query).slice(0, 8), [query]);

  // Close the dropdown on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (slug: string) => {
    setOpen(false);
    setQuery('');
    router.push(`/ipo/company/${slug}`);
  };

  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) go(results[0].slug);
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Search IPOs — Waaree, Bajaj Housing, Tata…"
        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      {query && (
        <button
          onClick={() => {
            setQuery('');
            setOpen(false);
          }}
          className="absolute right-2 top-2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {open && query.trim() && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
              No IPOs match “{query}”.
            </div>
          ) : (
            results.map((ipo) => (
              <button
                key={ipo.slug}
                onClick={() => go(ipo.slug)}
                className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span>
                  <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                    {ipo.companyName}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {ipo.sector} · {ipo.year}
                  </span>
                </span>
                <Badge tone={ipo.status === 'LISTED' ? 'green' : 'amber'}>{ipo.status}</Badge>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
