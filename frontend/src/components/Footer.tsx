import { ShieldAlert } from 'lucide-react';

/**
 * Global disclaimer footer. Rendered once in the root layout so it appears on
 * every page (Home, Stocks, IPO, IPO details, and any future routes).
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 print:hidden">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          Disclaimer
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[13px]">
          <p>
            No financial information whatsoever published anywhere within this application should be
            considered as advice to buy or sell securities, invest in IPOs, or make any investment
            decisions. All content is provided solely for educational and informational purposes.
          </p>
          <p>
            We are not a SEBI-registered analyst or investment advisor. Users should consult a
            qualified financial advisor before making any investment decisions based on information
            available on this application.
          </p>
          <p>
            The information presented in this application is based on publicly available data, market
            perceptions, and sources believed to be reliable at the time of publication. We do not
            guarantee the accuracy, completeness, or timeliness of the information.
          </p>
          <p>
            By using this application, you acknowledge and agree to these terms and conditions.
          </p>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          © 2026 StockFinder NSE. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
