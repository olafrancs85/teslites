export type TradingAction =
  | "BUY"
  | "WAIT"
  | "AVOID";

export interface TradingPlan {
  action: TradingAction;
  bias:
    | "Bullish"
    | "Bearish"
    | "Neutral";
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskReward: number | null;
  reason: string;
}

interface TradingPlanInput {
  price: number;
  trend:
    | "Bullish"
    | "Bearish"
    | "Neutral";
  rsi: number | null;
  macdTrend:
    | "bullish"
    | "bearish"
    | "neutral";
  volumeTrend:
    | "rising"
    | "falling"
    | "neutral";
  support: number | null;
  resistance: number | null;
}

/* =============================
HELPERS
============================= */

function calculateDistancePercent(
  price: number,
  level: number | null
): number | null {
  if (
    !Number.isFinite(price) ||
    price <= 0 ||
    level === null ||
    !Number.isFinite(level) ||
    level <= 0
  ) {
    return null;
  }

  return Math.abs(
    ((level - price) / price) * 100
  );
}

/* =============================
TRADING PLAN ENGINE
============================= */

export function generateTradingPlan(
  input: TradingPlanInput
): TradingPlan {
  const {
    price,
    trend,
    rsi,
    macdTrend,
    volumeTrend,
    support,
    resistance,
  } = input;

  /* -----------------------------
  INVALID PRICE
  ----------------------------- */

  if (
    !Number.isFinite(price) ||
    price <= 0
  ) {
    return {
      action: "WAIT",
      bias: "Neutral",
      entry: null,
      stopLoss: null,
      takeProfit: null,
      riskReward: null,
      reason:
        "Trading plan unavailable because the current price is invalid.",
    };
  }

  /* -----------------------------
  SIGNAL COUNTS
  ----------------------------- */

  const bullishSignals = [
    trend === "Bullish",
    macdTrend === "bullish",
    volumeTrend === "rising",
    rsi !== null &&
      rsi >= 50 &&
      rsi < 70,
  ].filter(Boolean).length;

  const bearishSignals = [
    trend === "Bearish",
    macdTrend === "bearish",
    volumeTrend === "falling",
    rsi !== null &&
      rsi <= 50 &&
      rsi > 30,
  ].filter(Boolean).length;

  /* -----------------------------
  PRICE / ZONE DISTANCES
  ----------------------------- */

  const supportDistance =
    calculateDistancePercent(
      price,
      support
    );

  const resistanceDistance =
    calculateDistancePercent(
      price,
      resistance
    );

  const nearSupport =
    supportDistance !== null &&
    supportDistance <= 3;

  const nearResistance =
    resistanceDistance !== null &&
    resistanceDistance <= 3;

  /* -----------------------------
  RSI EXTREMES
  ----------------------------- */

  /*
   * Handle extreme RSI conditions before
   * constructing a directional trade.
   *
   * This prevents a strongly bullish trend
   * from automatically producing a BUY when
   * price is already excessively extended.
   */

  if (
    rsi !== null &&
    rsi > 70
  ) {
    return {
      action: "WAIT",
      bias:
        trend === "Bearish"
          ? "Bearish"
          : trend === "Bullish"
          ? "Bullish"
          : "Neutral",
      entry: null,
      stopLoss: null,
      takeProfit: null,
      riskReward: null,
      reason:
        `RSI is elevated at ${rsi.toFixed(
          1
        )}. Even with bullish technical conditions, entering after an extended move increases pullback risk. Waiting for consolidation or a controlled retracement is preferred.`,
    };
  }

  if (
    rsi !== null &&
    rsi < 30 &&
    trend !== "Bearish"
  ) {
    return {
      action: "WAIT",
      bias:
        trend === "Bullish"
          ? "Bullish"
          : "Neutral",
      entry: null,
      stopLoss: null,
      takeProfit: null,
      riskReward: null,
      reason:
        `RSI is oversold at ${rsi.toFixed(
          1
        )}. A rebound is possible, but oversold conditions alone are not sufficient confirmation for a new position. Waiting for momentum confirmation is preferred.`,
    };
  }

  /* -----------------------------
  STRONG BEARISH STRUCTURE
  ----------------------------- */

  const bearishStructure =
    trend === "Bearish" &&
    macdTrend === "bearish" &&
    volumeTrend === "falling";

  if (bearishStructure) {
    /*
     * If price is already close to support,
     * don't chase the downside.
     *
     * Wait for the support to break and
     * establish itself as new resistance.
     */

    if (nearSupport) {
      return {
        action: "WAIT",
        bias: "Bearish",
        entry: null,
        stopLoss: null,
        takeProfit: null,
        riskReward: null,
        reason:
          `Bearish momentum is present, but price is only ${supportDistance?.toFixed(
            1
          )}% above identified support. Selling directly into support creates poor downside-to-risk positioning. Wait for a confirmed support breakdown before considering a bearish trade.`,
      };
    }

    /*
     * Strong bearish structure with sufficient
     * distance from support.
     *
     * This engine currently focuses on long-side
     * execution, so bearish conditions do not
     * automatically create a short position.
     */

    return {
      action: "AVOID",
      bias: "Bearish",
      entry: null,
      stopLoss: null,
      takeProfit: null,
      riskReward: null,
      reason:
        "Bearish momentum is aligned across trend, MACD and volume. The current structure does not provide a favourable long setup, so new long positions should be avoided until momentum stabilizes.",
    };
  }

  /* -----------------------------
  STRONG BULLISH STRUCTURE
  ----------------------------- */

  const bullishStructure =
    trend === "Bullish" &&
    macdTrend === "bullish" &&
    volumeTrend === "rising";

  if (bullishStructure) {
    /*
     * Avoid chasing price directly into resistance.
     */

    if (nearResistance) {
      return {
        action: "WAIT",
        bias: "Bullish",
        entry: null,
        stopLoss: null,
        takeProfit: null,
        riskReward: null,
        reason:
          `Bullish momentum is present, but price is only ${resistanceDistance?.toFixed(
            1
          )}% below identified resistance. Waiting for a confirmed breakout or a controlled pullback provides a better risk profile.`,
      };
    }

    /*
     * We need both support and resistance
     * to construct a meaningful risk/reward setup.
     */

    if (
      support !== null &&
      resistance !== null &&
      support < price &&
      resistance > price
    ) {
      const entry = price;

      /*
       * Place the stop slightly below support.
       */

      const stopLoss =
        support * 0.98;

      const takeProfit =
        resistance;

      const risk =
        entry - stopLoss;

      const reward =
        takeProfit - entry;

      const riskReward =
        risk > 0
          ? reward / risk
          : null;

      /*
       * Reject invalid risk/reward structures.
       */

      if (
        riskReward === null ||
        riskReward <= 0
      ) {
        return {
          action: "WAIT",
          bias: "Bullish",
          entry: null,
          stopLoss: null,
          takeProfit: null,
          riskReward: null,
          reason:
            "Bullish momentum is present, but the calculated trade structure does not produce a valid positive risk/reward profile.",
        };
      }

      /*
       * Require a minimum 1.5:1
       * risk/reward ratio.
       */

      if (
        riskReward >= 1.5
      ) {
        return {
          action: "BUY",
          bias: "Bullish",
          entry: Number(
            entry.toFixed(2)
          ),
          stopLoss: Number(
            stopLoss.toFixed(2)
          ),
          takeProfit: Number(
            takeProfit.toFixed(2)
          ),
          riskReward: Number(
            riskReward.toFixed(2)
          ),
          reason:
            `Bullish trend, bullish MACD and rising volume are aligned. Price is not immediately facing resistance and the projected setup offers a ${riskReward.toFixed(
              2
            )}:1 risk/reward profile.`,
        };
      }

      return {
        action: "WAIT",
        bias: "Bullish",
        entry: null,
        stopLoss: null,
        takeProfit: null,
        riskReward: Number(
          riskReward.toFixed(2)
        ),
        reason:
          `The technical structure is bullish, but the available support and resistance levels provide only a ${riskReward.toFixed(
            2
          )}:1 risk/reward profile. Waiting for a better entry or improved structure is preferred.`,
      };
    }

    return {
      action: "WAIT",
      bias: "Bullish",
      entry: null,
      stopLoss: null,
      takeProfit: null,
      riskReward: null,
      reason:
        "Bullish momentum is developing, but reliable support and resistance levels are not yet sufficient to construct a high-quality risk-managed entry.",
    };
  }

  /* -----------------------------
  MIXED SIGNALS
  ----------------------------- */

  if (
    bullishSignals > bearishSignals
  ) {
    return {
      action: "WAIT",
      bias: "Bullish",
      entry: null,
      stopLoss: null,
      takeProfit: null,
      riskReward: null,
      reason:
        `The technical structure has a bullish bias, with ${bullishSignals} bullish signals versus ${bearishSignals} bearish signals. However, the major confirmation signals are not sufficiently aligned for a high-conviction entry.`,
    };
  }

  if (
    bearishSignals > bullishSignals
  ) {
    return {
      action: "AVOID",
      bias: "Bearish",
      entry: null,
      stopLoss: null,
      takeProfit: null,
      riskReward: null,
      reason:
        `The technical structure has a bearish bias, with ${bearishSignals} bearish signals versus ${bullishSignals} bullish signals. Until momentum stabilizes or the trend improves, initiating a new long position is not preferred.`,
    };
  }

  /* -----------------------------
  DEFAULT
  ----------------------------- */

  return {
    action: "WAIT",
    bias: "Neutral",
    entry: null,
    stopLoss: null,
    takeProfit: null,
    riskReward: null,
    reason:
      "Technical signals are mixed. Waiting for stronger confirmation before taking a directional position is preferred.",
  };
}