import { NextResponse } from 'next/server';

export async function GET() {
  const signals = [
    { id: '1', symbol: 'RELIANCE', company_name: 'Reliance Industries Ltd', current_price: 2496.40, resistance_price: 2470.00, distance_pct: 1.06, price_change_pct: 3.20, current_volume: 8500000, avg_volume_30d: 4000000, volume_ratio: 2.12, prev_resistance_volume: 5000000, breakout_score: 94, signal_type: 'STRONG_BUY' },
    { id: '2', symbol: 'TCS', company_name: 'Tata Consultancy Services Ltd', current_price: 3950.00, resistance_price: 3920.00, distance_pct: 0.76, price_change_pct: 2.45, current_volume: 3200000, avg_volume_30d: 1500000, volume_ratio: 2.13, prev_resistance_volume: 2000000, breakout_score: 88, signal_type: 'STRONG_BUY' },
    { id: '3', symbol: 'INFY', company_name: 'Infosys Limited', current_price: 1465.10, resistance_price: 1450.00, distance_pct: 1.04, price_change_pct: 1.85, current_volume: 6800000, avg_volume_30d: 3100000, volume_ratio: 2.19, prev_resistance_volume: 4000000, breakout_score: 76, signal_type: 'BREAKOUT_WATCH' },
    { id: '4', symbol: 'HDFCBANK', company_name: 'HDFC Bank Limited', current_price: 1610.00, resistance_price: 1600.00, distance_pct: 0.62, price_change_pct: 0.95, current_volume: 14000000, avg_volume_30d: 11000000, volume_ratio: 1.27, prev_resistance_volume: 9000000, breakout_score: 55, signal_type: 'MONITOR' }
  ];
  return NextResponse.json(signals);
}