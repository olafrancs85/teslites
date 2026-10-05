import { EngineScore } from "./types";

interface VolumeInput {
  volumeTrend: "rising" | "falling" | "neutral";
  priceChangePercent: number;
}

export function volumeEngine({
  volumeTrend,
  priceChangePercent,
}: VolumeInput): EngineScore {
  let score = 0;

  const reasons: string[] = [];

  // Strong bullish confirmation
  if (
    volumeTrend === "rising" &&
    priceChangePercent > 0
  ) {
    score += 20;

    reasons.push(
      "Increasing volume confirms the upward price movement."
    );
  }

  // Strong bearish confirmation
  else if (
    volumeTrend === "rising" &&
    priceChangePercent < 0
  ) {
    score -= 20;

    reasons.push(
      "Heavy selling volume confirms bearish momentum."
    );
  }

  // Bullish but weak conviction
  else if (
    volumeTrend === "falling" &&
    priceChangePercent > 0
  ) {
    score += 5;

    reasons.push(
      "Price is rising, but declining volume suggests weak buying conviction."
    );
  }

  // Bearish but weak conviction
  else if (
    volumeTrend === "falling" &&
    priceChangePercent < 0
  ) {
    score -= 5;

    reasons.push(
      "Selling pressure is fading as volume declines."
    );
  }

  else {
    reasons.push(
      "Volume provides no significant confirmation."
    );
  }

  return {
    score,
    explanation: reasons.join(" "),
  };
}