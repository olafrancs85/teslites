export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
  trend: "bullish" | "bearish" | "neutral";
  crossover: "bullish" | "bearish" | "none";
}

function calculateEMA(
  values: number[],
  period: number
): number[] {
  if (values.length < period) return [];

  const multiplier = 2 / (period + 1);

  const ema: number[] = [];

  const firstSMA =
    values.slice(0, period).reduce((sum, value) => sum + value, 0) /
    period;

  ema.push(firstSMA);

  for (let i = period; i < values.length; i++) {
    const currentEMA =
      (values[i] - ema[ema.length - 1]) * multiplier +
      ema[ema.length - 1];

    ema.push(currentEMA);
  }

  return ema;
}

export function calculateMACD(closes: number[]): MACDResult | null {
  if (closes.length < 35) {
    return null;
}

  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);

  if (!ema12.length || !ema26.length) {
    return null;
  }

  const macdValues: number[] = [];

  const offset = ema12.length - ema26.length;

  for (let i = 0; i < ema26.length; i++) {
    const shortEMA = ema12[i + offset];
    const longEMA = ema26[i];

    macdValues.push(shortEMA - longEMA);
  }

  const signalValues = calculateEMA(macdValues, 9);

  if (!signalValues.length) {
    return null;
  }

  const macd = macdValues[macdValues.length - 1];
  const signal = signalValues[signalValues.length - 1];

  const previousMACD = macdValues[macdValues.length - 2];
  const previousSignal = signalValues[signalValues.length - 2];

  const histogram = macd - signal;

  let crossover: MACDResult["crossover"] = "none";

  if (
    previousMACD <= previousSignal &&
    macd > signal
  ) {
    crossover = "bullish";
  }

  if (
    previousMACD >= previousSignal &&
    macd < signal
  ) {
    crossover = "bearish";
  }

  const trend: MACDResult["trend"] =
    macd > signal
      ? "bullish"
      : macd < signal
      ? "bearish"
      : "neutral";

  return {
    macd,
    signal,
    histogram,
    trend,
    crossover,
  };
}