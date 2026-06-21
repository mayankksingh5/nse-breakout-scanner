import type { Metadata } from 'next';
import { IpoShell } from '@/components/ipo/IpoShell';

export const metadata: Metadata = {
  title: 'IPO Tracker · NSE India',
  description: 'Track Indian IPOs year-wise — listings, returns, financials, charts and more.',
};

export default function IpoLayout({ children }: { children: React.ReactNode }) {
  return <IpoShell>{children}</IpoShell>;
}
