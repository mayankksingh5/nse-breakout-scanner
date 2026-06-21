'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Star,
  GitCompareArrows,
  Building2,
  Users,
  Newspaper,
  TrendingUp,
} from 'lucide-react';
import { getIpoBySlug } from '@/data/ipo';
import { currentReturnPct, listingGainPct } from '@/types/ipo';
import { useIpoStore } from '@/store/useIpoStore';
import { Card, CardBody, SectionTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatTile } from '@/components/ui/StatTile';
import { SwotGrid } from '@/components/ipo/SwotGrid';
import { PriceChart, IpoVsCurrentChart, ReturnsChart } from '@/components/ipo/charts/IpoCharts';
import { inr, crore, pct, shortDate, trendColor } from '@/lib/format';

export default function IpoDetailPage() {
  const params = useParams<{ slug: string }>();
  const ipo = getIpoBySlug(params.slug);

  const isWatched = useIpoStore((s) => (ipo ? s.watchlist.includes(ipo.slug) : false));
  const inCompare = useIpoStore((s) => (ipo ? s.compare.includes(ipo.slug) : false));
  const toggleWatch = useIpoStore((s) => s.toggleWatch);
  const toggleCompare = useIpoStore((s) => s.toggleCompare);

  if (!ipo) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">IPO not found</p>
        <Link href="/ipo" className="mt-3 inline-block text-sm text-emerald-600 hover:underline dark:text-emerald-400">
          ← Back to all IPOs
        </Link>
      </div>
    );
  }

  const listed = ipo.status === 'LISTED';
  const ret = currentReturnPct(ipo);
  const lg = listingGainPct(ipo);
  const m = ipo.market;

  return (
    <div className="space-y-6">
      <Link
        href="/ipo"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 print:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> All IPOs
      </Link>

      {/* Header */}
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {ipo.companyName}
              </h1>
              <Badge tone={listed ? 'green' : 'amber'}>{listed ? 'Listed' : 'Upcoming'}</Badge>
              <Badge tone="blue">{ipo.sector}</Badge>
              <Badge tone="neutral">{ipo.year}</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{ipo.summary}</p>
            <div className="mt-3 flex gap-2 print:hidden">
              <button
                onClick={() => toggleWatch(ipo.slug)}
                className={
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ' +
                  (isWatched
                    ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800')
                }
              >
                <Star className="h-4 w-4" fill={isWatched ? 'currentColor' : 'none'} />
                {isWatched ? 'Watchlisted' : 'Watchlist'}
              </button>
              <button
                onClick={() => toggleCompare(ipo.slug)}
                className={
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ' +
                  (inCompare
                    ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800')
                }
              >
                <GitCompareArrows className="h-4 w-4" />
                {inCompare ? 'In Compare' : 'Compare'}
              </button>
            </div>
          </div>
          <div className="shrink-0 rounded-xl bg-slate-50 p-4 text-right dark:bg-slate-950/40">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Return from IPO</div>
            <div className={`text-3xl font-bold ${trendColor(ret)}`}>
              {ret != null ? pct(ret, 0) : '—'}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {listed ? `${inr(ipo.issuePrice)} → ${inr(m.currentPrice)}` : 'Not listed yet'}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Issue Price" value={ipo.issuePrice ? inr(ipo.issuePrice) : '—'} />
        <StatTile label="Listing Price" value={ipo.listingPrice != null ? inr(ipo.listingPrice) : '—'} />
        <StatTile label="Current" value={listed ? inr(m.currentPrice) : '—'} />
        <StatTile label="52W High" value={listed ? inr(m.week52High) : '—'} />
        <StatTile label="52W Low" value={listed ? inr(m.week52Low) : '—'} />
        <StatTile
          label="Listing Gain"
          value={pct(lg)}
          valueClassName={trendColor(lg)}
        />
      </div>

      {/* Overview */}
      <Card>
        <CardBody className="space-y-4">
          <SectionTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Company Overview
          </SectionTitle>
          <Prose label="Introduction" text={ipo.overview.introduction} />
          <Prose label="Business Model" text={ipo.overview.businessModel} />
          <Prose label="Industry Analysis" text={ipo.overview.industryAnalysis} />
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Promoters
            </div>
            <div className="flex flex-wrap gap-2">
              {ipo.overview.promoters.map((p) => (
                <span
                  key={p}
                  className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Users className="h-3.5 w-3.5 text-slate-400" /> {p}
                </span>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* IPO details + Market performance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardBody className="space-y-4">
            <SectionTitle>IPO Details</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Issue Size" value={crore(ipo.ipoDetails.issueSizeCr)} />
              <StatTile
                label="Price Band"
                value={
                  ipo.ipoDetails.priceBandHigh
                    ? `${inr(ipo.ipoDetails.priceBandLow)} – ${inr(ipo.ipoDetails.priceBandHigh)}`
                    : 'TBA'
                }
              />
              <StatTile label="Lot Size" value={ipo.ipoDetails.lotSize ? `${ipo.ipoDetails.lotSize} shares` : 'TBA'} />
              <StatTile label="Open → Close" value={`${shortDate(ipo.openDate)} – ${shortDate(ipo.closeDate)}`} />
              <StatTile label="Listing Date" value={shortDate(ipo.listingDate)} />
              <StatTile label="Listing Gain" value={pct(lg)} valueClassName={trendColor(lg)} />
            </div>
            {ipo.ipoDetails.subscription && (
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Subscription (times)
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {([
                    ['Overall', ipo.ipoDetails.subscription.overall],
                    ['QIB', ipo.ipoDetails.subscription.qib],
                    ['NII', ipo.ipoDetails.subscription.nii],
                    ['Retail', ipo.ipoDetails.subscription.retail],
                  ] as const).map(([label, v]) => (
                    <div key={label} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-950/40">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{v.toFixed(1)}x</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <SectionTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Market Performance
            </SectionTitle>
            {listed ? (
              <div className="grid grid-cols-2 gap-3">
                <StatTile label="Current Price" value={inr(m.currentPrice)} />
                <StatTile label="Market Cap" value={crore(m.marketCapCr)} />
                <StatTile label="P/E Ratio" value={m.peRatio != null ? m.peRatio.toFixed(1) : '—'} />
                <StatTile label="Dividend Yield" value={m.dividendYield != null ? `${m.dividendYield}%` : '—'} />
                <StatTile label="ROE" value={m.roe != null ? `${m.roe}%` : '—'} />
                <StatTile label="ROCE" value={m.roce != null ? `${m.roce}%` : '—'} />
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Market data will be available once {ipo.companyName} is listed.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Financials */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle>Financials</SectionTitle>
            {ipo.cagrRevenue != null && (
              <Badge tone="green">Revenue CAGR {pct(ipo.cagrRevenue)}</Badge>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Fiscal Year</th>
                  <th className="py-2 pr-4">Revenue</th>
                  <th className="py-2 pr-4">Profit</th>
                  <th className="py-2 pr-4">EBITDA</th>
                  <th className="py-2 pr-4">Net Worth</th>
                  <th className="py-2">Debt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ipo.financials.map((f) => (
                  <tr key={f.year}>
                    <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-200">{f.year}</td>
                    <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{crore(f.revenueCr)}</td>
                    <td className={`py-2 pr-4 ${f.profitCr < 0 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'}`}>
                      {crore(f.profitCr)}
                    </td>
                    <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{crore(f.ebitdaCr)}</td>
                    <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{crore(f.netWorthCr)}</td>
                    <td className="py-2 text-slate-600 dark:text-slate-300">{crore(f.debtCr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">All figures in ₹ crore.</p>
        </CardBody>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Price History">
          <PriceChart ipo={ipo} />
        </ChartCard>
        <ChartCard title="IPO Price vs Current">
          <IpoVsCurrentChart ipo={ipo} />
        </ChartCard>
        <ChartCard title="Returns">
          <ReturnsChart ipo={ipo} />
        </ChartCard>
        <Card>
          <CardBody>
            <SectionTitle className="mb-3">Key Numbers</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="GMP" value={ipo.gmp != null ? inr(ipo.gmp) : '—'} />
              <StatTile label="Issue Size" value={crore(ipo.ipoDetails.issueSizeCr)} />
              <StatTile label="Return from IPO" value={pct(ret)} valueClassName={trendColor(ret)} />
              <StatTile label="Listing Gain" value={pct(lg)} valueClassName={trendColor(lg)} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* News */}
      <Card>
        <CardBody className="space-y-3">
          <SectionTitle className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" /> News &amp; Updates
          </SectionTitle>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {ipo.news.map((n, i) => (
              <li key={i} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{n.source}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{shortDate(n.date)}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {/* SWOT */}
      <div>
        <SectionTitle className="mb-3">SWOT Analysis</SectionTitle>
        <SwotGrid swot={ipo.swot} />
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Figures are illustrative sample data for demonstration — not investment advice.
      </p>
    </div>
  );
}

function Prose({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </div>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{text}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardBody>
        <SectionTitle className="mb-3">{title}</SectionTitle>
        {children}
      </CardBody>
    </Card>
  );
}
