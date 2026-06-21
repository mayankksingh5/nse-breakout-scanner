'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import type { Ipo } from '@/types/ipo';
import { currentReturnPct, listingGainPct } from '@/types/ipo';

const GRID = '#e2e8f0';
const AXIS = '#94a3b8';
const EMERALD = '#10b981';
const ROSE = '#f43f5e';
const SLATE = '#64748b';
const BLUE = '#3b82f6';

const tooltipStyle = {
  background: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 12,
};

function Empty({ label }: { label: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-slate-400 dark:text-slate-500">
      {label}
    </div>
  );
}

/** Historical price line since listing. */
export function PriceChart({ ipo }: { ipo: Ipo }) {
  if (!ipo.priceHistory.length) return <Empty label="Price history available after listing" />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={ipo.priceHistory} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} strokeOpacity={0.4} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: AXIS }}
          tickFormatter={(d: string) => d.slice(0, 7)}
        />
        <YAxis tick={{ fontSize: 11, fill: AXIS }} width={56} domain={['auto', 'auto']} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${v}`, 'Price']} />
        <Line type="monotone" dataKey="price" stroke={EMERALD} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Issue price vs listing price vs current price. */
export function IpoVsCurrentChart({ ipo }: { ipo: Ipo }) {
  const data = [
    { name: 'Issue', value: ipo.issuePrice, fill: SLATE },
    ...(ipo.listingPrice != null ? [{ name: 'Listing', value: ipo.listingPrice, fill: BLUE }] : []),
    ...(ipo.status === 'LISTED'
      ? [{ name: 'Current', value: ipo.market.currentPrice, fill: EMERALD }]
      : []),
  ];
  if (data.length < 2) return <Empty label="Comparison available after listing" />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} strokeOpacity={0.4} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: AXIS }} />
        <YAxis tick={{ fontSize: 11, fill: AXIS }} width={56} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${v}`, 'Price']} cursor={{ fill: '#94a3b820' }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Listing gain % and return-from-IPO % side by side. */
export function ReturnsChart({ ipo }: { ipo: Ipo }) {
  const lg = listingGainPct(ipo);
  const cr = currentReturnPct(ipo);
  const data = [
    ...(lg != null ? [{ name: 'Listing Gain', value: +lg.toFixed(1) }] : []),
    ...(cr != null ? [{ name: 'Return from IPO', value: +cr.toFixed(1) }] : []),
  ];
  if (!data.length) return <Empty label="Returns available after listing" />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} strokeOpacity={0.4} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: AXIS }} />
        <YAxis tick={{ fontSize: 11, fill: AXIS }} width={56} unit="%" />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Return']} cursor={{ fill: '#94a3b820' }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.value >= 0 ? EMERALD : ROSE} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
