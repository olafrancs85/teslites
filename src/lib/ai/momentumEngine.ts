import { EngineScore } from "./types";

interface MomentumInput {
  rsi: number | null;
  macdTrend: "bullish" | "bearish" | "neutral";
}

export function momentumEngine({
  rsi,
  macdTrend,
}: MomentumInput): EngineScore {
  let score = 0;

  const reasons: string[] = [];

  // --------------------
  // RSI Analysis
  // --------------------

  if (rsi !== null) {
    if (rsi < 25) {
      score += 20;
      reasons.push(
        "RSI is deeply oversold, increasing the probability of a bullish reversal."
      );
    } else if (rsi < 35) {
      score += 10;
      reasons.push(
        "RSI is approaching oversold territory."
      );
    } else if (rsi > 80) {
      score -= 20;
      reasons.push(
        "RSI is extremely overbought."
      );
    } else if (rsi > 70) {
      score -= 10;
      reasons.push(
        "RSI is entering overbought territory."
      );
    } else {
      reasons.push(
        "RSI remains in a healthy neutral range."
      );
    }
  }

  // --------------------
  // MACD
  // --------------------

  switch (macdTrend) {
    case "bullish":
      score += 20;
      reasons.push(
        "MACD indicates bullish momentum."
      );
      break;

    case "bearish":
      score -= 20;
      reasons.push(
        "MACD indicates bearish momentum."
      );
      break;

    default:
      reasons.push(
        "MACD momentum is neutral."
      );
  }

  return {
    score,
    explanation: reasons.join(" "),
  };
}