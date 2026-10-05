export interface SRZone {
  price: number;
  type: "SUPPORT" | "RESISTANCE";
  strength: number;
  touches: number;
  distancePercent: number;
  timeframe: "1D" | "1W" | "1M";
}

export interface SupportResistanceResult {
  supports: SRZone[];
  resistances: SRZone[];
  nearestSupport: SRZone | null;
  nearestResistance: SRZone | null;
  supportStrength: number;
  resistanceStrength: number;
  narrative: string;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Input {
  daily: Candle[];
  weekly: Candle[];
  monthly: Candle[];
  currentPrice: number;
}

interface PricePoint {
  price: number;
  timeframe: "1D" | "1W" | "1M";
  type: "SUPPORT" | "RESISTANCE";
}

/* =============================
   HELPERS
============================= */

function roundPrice(price: number): number {
  return Number(price.toFixed(2));
}

function calculateDistancePercent(
  price: number,
  currentPrice: number
): number {
  if (!Number.isFinite(price) || currentPrice === 0) {
    return 0;
  }

  return Math.abs(
    ((price - currentPrice) / currentPrice) * 100
  );
}

/*
 * Detect local swing lows and highs.
 *
 * A swing low is a candle whose low is lower than
 * the lows immediately surrounding it.
 *
 * A swing high is the opposite.
 */
function detectSwingPoints(
  candles: Candle[],
  timeframe: "1D" | "1W" | "1M"
): PricePoint[] {
  if (candles.length < 5) {
    return [];
  }

  const points: PricePoint[] = [];

  for (let i = 2; i < candles.length - 2; i++) {
    const current = candles[i];

    const previous1 = candles[i - 1];
    const previous2 = candles[i - 2];

    const next1 = candles[i + 1];
    const next2 = candles[i + 2];

    /*
     * Swing low = potential support.
     */
    const isSwingLow =
      current.low < previous1.low &&
      current.low < previous2.low &&
      current.low <= next1.low &&
      current.low <= next2.low;

    if (isSwingLow) {
      points.push({
        price: current.low,
        timeframe,
        type: "SUPPORT",
      });
    }

    /*
     * Swing high = potential resistance.
     */
    const isSwingHigh =
      current.high > previous1.high &&
      current.high > previous2.high &&
      current.high >= next1.high &&
      current.high >= next2.high;

    if (isSwingHigh) {
      points.push({
        price: current.high,
        timeframe,
        type: "RESISTANCE",
      });
    }
  }

  return points;
}

/*
 * Combine nearby price levels into one zone.
 *
 * Example:
 *
 * 440
 * 443
 * 445
 *
 * should not become three separate resistance levels.
 *
 * They represent approximately the same market zone.
 */
function clusterPricePoints(
  points: PricePoint[],
  currentPrice: number
): SRZone[] {
  if (points.length === 0) {
    return [];
  }

  /*
   * Timeframe importance.
   *
   * Monthly levels carry the most structural weight,
   * followed by weekly and then daily levels.
   */
  const timeframeWeight: Record<
    PricePoint["timeframe"],
    number
  > = {
    "1D": 1,
    "1W": 2,
    "1M": 3,
  };

  /*
   * Maximum distance allowed between a new level
   * and the cluster's weighted center.
   */
  const CLUSTER_THRESHOLD_PERCENT = 1.5;

  /*
   * Sort levels by price so nearby levels are
   * evaluated together.
   */
  const sorted = [...points].sort(
    (a, b) => a.price - b.price
  );

  const clusters: PricePoint[][] = [];

  for (const point of sorted) {
    const lastCluster =
      clusters[clusters.length - 1];

    if (!lastCluster) {
      clusters.push([point]);
      continue;
    }

    /*
     * Calculate the timeframe-weighted center
     * of the current cluster.
     */
    const weightedPrice =
      lastCluster.reduce(
        (sum, item) =>
          sum +
          item.price *
            timeframeWeight[item.timeframe],
        0
      );

    const totalWeight =
      lastCluster.reduce(
        (sum, item) =>
          sum +
          timeframeWeight[item.timeframe],
        0
      );

    const clusterCenter =
      totalWeight > 0
        ? weightedPrice / totalWeight
        : lastCluster.reduce(
            (sum, item) => sum + item.price,
            0
          ) / lastCluster.length;

    const distancePercent =
      Math.abs(
        ((point.price - clusterCenter) /
          clusterCenter) *
          100
      );

    if (
      distancePercent <=
      CLUSTER_THRESHOLD_PERCENT
    ) {
      lastCluster.push(point);
    } else {
      clusters.push([point]);
    }
  }

  /*
   * Convert each cluster into an SR zone.
   */
  return clusters.map((cluster) => {
    /*
     * -----------------------------------------
     * TIMEFRAME-WEIGHTED PRICE
     * -----------------------------------------
     */
    const totalWeight =
      cluster.reduce(
        (sum, point) =>
          sum +
          timeframeWeight[point.timeframe],
        0
      );

    const weightedPrice =
      cluster.reduce(
        (sum, point) =>
          sum +
          point.price *
            timeframeWeight[point.timeframe],
        0
      );

    const averagePrice =
      totalWeight > 0
        ? weightedPrice / totalWeight
        : cluster.reduce(
            (sum, point) =>
              sum + point.price,
            0
          ) / cluster.length;

    /*
     * -----------------------------------------
     * TOUCH COUNT
     * -----------------------------------------
     */
    const touches = cluster.length;

    /*
     * -----------------------------------------
     * TIMEFRAME CONFLUENCE
     * -----------------------------------------
     */
    const timeframes = new Set(
      cluster.map(
        (point) => point.timeframe
      )
    );

    const hasDaily =
      timeframes.has("1D");

    const hasWeekly =
      timeframes.has("1W");

    const hasMonthly =
      timeframes.has("1M");

    /*
     * -----------------------------------------
     * BASE STRENGTH
     * -----------------------------------------
     */
    let strength = 0;

    for (const point of cluster) {
      strength +=
        timeframeWeight[
          point.timeframe
        ] * 10;
    }

    /*
     * -----------------------------------------
     * REPEATED REACTION BONUS
     * -----------------------------------------
     */
    strength += Math.max(
      0,
      (touches - 1) * 10
    );

    /*
     * -----------------------------------------
     * MULTI-TIMEFRAME CONFLUENCE BONUS
     * -----------------------------------------
     *
     * Daily + Weekly   = +10
     * Weekly + Monthly = +15
     * Daily + Monthly  = +15
     * All three        = +25
     */
    if (hasDaily && hasWeekly) {
      strength += 10;
    }

    if (hasWeekly && hasMonthly) {
      strength += 15;
    }

    if (hasDaily && hasMonthly) {
      strength += 15;
    }

    if (
      hasDaily &&
      hasWeekly &&
      hasMonthly
    ) {
      strength += 25;
    }

    /*
     * Keep strength within 0-100.
     */
    strength = Math.min(
      100,
      Math.round(strength)
    );

    /*
     * Determine the strongest timeframe
     * represented by the cluster.
     */
    let dominantTimeframe:
      "1D" | "1W" | "1M";

    if (hasMonthly) {
      dominantTimeframe = "1M";
    } else if (hasWeekly) {
      dominantTimeframe = "1W";
    } else {
      dominantTimeframe = "1D";
    }

    return {
      price: roundPrice(
        averagePrice
      ),

      type: cluster[0].type,

      strength,

      touches,

      distancePercent: Number(
        calculateDistancePercent(
          averagePrice,
          currentPrice
        ).toFixed(2)
      ),

      timeframe:
        dominantTimeframe,
    };
  });
}

/* =============================
   MAIN ENGINE
============================= */

export function supportResistanceEngine({
  daily,
  weekly,
  monthly,
  currentPrice,
}: Input): SupportResistanceResult {
  if (
    !Number.isFinite(currentPrice) ||
    currentPrice <= 0
  ) {
    return {
      supports: [],
      resistances: [],
      nearestSupport: null,
      nearestResistance: null,
      supportStrength: 0,
      resistanceStrength: 0,
      narrative:
        "Support and resistance analysis is unavailable because the current price is invalid.",
    };
  }

  /*
   * Detect swing points independently
   * on each timeframe.
   */
  const points: PricePoint[] = [
    ...detectSwingPoints(
      daily,
      "1D"
    ),
    ...detectSwingPoints(
      weekly,
      "1W"
    ),
    ...detectSwingPoints(
      monthly,
      "1M"
    ),
  ];

  /*
   * Separate support and resistance points.
   */
  const supportPoints = points.filter(
    (point) =>
      point.type === "SUPPORT" &&
      point.price < currentPrice
  );

  const resistancePoints = points.filter(
    (point) =>
      point.type === "RESISTANCE" &&
      point.price > currentPrice
  );

  /*
   * Cluster nearby levels.
   */
  const supports = clusterPricePoints(
    supportPoints,
    currentPrice
  )
    .sort(
      (a, b) =>
        b.price - a.price
    )
    .slice(0, 5);

  const resistances = clusterPricePoints(
    resistancePoints,
    currentPrice
  )
    .sort(
      (a, b) =>
        a.price - b.price
    )
    .slice(0, 5);

  /*
   * Nearest meaningful levels.
   */
  const nearestSupport =
    supports.length > 0
      ? supports[0]
      : null;

  const nearestResistance =
    resistances.length > 0
      ? resistances[0]
      : null;

  /*
   * Overall zone strength.
   */
  const supportStrength =
    supports.length > 0
      ? Math.max(
          ...supports.map(
            (zone) => zone.strength
          )
        )
      : 0;

  const resistanceStrength =
    resistances.length > 0
      ? Math.max(
          ...resistances.map(
            (zone) => zone.strength
          )
        )
      : 0;

  /*
   * Build institutional-style narrative.
   */
  let narrative =
    "Support and resistance structure is currently limited.";

  if (
    nearestSupport &&
    nearestResistance
  ) {
    narrative =
      `Tesla is currently trading around $${roundPrice(
        currentPrice
      )}. ` +
      `The nearest identified support is around $${nearestSupport.price}, ` +
      `approximately ${nearestSupport.distancePercent}% below the current price. ` +
      `The nearest resistance is around $${nearestResistance.price}, ` +
      `approximately ${nearestResistance.distancePercent}% above the current price.`;
  } else if (nearestSupport) {
    narrative =
      `The nearest identified support is around $${nearestSupport.price}, ` +
      `approximately ${nearestSupport.distancePercent}% below the current price. ` +
      `No significant nearby resistance zone has been confirmed.`;
  } else if (nearestResistance) {
    narrative =
      `The nearest identified resistance is around $${nearestResistance.price}, ` +
      `approximately ${nearestResistance.distancePercent}% above the current price. ` +
      `No significant nearby support zone has been confirmed.`;
  }

  return {
    supports,
    resistances,
    nearestSupport,
    nearestResistance,
    supportStrength,
    resistanceStrength,
    narrative,
  };
}