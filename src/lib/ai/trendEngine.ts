import { EngineScore } from "./types";

interface TrendInput {
  price: number;
  ma20: number | null;
  ma50: number | null;
}

export function trendEngine({
  price,
  ma20,
  ma50,
}: TrendInput): EngineScore {
  let score = 0;

  const reasons: string[] = [];

  if (
    ma20 === null ||
    ma50 === null
  ) {
    return {
      score: 0,
      explanation:
        "Not enough data to determine trend.",
    };
  }

  // Strong uptrend

  if (
    price > ma20 &&
    ma20 > ma50
  ) {
    score += 30;

    reasons.push(
      "Price remains above both moving averages, confirming a healthy uptrend."
    );
  }

  // Strong downtrend

  else if (
    price < ma20 &&
    ma20 < ma50
  ) {
    score -= 30;

    reasons.push(
      "Price remains below both moving averages, confirming a healthy downtrend."
    );
  }

  // Pullback

  else if (
    price < ma20 &&
    ma20 > ma50
  ) {
    score += 10;

    reasons.push(
      "The longer-term trend remains bullish despite a short-term pullback."
    );
  }

  // Relief rally

  else if (
    price > ma20 &&
    ma20 < ma50
  ) {
    score -= 10;

    reasons.push(
      "Price is bouncing inside a broader bearish trend."
    );
  }

  else {
    reasons.push(
      "Trend strength is mixed."
    );
  }

  return {
    score,
    explanation: reasons.join(" "),
  };
}