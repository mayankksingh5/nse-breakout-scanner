import { ShieldCheck, ShieldAlert, Lightbulb, Swords } from 'lucide-react';
import type { SwotAnalysis } from '@/types/ipo';

const QUADRANTS = [
  { key: 'strengths', label: 'Strengths', icon: ShieldCheck, cls: 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5', dot: 'text-emerald-500' },
  { key: 'weaknesses', label: 'Weaknesses', icon: ShieldAlert, cls: 'border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/5', dot: 'text-rose-500' },
  { key: 'opportunities', label: 'Opportunities', icon: Lightbulb, cls: 'border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/5', dot: 'text-blue-500' },
  { key: 'threats', label: 'Threats', icon: Swords, cls: 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5', dot: 'text-amber-500' },
] as const;

export function SwotGrid({ swot }: { swot: SwotAnalysis }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {QUADRANTS.map(({ key, label, icon: Icon, cls, dot }) => (
        <div key={key} className={`rounded-xl border p-4 ${cls}`}>
          <div className="mb-2 flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
            <Icon className={`h-4 w-4 ${dot}`} /> {label}
          </div>
          <ul className="space-y-1.5">
            {swot[key].map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span className={dot}>•</span> {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
