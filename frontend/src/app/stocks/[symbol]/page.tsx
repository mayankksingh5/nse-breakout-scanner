import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_SIGNALS, getSignal } from '@/lib/marketData';
import { QuoteShell } from '@/components/quote/QuoteShell';
import { StockDetail } from '@/components/quote/StockDetail';

export function generateStaticParams() {
  return ALL_SIGNALS.map((s) => ({ symbol: s.symbol }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  const s = getSignal(symbol);
  return {
    title: s ? `${s.symbol} · ${s.company_name} · Ultra Scanner` : 'Stock · Ultra Scanner',
  };
}

export default async function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const s = getSignal(symbol);
  if (!s) notFound();

  return (
    <QuoteShell>
      <StockDetail s={s} />
    </QuoteShell>
  );
}
