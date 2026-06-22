'use client';

import { useState } from 'react';
import { ExternalLink, ClipboardCheck, Info } from 'lucide-react';
import { PageHeader } from '@/components/ipo/PageHeader';
import { Card } from '@/components/ui/Card';

interface Registrar {
  key: string;
  name: string;
  cta: string;
  /** Public IPO allotment-status page for this registrar. */
  url: string;
  blurb: string;
  accent: string;
}

const REGISTRARS: Registrar[] = [
  {
    key: 'kfin',
    name: 'KFin Technologies',
    cta: 'Check via KFin',
    url: 'https://kosmic.kfintech.com/ipostatus/',
    blurb: 'KFintech (formerly Karvy) — one of India’s largest IPO registrars.',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'bigshare',
    name: 'Bigshare Services',
    cta: 'Check via Bigshare',
    url: 'https://ipo.bigshareonline.com/ipo_status.html',
    blurb: 'Bigshare Services Pvt. Ltd. — common registrar for SME and mainboard IPOs.',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'linkintime',
    name: 'Link Intime (MUFG Intime)',
    cta: 'Check via Link Intime',
    url: 'https://linkintime.co.in/initial_offer/public-issues.html',
    blurb: 'Link Intime India — now MUFG Intime, a leading IPO registrar.',
    accent: 'text-violet-600 dark:text-violet-400',
  },
];

// Basic Indian PAN format: 5 letters, 4 digits, 1 letter.
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function AllotmentView() {
  const [pan, setPan] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const cleanPan = pan.trim().toUpperCase();
  const panValid = PAN_RE.test(cleanPan);
  const panEntered = cleanPan.length > 0;

  async function openRegistrar(r: Registrar) {
    // Registrar forms live on their own domains, so we can't autofill them.
    // If a valid PAN was entered, copy it to the clipboard so the user can
    // paste it straight into the registrar's form.
    if (panValid) {
      try {
        await navigator.clipboard.writeText(cleanPan);
        setCopied(r.key);
        setTimeout(() => setCopied((c) => (c === r.key ? null : c)), 2500);
      } catch {
        /* clipboard blocked — just open the site */
      }
    }
    window.open(r.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <>
      <PageHeader
        title="IPO Allotment Status"
        subtitle="Check your IPO allotment with the registrar handling the issue."
      />

      {/* Optional PAN */}
      <Card className="mb-6 p-4">
        <label htmlFor="pan" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Your PAN <span className="text-slate-400 dark:text-slate-500">(optional)</span>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id="pan"
            value={pan}
            onChange={(e) => setPan(e.target.value.toUpperCase())}
            placeholder="ABCDE1234F"
            maxLength={10}
            spellCheck={false}
            autoCapitalize="characters"
            className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm uppercase tracking-wider text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          {panEntered && !panValid && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              That doesn&apos;t look like a valid PAN (format: ABCDE1234F).
            </span>
          )}
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          For your security we never store or send your PAN anywhere. If you enter a valid PAN,
          we&apos;ll copy it to your clipboard so you can paste it into the registrar&apos;s form.
        </p>
      </Card>

      {/* Registrar cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REGISTRARS.map((r) => (
          <Card key={r.key} className="flex flex-col p-5">
            <div className={`text-lg font-bold ${r.accent}`}>{r.name}</div>
            <p className="mt-1 flex-1 text-sm text-slate-500 dark:text-slate-400">{r.blurb}</p>
            <button
              onClick={() => openRegistrar(r)}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              {copied === r.key ? (
                <>
                  <ClipboardCheck className="h-4 w-4" /> PAN copied — opening…
                </>
              ) : (
                <>
                  {r.cta} <ExternalLink className="h-4 w-4" />
                </>
              )}
            </button>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
        Each link opens the registrar&apos;s official allotment-status page in a new tab. Not sure
        which registrar handled your IPO? It&apos;s listed in the IPO&apos;s prospectus / RHP and on
        the exchange&apos;s issue page.
      </p>
    </>
  );
}
