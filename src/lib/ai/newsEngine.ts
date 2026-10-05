import { EngineScore } from "./types";

interface NewsInput {
  headline: string;
}

const POSITIVE_KEYWORDS = [
  "beat",
  "beats",
  "record",
  "surge",
  "growth",
  "profit",
  "profits",
  "robotaxi",
  "approval",
  "approved",
  "expands",
  "expansion",
  "launch",
  "breakthrough",
  "bullish",
  "buy rating",
  "upgrade",
  "strong demand",
  "delivery record",
  "AI",
  "FSD",
];

const NEGATIVE_KEYWORDS = [
  "recall",
  "lawsuit",
  "probe",
  "investigation",
  "downgrade",
  "miss",
  "misses",
  "delay",
  "production cut",
  "factory shutdown",
  "bearish",
  "weak demand",
  "price cut",
  "decline",
  "drops",
  "crash",
  "accident",
  "fraud",
];

export function newsEngine({
  headline,
}: NewsInput): EngineScore {

  if (!headline) {
    return {
      score: 0,
      explanation:
        "No news available for analysis.",
    };
  }

  const text = headline.toLowerCase();

  let score = 0;

  for (const word of POSITIVE_KEYWORDS) {
    if (text.includes(word.toLowerCase())) {
      score += 12;
    }
  }

  for (const word of NEGATIVE_KEYWORDS) {
    if (text.includes(word.toLowerCase())) {
      score -= 12;
    }
  }

  score = Math.max(-30, Math.min(30, score));

  if (score > 0) {
    return {
      score,
      explanation:
        "Current news flow is supportive of bullish sentiment.",
    };
  }

  if (score < 0) {
    return {
      score,
      explanation:
        "Current news flow is creating bearish pressure.",
    };
  }

  return {
    score: 0,
    explanation:
      "News flow is neutral and does not materially influence market direction.",
  };
}