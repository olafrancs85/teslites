import { EngineScore } from "./types";

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}

interface PriceActionInput {
  candles: Candle[];
  support: number | null;
  resistance: number | null;
}

export function priceActionEngine({
  candles,
  support,
  resistance,
}: PriceActionInput): EngineScore {
  let score = 0;

  const reasons: string[] = [];

  if (
    candles.length < 3 ||
    support === null ||
    resistance === null
  ) {
    return {
      score: 0,
      explanation:
        "Not enough price history for price-action analysis.",
    };
  }

  const latest = candles[candles.length - 1];
  const previous = candles[candles.length - 2];

  // ------------------------
  // Breakout
  // ------------------------

  if (latest.close > resistance) {
    score += 30;

    reasons.push(
      "Price has broken above resistance."
    );
  }

  // ------------------------
  // Breakdown
  // ------------------------

  else if (latest.close < support) {
    score -= 30;

    reasons.push(
      "Price has broken below support."
    );
  }

  // ------------------------
  // Bounce
  // ------------------------

  else if (
    previous.low <= support &&
    latest.close > previous.close
  ) {
    score += 15;

    reasons.push(
      "Price bounced from support."
    );
  }

  // ------------------------
  // Rejection
  // ------------------------

  else if (
    previous.high >= resistance &&
    latest.close < previous.close
  ) {
    score -= 15;

    reasons.push(
      "Price was rejected near resistance."
    );
  }

  else {
    reasons.push(
      "Price remains inside its current trading range."
    );
  }

  return {
    score,
    explanation: reasons.join(" "),
  };
}