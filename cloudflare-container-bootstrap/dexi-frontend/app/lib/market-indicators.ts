import type { Candle } from './market-data';

export type IndicatorPoint = { time: number; value: number };

const closeValues = (candles: Candle[]) => candles.map((candle) => candle.close);

export function exponentialMovingAverage(candles: Candle[], period: number): IndicatorPoint[] {
  if (period <= 0 || candles.length < period) return [];
  const multiplier = 2 / (period + 1);
  const seed = candles.slice(0, period).reduce((sum, candle) => sum + candle.close, 0) / period;
  let ema = seed;
  const points: IndicatorPoint[] = [{ time: candles[period - 1].time, value: ema }];

  for (let index = period; index < candles.length; index += 1) {
    ema = (candles[index].close - ema) * multiplier + ema;
    points.push({ time: candles[index].time, value: ema });
  }

  return points;
}

export function relativeStrengthIndex(candles: Candle[], period = 14): number | null {
  const closes = closeValues(candles);
  if (closes.length <= period) return null;
  let gains = 0;
  let losses = 0;
  for (let index = 1; index <= period; index += 1) {
    const delta = closes[index] - closes[index - 1];
    gains += Math.max(delta, 0);
    losses += Math.max(-delta, 0);
  }

  let averageGain = gains / period;
  let averageLoss = losses / period;
  for (let index = period + 1; index < closes.length; index += 1) {
    const delta = closes[index] - closes[index - 1];
    averageGain = ((averageGain * (period - 1)) + Math.max(delta, 0)) / period;
    averageLoss = ((averageLoss * (period - 1)) + Math.max(-delta, 0)) / period;
  }

  if (averageLoss === 0) return 100;
  const relativeStrength = averageGain / averageLoss;
  return 100 - (100 / (1 + relativeStrength));
}

export function bollingerBands(candles: Candle[], period = 20, multiplier = 2) {
  const upper: IndicatorPoint[] = [];
  const middle: IndicatorPoint[] = [];
  const lower: IndicatorPoint[] = [];
  for (let index = period - 1; index < candles.length; index += 1) {
    const window = candles.slice(index - period + 1, index + 1);
    const average = window.reduce((sum, candle) => sum + candle.close, 0) / period;
    const variance = window.reduce((sum, candle) => sum + ((candle.close - average) ** 2), 0) / period;
    const deviation = Math.sqrt(variance) * multiplier;
    const time = candles[index].time;
    upper.push({ time, value: average + deviation });
    middle.push({ time, value: average });
    lower.push({ time, value: average - deviation });
  }

  return { upper, middle, lower };
}

export function movingAverageConvergenceDivergence(candles: Candle[]) {
  const fast = exponentialMovingAverage(candles, 12);
  const slow = exponentialMovingAverage(candles, 26);
  if (fast.length === 0 || slow.length === 0) return null;
  const fastByTime = new Map(fast.map((point) => [point.time, point.value]));
  const macdPoints = slow.flatMap((point) => {
    const fastValue = fastByTime.get(point.time);
    return fastValue === undefined ? [] : [{ time: point.time, value: fastValue - point.value }];
  });
  if (macdPoints.length < 9) return null;
  const signalSeed = macdPoints.slice(0, 9).reduce((sum, point) => sum + point.value, 0) / 9;
  let signal = signalSeed;
  const multiplier = 2 / 10;
  for (let index = 9; index < macdPoints.length; index += 1) {
    signal = (macdPoints[index].value - signal) * multiplier + signal;
  }

  const macd = macdPoints.at(-1)?.value ?? null;
  if (macd === null) return null;
  return { macd, signal, histogram: macd - signal };
}

export function latestChartMetrics(candles: Candle[]) {
  const latest = candles.at(-1) ?? null;
  return {
    latest,
    rsi: relativeStrengthIndex(candles),
    macd: movingAverageConvergenceDivergence(candles),
  };
}
