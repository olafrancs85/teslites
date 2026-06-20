type EarningsVerdict = "Beat" | "Miss" | "Mixed";
type TechnicalBias =
  | "Bullish"
  | "Moderately Bullish"
  | "Neutral"
  | "Bearish";
type IntelligenceConfidence = "Low" | "Medium" | "High";

interface ConfidenceInput {
  earningsVerdict: EarningsVerdict;
  technicalBias: TechnicalBias;
  rsi: number;
  intelligenceConfidence: IntelligenceConfidence;
}

export function calculateConfidenceScore(input: ConfidenceInput): number {
  let score = 0;

  // Earnings (30)
  if (input.earningsVerdict === "Beat") score += 30;
  else if (input.earningsVerdict === "Mixed") score += 18;
  else score += 8;

  // Technical Bias (30)
  if (input.technicalBias === "Bullish") score += 30;
  else if (input.technicalBias === "Moderately Bullish") score += 22;
  else if (input.technicalBias === "Neutral") score += 15;
  else score += 5;

  // RSI (20)
  if (input.rsi >= 45 && input.rsi <= 65) score += 20;
  else if (
    (input.rsi >= 35 && input.rsi < 45) ||
    (input.rsi > 65 && input.rsi <= 70)
  )
    score += 14;
  else score += 6;

  // Live Intelligence (20)
  if (input.intelligenceConfidence === "High") score += 20;
  else if (input.intelligenceConfidence === "Medium") score += 12;
  else score += 5;

  return Math.min(100, Math.max(0, score));
}
