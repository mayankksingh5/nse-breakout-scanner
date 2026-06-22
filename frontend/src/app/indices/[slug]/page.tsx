import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_INDICES, getIndex } from '@/lib/marketData';
import { QuoteShell } from '@/components/quote/QuoteShell';
import { IndexDetail } from '@/components/quote/IndexDetail';

export function generateStaticParams() {
  return ALL_INDICES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const idx = getIndex(slug);
  return { title: idx ? `${idx.name} · Ultra Scanner` : 'Index · Ultra Scanner' };
}

export default async function IndexPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idx = getIndex(slug);
  if (!idx) notFound();

  return (
    <QuoteShell>
      <IndexDetail idx={idx} />
    </QuoteShell>
  );
}
