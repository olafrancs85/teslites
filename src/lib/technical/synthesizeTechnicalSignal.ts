export type TechnicalSignalTrend =
  | "Bullish"
  | "Bearish"
  | "Neutral";

export type TechnicalSignalRSI =
  | "overbought"
  | "oversold"
  | "neutral";

export type TechnicalSignalMACD =
  | "bullish"
  | "bearish"
  | "neutral";

export type TechnicalSignalVolume =
  | "rising"
  | "falling"
  | "neutral";

interface TechnicalSignalInput {
  trend: TechnicalSignalTrend;
  rsi: TechnicalSignalRSI;
  macd: TechnicalSignalMACD;
  volume: TechnicalSignalVolume;
}

export function synthesizeTechnicalSignal(
  input: TechnicalSignalInput
): string {
  const {
    trend,
    rsi,
    macd,
    volume,
  } = input;

  if (
    trend === "Bearish" &&
    macd === "bearish" &&
    volume === "falling"
  ) {
    if (rsi === "oversold") {
      return "Bearish momentum is strong, but oversold RSI suggests downside pressure may be becoming stretched.";
    }

    return "Bearish momentum is strengthening. MACD and falling volume support the downside bias, while RSI has not yet reached oversold conditions.";
  }

  if (
    trend === "Bullish" &&
    macd === "bullish" &&
    volume === "rising"
  ) {
    if (rsi === "overbought") {
      return "Bullish momentum remains strong, although overbought RSI suggests the stock may be vulnerable to a short-term pullback.";
    }

    return "Bullish momentum is strengthening. MACD and rising volume confirm the positive trend.";
  }

  if (
    trend === "Bullish" &&
    macd === "bullish"
  ) {
    return "The technical picture is moderately bullish, with trend and MACD supporting positive momentum.";
  }

  if (
    trend === "Bearish" &&
    macd === "bearish"
  ) {
    return "The technical picture remains bearish, with both trend and MACD pointing to negative momentum.";
  }

  if (
    trend === "Neutral" &&
    macd === "neutral"
  ) {
    return "Tesla's technical signals remain mixed, with no clear directional momentum currently dominating.";
  }

  return "Tesla's technical signals are mixed. The current market direction lacks strong confirmation across the major indicators.";
}