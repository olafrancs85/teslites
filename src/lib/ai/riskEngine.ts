import { EngineScore } from "./types";

interface RiskInput {
  support: number | null;
  resistance: number | null;
  price: number;
}

export function riskEngine({
  support,
  resistance,
  price,
}: RiskInput): EngineScore {
  if (
    support === null ||
    resistance === null
  ) {
    return {
      score: 0,
      explanation:
        "Risk cannot be calculated because support or resistance is unavailable.",
    };
  }

  const downside = price - support;
  const upside = resistance - price;

  if (downside <= 0 || upside <= 0) {
    return {
      score: -20,
      explanation:
        "Current price is outside the expected trading range.",
    };
  }

  const ratio = upside / downside;

  if (ratio >= 3) {
    return {
      score: 25,
      explanation:
        "Excellent reward-to-risk ratio exceeds 3:1.",
    };
  }

  if (ratio >= 2) {
    return {
      score: 15,
      explanation:
        "Healthy reward-to-risk ratio exceeds 2:1.",
    };
  }

  if (ratio >= 1.2) {
    return {
      score: 5,
      explanation:
        "Reward slightly exceeds risk.",
    };
  }

  return {
    score: -20,
    explanation:
      "Risk outweighs the potential reward.",
  };
}