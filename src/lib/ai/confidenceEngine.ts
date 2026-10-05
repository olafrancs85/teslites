type EarningsVerdict = "Beat" | "Miss" | "Mixed";

type TechnicalBias =
  | "Bullish"
  | "Moderately Bullish"
  | "Neutral"
  | "Bearish";

type IntelligenceConfidence = "Low" | "Medium" | "High";

type MACDTrend = "bullish" | "bearish" | "neutral";

type VolumeTrend = "rising" | "falling" | "neutral";

interface ConfidenceInput {
  earningsVerdict: EarningsVerdict;
  technicalBias: TechnicalBias;
  rsi: number;
  intelligenceConfidence: IntelligenceConfidence;
  macdTrend: MACDTrend;
  volumeTrend: VolumeTrend;
}

export function calculateConfidenceScore(
  input: ConfidenceInput
): number {
  let score = 0;

  // Earnings — 20 points
  if (input.earningsVerdict === "Beat") {
    score += 20;
  } else if (input.earningsVerdict === "Mixed") {
    score += 12;
  } else {
    score += 5;
  }

  // Technical Bias — 20 points
  if (
    input.technicalBias === "Bullish" ||
    input.technicalBias === "Bearish"
  ) {
    score += 20;
  } else if (input.technicalBias === "Moderately Bullish") {
    score += 15;
  } else {
    score += 10;
  }

  // RSI — 15 points
  if (input.rsi >= 45 && input.rsi <= 65) {
    score += 15;
  } else if (
    (input.rsi >= 35 && input.rsi < 45) ||
    (input.rsi > 65 && input.rsi <= 70)
  ) {
    score += 10;
  } else {
    score += 5;
  }

  // MACD — 15 points
  if (
    input.macdTrend === "bullish" ||
    input.macdTrend === "bearish"
  ) {
    score += 15;
  } else {
    score += 8;
  }

  // Volume — 10 points
  if (
    input.volumeTrend === "rising" ||
    input.volumeTrend === "falling"
  ) {
    score += 10;
  } else {
    score += 5;
  }

  // Live Intelligence — 20 points
  if (input.intelligenceConfidence === "High") {
    score += 20;
  } else if (input.intelligenceConfidence === "Medium") {
    score += 12;
  } else {
    score += 5;
  }

  return Math.min(100, Math.max(0, score));
}