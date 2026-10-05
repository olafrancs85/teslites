import type { EngineScore } from "./types";
import type { MarketRegime } from "./marketRegimeEngine";

export interface DecisionResult {
  totalScore: number;
  confidence: number;
  recommendation:
    | "STRONG BUY"
    | "BUY"
    | "HOLD"
    | "SELL"
    | "STRONG SELL";
  explanation: string[];
}

interface WeightedEngine extends EngineScore {
  weight: number;
}

export interface DecisionContext {
  multiTimeframeScore?: number;
  multiTimeframeWeight?: number;

  supportResistanceScore?: number;
  supportResistanceWeight?: number;

  currentPrice?: number;
  nearestSupport?: number | null;
  nearestResistance?: number | null;
  supportStrength?: number;
  resistanceStrength?: number;
}

/* =============================
   HELPERS
============================= */

function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculates how close price is to a level.
 *
 * Example:
 *
 * price = 327
 * support = 315
 *
 * distance ≈ 3.7%
 */
function distancePercent(
  price: number,
  level: number | null | undefined
): number | null {
  if (
    !Number.isFinite(price) ||
    price <= 0 ||
    level == null ||
    !Number.isFinite(level) ||
    level <= 0
  ) {
    return null;
  }

  return Math.abs((price - level) / price) * 100;
}

/* =============================
   MAIN DECISION ENGINE
============================= */

export function decisionEngine(
  engines: WeightedEngine[],
  regime: MarketRegime,
  context: DecisionContext = {}
): DecisionResult {
  /* -----------------------------
     1. BASE ENGINE SCORE
  ----------------------------- */

  const baseScore = engines.reduce(
    (sum, engine) =>
      sum + engine.score * engine.weight,
    0
  );

  /* -----------------------------
     2. MULTI-TIMEFRAME ADJUSTMENT
  ----------------------------- */

  const rawMultiTimeframeScore =
  context.multiTimeframeScore ?? 0;

const multiTimeframeWeight =
  context.multiTimeframeWeight ?? 1;

const multiTimeframeAdjustment = clamp(
  rawMultiTimeframeScore *
    0.2 *
    multiTimeframeWeight,
  -20,
  20
);

  /* -----------------------------
     3. SUPPORT / RESISTANCE
  ----------------------------- */

  const rawSupportResistanceScore =
  context.supportResistanceScore ?? 0;

const supportResistanceWeight =
  context.supportResistanceWeight ?? 1;

const supportResistanceAdjustment = clamp(
  (context.supportResistanceScore ?? 0) *
    supportResistanceWeight,
  -20,
  20
);

  /* -----------------------------
     4. FINAL DIRECTIONAL SCORE
  ----------------------------- */

  let totalScore =
    baseScore +
    multiTimeframeAdjustment +
    supportResistanceAdjustment;

  totalScore = clamp(totalScore, -100, 100);

  /* -----------------------------
     5. STRUCTURAL ACTIONABILITY
  ----------------------------- */

  const {
    currentPrice,
    nearestSupport,
    nearestResistance,
    supportStrength = 0,
    resistanceStrength = 0,
  } = context;

  const supportDistance = distancePercent(
    currentPrice ?? 0,
    nearestSupport
  );

  const resistanceDistance = distancePercent(
    currentPrice ?? 0,
    nearestResistance
  );

  const nearStrongSupport =
    supportDistance !== null &&
    supportDistance <= 3 &&
    supportStrength >= 50;

  const nearStrongResistance =
    resistanceDistance !== null &&
    resistanceDistance <= 3 &&
    resistanceStrength >= 50;

  /*
   * A strong directional signal does not automatically
   * mean an immediate trade should be taken.
   *
   * Example:
   *
   * Strong bearish score
   * +
   * price sitting directly above strong support
   *
   * = bearish bias, but WAIT for confirmation.
   */

  let actionabilityAdjustment = 0;

  if (
    totalScore <= -35 &&
    nearStrongSupport
  ) {
    actionabilityAdjustment = 10;
  }

  if (
    totalScore >= 35 &&
    nearStrongResistance
  ) {
    actionabilityAdjustment = -10;
  }

  totalScore = clamp(
    totalScore + actionabilityAdjustment,
    -100,
    100
  );

  /* -----------------------------
     6. SIGNAL AGREEMENT
  ----------------------------- */

  const directionalEngines = engines.filter(
    (engine) => Math.abs(engine.score) >= 15
  );

  let agreement = 0;

  if (directionalEngines.length > 0) {
    const bullishCount =
      directionalEngines.filter(
        (engine) => engine.score > 0
      ).length;

    const bearishCount =
      directionalEngines.filter(
        (engine) => engine.score < 0
      ).length;

    const majority =
      Math.max(
        bullishCount,
        bearishCount
      );

    agreement =
      majority /
      directionalEngines.length;
  }

  /* -----------------------------
     7. CONFIDENCE
  ----------------------------- */

  /*
   * IMPORTANT:
   *
   * Confidence measures conviction,
   * not bullishness.
   *
   * Therefore:
   *
   * score +70 → high confidence
   * score -70 → high confidence
   * score 0   → low/moderate confidence
   */

  let confidence =
    45 +
    Math.abs(totalScore) * 0.45 +
    agreement * 15;

  /*
   * Strong trend regimes increase conviction.
   */

  if (
    regime === "STRONG_UPTREND" ||
    regime === "STRONG_DOWNTREND"
  ) {
    confidence += 5;
  }

  /*
   * High volatility reduces confidence.
   */

  if (regime === "HIGH_VOLATILITY") {
    confidence -= 10;
  }

  /*
   * Range-bound conditions reduce conviction.
   */

  if (regime === "RANGE") {
    confidence -= 8;
  }

  /*
   * Nearby strong support/resistance means
   * direction may be correct while timing remains uncertain.
   */

  if (
    nearStrongSupport ||
    nearStrongResistance
  ) {
    confidence -= 5;
  }

  confidence = Math.round(
    clamp(confidence, 0, 100)
  );

  /* -----------------------------
     8. RECOMMENDATION
  ----------------------------- */

  let recommendation:
    | "STRONG BUY"
    | "BUY"
    | "HOLD"
    | "SELL"
    | "STRONG SELL";

  if (totalScore >= 70) {
    recommendation = "STRONG BUY";
  } else if (totalScore >= 30) {
    recommendation = "BUY";
  } else if (totalScore <= -70) {
    recommendation = "STRONG SELL";
  } else if (totalScore <= -30) {
    recommendation = "SELL";
  } else {
    recommendation = "HOLD";
  }

  /*
   * Do not allow a directional recommendation to
   * pretend that the setup is immediately actionable
   * when price is sitting directly against a major zone.
   *
   * We retain the directional recommendation because
   * it describes market bias, while the trading-plan
   * engine will handle execution timing.
   */

  /* -----------------------------
     9. EXPLANATION
  ----------------------------- */

  const explanation: string[] = [
    ...engines.map(
      (engine) => engine.explanation
    ),
  ];

  if (
    Math.abs(multiTimeframeAdjustment) >= 10
  ) {
    explanation.push(
      multiTimeframeAdjustment > 0
        ? "Multiple timeframes are providing meaningful bullish confirmation."
        : "Multiple timeframes are providing meaningful bearish confirmation."
    );
  }

  if (
    Math.abs(supportResistanceAdjustment) >= 8
  ) {
    explanation.push(
      supportResistanceAdjustment > 0
        ? "Support structure is providing a meaningful bullish influence."
        : "Nearby resistance is creating meaningful bearish pressure."
    );
  }

  if (nearStrongSupport) {
    explanation.push(
      "Price is trading close to a strong support zone. Bearish continuation should be confirmed with a support breakdown before aggressive downside positioning."
    );
  }

  if (nearStrongResistance) {
    explanation.push(
      "Price is trading close to a strong resistance zone. Bullish continuation should be confirmed with a resistance breakout before aggressive upside positioning."
    );
  }

  if (agreement >= 0.75) {
    explanation.push(
      "Most directional engines are aligned, increasing confidence in the underlying market bias."
    );
  } else if (
    agreement > 0 &&
    agreement < 0.5
  ) {
    explanation.push(
      "The directional engines are showing significant disagreement, reducing confidence in the signal."
    );
  }

  if (regime === "HIGH_VOLATILITY") {
    explanation.push(
      "Elevated volatility is reducing confidence in the current directional signal."
    );
  }

  if (regime === "RANGE") {
    explanation.push(
      "The market is range-bound, so directional signals require stronger confirmation."
    );
  }

  return {
    totalScore: Number(
      totalScore.toFixed(2)
    ),
    confidence,
    recommendation,
    explanation,
  };
}