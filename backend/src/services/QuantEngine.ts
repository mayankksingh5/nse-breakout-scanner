import { OHLCV, ResistanceLevel, VolumeMetrics, SignalType } from '../types';

export class QuantEngine {

  // Strategy 1: detect resistance from recent swing highs + psychological round levels.
  public static calculateResistanceLevels(history: OHLCV[], currentPrice: number): ResistanceLevel[] {
    const levels: ResistanceLevel[] = [];
    if (history.length === 0) return levels;

    const windowSize = 5;
    for (let i = windowSize; i < history.length - windowSize; i++) {
      let isMax = true;
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (history[j].high > history[i].high) {
          isMax = false;
          break;
        }
      }
      if (isMax) {
        levels.push({
          price: history[i].high,
          type: 'SWING_HIGH',
          peakDate: history[i].date,
          peakVolume: history[i].volume,
        });
      }
    }

    const psychBases = [100, 200, 500, 1000, 2000, 5000, 10000];
    psychBases.forEach((base) => {
      if (currentPrice >= base * 0.9 && currentPrice <= base * 1.05) {
        levels.push({ price: base, type: 'PSYCHOLOGICAL', peakVolume: 0 });
      }
    });

    return levels;
  }

  /**
   * Pick the most relevant resistance: the nearest level at or above the
   * current price (the wall the stock is trying to break through). Falls back
   * to the highest recent high if price is already above everything.
   */
  public static pickResistance(levels: ResistanceLevel[], currentPrice: number): ResistanceLevel | null {
    if (levels.length === 0) return null;

    const above = levels
      .filter((l) => l.price >= currentPrice)
      .sort((a, b) => a.price - b.price);
    if (above.length > 0) return above[0];

    // Already broken out above all known levels — use the highest as reference.
    return levels.slice().sort((a, b) => b.price - a.price)[0];
  }

  // Strategy 2: average daily volume over 1m / 2m / 3m and today's surge ratio.
  public static calculateVolumeMetrics(
    history: OHLCV[],
    todayClose: number,
    yesterdayClose: number,
    todayVolume: number
  ): VolumeMetrics {
    // Newest first so slice(0, N) = the most recent N days.
    const sorted = [...history].sort((a, b) => b.date.getTime() - a.date.getTime());

    const avgOver = (days: number): number => {
      const slice = sorted.slice(0, days);
      if (slice.length === 0) return 0;
      const sum = slice.reduce((acc, d) => acc + d.volume, 0);
      return Math.round(sum / slice.length);
    };

    const avgVolume1m = avgOver(21);
    const avgVolume2m = avgOver(42);
    const avgVolume3m = avgOver(63);

    const priceChangePct =
      yesterdayClose > 0 ? ((todayClose - yesterdayClose) / yesterdayClose) * 100 : 0;
    const volumeRatio1m = avgVolume1m > 0 ? todayVolume / avgVolume1m : 0;

    return {
      currentPrice: todayClose,
      priceChangePct,
      currentVolume: todayVolume,
      avgVolume1m,
      avgVolume2m,
      avgVolume3m,
      volumeRatio1m,
    };
  }

  // Strategy 3 & scoring: 0-100 breakout score and signal classification.
  public static evaluateBreakout(
    metrics: VolumeMetrics,
    resistance: ResistanceLevel
  ): { score: number; signal: SignalType } {
    let score = 0;
    const distancePct = ((resistance.price - metrics.currentPrice) / resistance.price) * 100;

    // 1. Near resistance (max 30)
    if (distancePct >= -0.5 && distancePct <= 5.0) {
      if (distancePct <= 2.0) score += 30;
      else score += 20;
    }

    // 2. Volume expansion vs 1-month average (max 30)
    if (metrics.volumeRatio1m >= 3.0) score += 30;
    else if (metrics.volumeRatio1m >= 2.0) score += 25;
    else if (metrics.volumeRatio1m >= 1.5) score += 15;

    // 3. Price momentum today (max 20)
    if (metrics.priceChangePct >= 2.0) score += 20;
    else if (metrics.priceChangePct >= 1.0) score += 10;

    // 4. Volume confirmation vs the resistance peak's own volume (max 20)
    if (resistance.peakVolume && resistance.peakVolume > 0) {
      const ratio = metrics.currentVolume / resistance.peakVolume;
      if (ratio >= 1.0) score += 20;
      else if (ratio >= 0.8) score += 15;
    } else if (resistance.type === 'PSYCHOLOGICAL' && metrics.volumeRatio1m >= 2.0) {
      score += 15;
    }

    let signal: SignalType = 'IGNORE';
    if (score >= 85) signal = 'STRONG_BUY';
    else if (score >= 70) signal = 'BREAKOUT_WATCH';
    else if (score >= 50) signal = 'MONITOR';

    return { score, signal };
  }
}
