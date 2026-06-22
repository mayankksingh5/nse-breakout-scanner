import type { Metadata } from 'next';
import { IpoShell } from '@/components/ipo/IpoShell';

export const metadata: Metadata = {
  title: 'IPO Tracker · Ultra Scanner',
  description: 'Track Indian IPOs year-wise — listings, returns, financials, charts and more.',
};

export default function IpoLayout({ children }: { children: React.ReactNode }) {
  return <IpoShell>{children}</IpoShell>;
}
