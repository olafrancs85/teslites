export type MarketRegime =
  | "STRONG_UPTREND"
  | "UPTREND"
  | "RANGE"
  | "DOWNTREND"
  | "STRONG_DOWNTREND"
  | "HIGH_VOLATILITY";

interface Input {
  ma20: number | null;
  ma50: number | null;
  rsi: number | null;
  percentMove: number;
  macdTrend: "bullish" | "bearish" | "neutral";
  volumeTrend: "rising" | "falling" | "neutral";
}

export function marketRegimeEngine({
  ma20,
  ma50,
  rsi,
  percentMove,
  macdTrend,
  volumeTrend,
}: Input): MarketRegime {

  // Extreme volatility
  if (Math.abs(percentMove) >= 5) {
    return "HIGH_VOLATILITY";
  }

  if (
    ma20 === null ||
    ma50 === null ||
    rsi === null
  ) {
    return "RANGE";
  }

  const maGap = ((ma20 - ma50) / ma50) * 100;

  if (
    maGap > 2 &&
    macdTrend === "bullish" &&
    volumeTrend === "rising" &&
    rsi > 55
  ) {
    return "STRONG_UPTREND";
  }

  if (
    maGap > 0 &&
    macdTrend !== "bearish"
  ) {
    return "UPTREND";
  }

  if (
    maGap < -2 &&
    macdTrend === "bearish" &&
    volumeTrend === "falling" &&
    rsi < 45
  ) {
    return "STRONG_DOWNTREND";
  }

  if (
    maGap < 0 &&
    macdTrend !== "bullish"
  ) {
    return "DOWNTREND";
  }

  return "RANGE";
}