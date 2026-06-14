import { OHLCV, ResistanceLevel, OptimizationMetrics } from '../types';

export class QuantEngine {
  
  // Strategy 1: Previous 1-3 Month Swing Highs & Psychological Levels Detect Karna
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
          peakVolume: history[i].volume
        });
      }
    }

    const psychBases = [100, 200, 500, 1000, 2000, 5000, 10000];
    psychBases.forEach(base => {
      if (currentPrice >= base * 0.9 && currentPrice <= base * 1.05) {
        levels.push({
          price: base,
          type: 'PSYCHOLOGICAL',
          peakVolume: 0
        });
      }
    });

    return levels;
  }

  // Strategy 2: Volume Averages aur Ratio Nikalna
  public static calculateVolumeMetrics(history: OHLCV[], todayClose: number, yesterdayClose: number, todayVolume: number): OptimizationMetrics {
    const sortedHistory = [...history].sort((a,b) => b.date.getTime() - a.date.getTime());
    
    const vol30 = sortedHistory.slice(0, 30).reduce((sum, day) => sum + day.volume, 0) / 30;
    const vol90 = sortedHistory.slice(0, 90).reduce((sum, day) => sum + day.volume, 0) / 90;
    
    const priceChangePct = ((todayClose - yesterdayClose) / yesterdayClose) * 100;
    const volumeRatio = vol30 > 0 ? todayVolume / vol30 : 0;

    return {
      currentPrice: todayClose,
      priceChangePct,
      currentVolume: todayVolume,
      avgVolume30d: Math.round(vol30),
      avgVolume90d: Math.round(vol90),
      volumeRatio
    };
  }

  // Strategy 3 & Scoring: Breakout Score out of 100 calculate karna
  public static evaluateBreakout(
    metrics: OptimizationMetrics,
    resistance: ResistanceLevel
  ): { score: number; signal: 'STRONG_BUY' | 'BREAKOUT_WATCH' | 'MONITOR' | 'IGNORE' } {
    let score = 0;
    const distancePct = ((resistance.price - metrics.currentPrice) / resistance.price) * 100;

    // 1. Near Resistance (Max 30 points)
    if (distancePct >= -0.5 && distancePct <= 5.0) {
      if (distancePct <= 2.0) score += 30;
      else score += 20;
    }

    // 2. Volume Expansion (Max 30 points)
    if (metrics.volumeRatio >= 3.0) score += 30;
    else if (metrics.volumeRatio >= 2.0) score += 25;
    else if (metrics.volumeRatio >= 1.5) score += 15;

    // 3. Price Momentum (Max 20 points)
    if (metrics.priceChangePct >= 2.0) score += 20;
    else if (metrics.priceChangePct >= 1.0) score += 10;

    // 4. Volume Confirmation (Max 20 points)
    if (resistance.peakVolume && resistance.peakVolume > 0) {
      const volConfirmationRatio = metrics.currentVolume / resistance.peakVolume;
      if (volConfirmationRatio >= 1.0) score += 20;
      else if (volConfirmationRatio >= 0.8) score += 15;
    } else if (resistance.type === 'PSYCHOLOGICAL' && metrics.volumeRatio >= 2.0) {
      score += 15;
    }

    let signal: 'STRONG_BUY' | 'BREAKOUT_WATCH' | 'MONITOR' | 'IGNORE' = 'IGNORE';
    if (score >= 85) signal = 'STRONG_BUY';
    else if (score >= 70) signal = 'BREAKOUT_WATCH';
    else if (score >= 50) signal = 'MONITOR';

    return { score, signal };
  }
}