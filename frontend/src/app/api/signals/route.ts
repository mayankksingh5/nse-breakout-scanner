import { NextRequest, NextResponse } from 'next/server';
import dataset from '@/data/signals.json';

// The dataset is generated locally (where Yahoo Finance is reachable) and
// committed to the repo. Yahoo blocks cloud/datacenter IPs, so we serve
// precomputed results instead of scanning live from the server.
interface Signal {
  id: string;
  symbol: string;
  company_name: string;
  market_cap_cr: number;
  current_price: number;
  price_change_pct: number;
  resistance_price: number;
  distance_pct: number;
  current_volume: number;
  avg_volume_1m: number;
  avg_volume_2m: number;
  avg_volume_3m: number;
  volume_ratio: number;
  breakout_score: number;
  signal_type: string;
}

const signals = (dataset as { signals: Signal[] }).signals || [];

function avgVolumeField(period: string): keyof Signal {
  if (period === '2m') return 'avg_volume_2m';
  if (period === '3m') return 'avg_volume_3m';
  return 'avg_volume_1m';
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const minScore = Number(q.get('minScore') ?? 50);
  const minVolumeRatio = Number(q.get('minVolumeRatio') ?? 0);
  const minMarketCapCr = Number(q.get('minMarketCapCr') ?? 5000);
  const minAvgVolume = Number(q.get('minAvgVolume') ?? 0);
  const volPeriod = q.get('volPeriod') ?? '1m';
  const signalFilter = q.get('signal');
  const search = q.get('search')?.toUpperCase() ?? null;

  const volField = avgVolumeField(volPeriod);

  const filtered = signals.filter((s) => {
    if (s.breakout_score < minScore) return false;
    if (s.volume_ratio < minVolumeRatio) return false;
    if (s.market_cap_cr < minMarketCapCr) return false;
    if ((s[volField] as number) < minAvgVolume) return false;
    if (signalFilter && s.signal_type !== signalFilter) return false;
    if (search && !s.symbol.includes(search) && !s.company_name.toUpperCase().includes(search))
      return false;
    return true;
  });

  return NextResponse.json(filtered);
}
