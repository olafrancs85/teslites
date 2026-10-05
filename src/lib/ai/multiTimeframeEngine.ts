export type TimeframeKey = "1D" | "1W" | "1M" | "3M";

export type TimeframeBias =
  | "STRONG_BULLISH"
  | "BULLISH"
  | "NEUTRAL"
  | "BEARISH"
  | "STRONG_BEARISH";

export interface TimeframeCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TimeframeAnalysis {
  timeframe: TimeframeKey;
  bias: TimeframeBias;
  score: number;
  strength: number;
  trend: "UP" | "DOWN" | "SIDEWAYS";
  momentum: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  volatility: "HIGH" | "NORMAL" | "LOW";
  priceChangePercent: number;
  movingAverageFast: number | null;
  movingAverageSlow: number | null;
  explanation: string;
}

export interface MultiTimeframeResult {
  analyses: Record<TimeframeKey, TimeframeAnalysis>;
  overallBias: TimeframeBias;
  overallScore: number;
  alignment: number;
  shortTermBias: TimeframeBias;
  longTermBias: TimeframeBias;
  conflict: boolean;
  narrative: string;
}

interface TimeframeInput {
  daily: TimeframeCandle[];
  weekly: TimeframeCandle[];
  monthly: TimeframeCandle[];
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

function calculateSMA(
  candles: TimeframeCandle[],
  period: number
): number | null {
  if (candles.length < period) return null;

  const values = candles
    .slice(-period)
    .map((candle) => candle.close);

  return average(values);
}

function calculatePercentChange(
  candles: TimeframeCandle[]
): number {
  if (candles.length < 2) return 0;

  const first = candles[0].close;
  const last = candles[candles.length - 1].close;

  if (!Number.isFinite(first) || first === 0) {
    return 0;
  }

  return ((last - first) / first) * 100;
}

function calculateRecentVolatility(
  candles: TimeframeCandle[]
): number {
  if (candles.length < 2) return 0;

  const recent = candles.slice(-10);

  const changes: number[] = [];

  for (let i = 1; i < recent.length; i++) {
    const previous = recent[i - 1].close;
    const current = recent[i].close;

    if (
      Number.isFinite(previous) &&
      Number.isFinite(current) &&
      previous !== 0
    ) {
      changes.push(
        Math.abs(((current - previous) / previous) * 100)
      );
    }
  }

  if (changes.length === 0) return 0;

  return (
    changes.reduce((sum, value) => sum + value, 0) /
    changes.length
  );
}

function calculateTrend(
  fastMA: number | null,
  slowMA: number | null,
  price: number
): "UP" | "DOWN" | "SIDEWAYS" {
  if (
    fastMA === null ||
    slowMA === null ||
    price === 0
  ) {
    return "SIDEWAYS";
  }

  const difference =
    ((fastMA - slowMA) / slowMA) * 100;

  if (difference > 1) {
    return "UP";
  }

  if (difference < -1) {
    return "DOWN";
  }

  return "SIDEWAYS";
}

function calculateMomentum(
  candles: TimeframeCandle[]
): "POSITIVE" | "NEGATIVE" | "NEUTRAL" {
  if (candles.length < 6) return "NEUTRAL";

  const recent = candles.slice(-5);

  let positive = 0;
  let negative = 0;

  for (let i = 1; i < recent.length; i++) {
    if (recent[i].close > recent[i - 1].close) {
      positive++;
    } else if (
      recent[i].close < recent[i - 1].close
    ) {
      negative++;
    }
  }

  if (positive >= 3 && positive > negative) {
    return "POSITIVE";
  }

  if (negative >= 3 && negative > positive) {
    return "NEGATIVE";
  }

  return "NEUTRAL";
}

function calculateVolatility(
  candles: TimeframeCandle[]
): "HIGH" | "NORMAL" | "LOW" {
  const volatility =
    calculateRecentVolatility(candles);

  if (volatility >= 4) {
    return "HIGH";
  }

  if (volatility <= 1) {
    return "LOW";
  }

  return "NORMAL";
}

function scoreTimeframe(
  trend: "UP" | "DOWN" | "SIDEWAYS",
  momentum:
    | "POSITIVE"
    | "NEGATIVE"
    | "NEUTRAL",
  priceChangePercent: number
): number {
  let score = 0;

  if (trend === "UP") {
    score += 40;
  } else if (trend === "DOWN") {
    score -= 40;
  }

  if (momentum === "POSITIVE") {
    score += 30;
  } else if (momentum === "NEGATIVE") {
    score -= 30;
  }

  if (priceChangePercent > 5) {
    score += 20;
  } else if (priceChangePercent > 0) {
    score += 10;
  } else if (priceChangePercent < -5) {
    score -= 20;
  } else if (priceChangePercent < 0) {
    score -= 10;
  }

  return Math.max(-100, Math.min(100, score));
}

function scoreToBias(score: number): TimeframeBias {
  if (score >= 70) {
    return "STRONG_BULLISH";
  }

  if (score >= 25) {
    return "BULLISH";
  }

  if (score <= -70) {
    return "STRONG_BEARISH";
  }

  if (score <= -25) {
    return "BEARISH";
  }

  return "NEUTRAL";
}

function analyzeTimeframe(
  timeframe: TimeframeKey,
  candles: TimeframeCandle[]
): TimeframeAnalysis {
  if (candles.length === 0) {
    return {
      timeframe,
      bias: "NEUTRAL",
      score: 0,
      strength: 0,
      trend: "SIDEWAYS",
      momentum: "NEUTRAL",
      volatility: "NORMAL",
      priceChangePercent: 0,
      movingAverageFast: null,
      movingAverageSlow: null,
      explanation: "Insufficient market data.",
    };
  }

  const price = candles[candles.length - 1].close;

  /*
   * The MA periods are deliberately scaled according
   * to the timeframe.
   *
   * Daily:
   *   20 / 50
   *
   * Weekly:
   *   10 / 20
   *
   * Monthly:
   *   6 / 12
   *
   * Quarterly:
   *   4 / 8
   */
  let fastPeriod: number;
  let slowPeriod: number;

  switch (timeframe) {
    case "1D":
      fastPeriod = 20;
      slowPeriod = 50;
      break;

    case "1W":
      fastPeriod = 10;
      slowPeriod = 20;
      break;

    case "1M":
      fastPeriod = 6;
      slowPeriod = 12;
      break;

    case "3M":
      fastPeriod = 4;
      slowPeriod = 8;
      break;
  }

  const fastMA = calculateSMA(
    candles,
    fastPeriod
  );

  const slowMA = calculateSMA(
    candles,
    slowPeriod
  );

  const trend = calculateTrend(
    fastMA,
    slowMA,
    price
  );

  const momentum = calculateMomentum(candles);

  const priceChangePercent =
    calculatePercentChange(candles);

  const volatility =
    calculateVolatility(candles);

  const score = scoreTimeframe(
    trend,
    momentum,
    priceChangePercent
  );

  const bias = scoreToBias(score);

  const strength = Math.abs(score);

  let explanation = "";

  if (bias === "STRONG_BULLISH") {
    explanation =
      `${timeframe} shows strong bullish structure with ` +
      `${trend.toLowerCase()} trend and ` +
      `${momentum.toLowerCase()} momentum.`;
  } else if (bias === "BULLISH") {
    explanation =
      `${timeframe} maintains a bullish bias, although ` +
      `confirmation strength is moderate.`;
  } else if (bias === "STRONG_BEARISH") {
    explanation =
      `${timeframe} shows strong bearish structure with ` +
      `${trend.toLowerCase()} trend and ` +
      `${momentum.toLowerCase()} momentum.`;
  } else if (bias === "BEARISH") {
    explanation =
      `${timeframe} maintains a bearish bias, although ` +
      `downside pressure is not extreme.`;
  } else {
    explanation =
      `${timeframe} is currently neutral with no dominant ` +
      `directional advantage.`;
  }

  return {
    timeframe,
    bias,
    score,
    strength,
    trend,
    momentum,
    volatility,
    priceChangePercent,
    movingAverageFast: fastMA,
    movingAverageSlow: slowMA,
    explanation,
  };
}

function buildQuarterlyCandles(
  monthly: TimeframeCandle[]
): TimeframeCandle[] {
  if (monthly.length === 0) {
    return [];
  }

  const quarters = new Map<
    string,
    TimeframeCandle[]
  >();

  for (const candle of monthly) {
    const date = new Date(candle.time);

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();

    const quarter =
      Math.floor(month / 3) + 1;

    const key = `${year}-Q${quarter}`;

    const existing = quarters.get(key) ?? [];

    existing.push(candle);

    quarters.set(key, existing);
  }

  return Array.from(quarters.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, candles]) => {
      const sorted = [...candles].sort(
        (a, b) => a.time - b.time
      );

      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      return {
        time: first.time,
        open: first.open,
        high: Math.max(
          ...sorted.map((candle) => candle.high)
        ),
        low: Math.min(
          ...sorted.map((candle) => candle.low)
        ),
        close: last.close,
        volume: sorted.reduce(
          (sum, candle) =>
            sum + (candle.volume ?? 0),
          0
        ),
      };
    });
}

function calculateAlignment(
  analyses: TimeframeAnalysis[]
): number {
  if (analyses.length === 0) return 0;

  const bullish = analyses.filter(
    (analysis) =>
      analysis.score > 15
  ).length;

  const bearish = analyses.filter(
    (analysis) =>
      analysis.score < -15
  ).length;

  const directional =
    Math.max(bullish, bearish);

  return Math.round(
    (directional / analyses.length) * 100
  );
}

function calculateOverallScore(
  analyses: TimeframeAnalysis[]
): number {
  if (analyses.length === 0) return 0;

  /*
   * Higher timeframes receive greater weight.
   *
   * 1D  = 1
   * 1W  = 1.5
   * 1M  = 2
   * 3M  = 2.5
   */
  const weights: Record<
    TimeframeKey,
    number
  > = {
    "1D": 1,
    "1W": 1.5,
    "1M": 2,
    "3M": 2.5,
  };

  let weightedScore = 0;
  let totalWeight = 0;

  for (const analysis of analyses) {
    const weight =
      weights[analysis.timeframe];

    weightedScore +=
      analysis.score * weight;

    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;

  return Math.round(
    weightedScore / totalWeight
  );
}

function buildNarrative(
  analyses: TimeframeAnalysis[],
  overallBias: TimeframeBias,
  alignment: number,
  conflict: boolean
): string {
  const daily = analyses.find(
    (analysis) =>
      analysis.timeframe === "1D"
  );

  const weekly = analyses.find(
    (analysis) =>
      analysis.timeframe === "1W"
  );

  const monthly = analyses.find(
    (analysis) =>
      analysis.timeframe === "1M"
  );

  const quarterly = analyses.find(
    (analysis) =>
      analysis.timeframe === "3M"
  );

  const shortTerm =
    daily?.bias ?? "NEUTRAL";

  const longTerm =
    quarterly?.bias ??
    monthly?.bias ??
    "NEUTRAL";

  if (conflict) {
    return (
      `Multi-timeframe signals are conflicting. ` +
      `The short-term structure is ${shortTerm.toLowerCase()}, ` +
      `while the longer-term structure is ` +
      `${longTerm.toLowerCase()}. ` +
      `Current timeframe alignment is ${alignment}%. ` +
      `This reduces conviction and increases the probability ` +
      `of false short-term signals.`
    );
  }

  if (overallBias === "STRONG_BULLISH") {
    return (
      `Multiple timeframes are aligned to the upside. ` +
      `Short-term and higher-timeframe structures are ` +
      `supportive of bullish continuation. ` +
      `Current alignment is ${alignment}%, indicating ` +
      `strong directional agreement across the market structure.`
    );
  }

  if (overallBias === "BULLISH") {
    return (
      `The multi-timeframe structure is moderately bullish. ` +
      `Higher timeframes provide a supportive backdrop, ` +
      `although some shorter-term confirmation may still be required.`
    );
  }

  if (overallBias === "STRONG_BEARISH") {
    return (
      `Multiple timeframes are aligned to the downside. ` +
      `Short-term and higher-timeframe structures are ` +
      `supportive of continued bearish pressure. ` +
      `Current alignment is ${alignment}%, indicating ` +
      `strong directional agreement.`
    );
  }

  if (overallBias === "BEARISH") {
    return (
      `The multi-timeframe structure is moderately bearish. ` +
      `Higher-timeframe pressure remains negative, although ` +
      `short-term conditions may produce counter-trend rallies.`
    );
  }

  return (
    `The multi-timeframe structure is neutral. ` +
    `No dominant directional trend is currently confirmed ` +
    `across the major timeframes.`
  );
}

export function multiTimeframeEngine({
  daily,
  weekly,
  monthly,
}: TimeframeInput): MultiTimeframeResult {
  const quarterly =
    buildQuarterlyCandles(monthly);

  const analyses: TimeframeAnalysis[] = [
    analyzeTimeframe("1D", daily),
    analyzeTimeframe("1W", weekly),
    analyzeTimeframe("1M", monthly),
    analyzeTimeframe("3M", quarterly),
  ];

  const overallScore =
    calculateOverallScore(analyses);

  const overallBias =
    scoreToBias(overallScore);

  const alignment =
    calculateAlignment(analyses);

  const dailyAnalysis =
    analyses.find(
      (analysis) =>
        analysis.timeframe === "1D"
    );

  const quarterlyAnalysis =
    analyses.find(
      (analysis) =>
        analysis.timeframe === "3M"
    );

  const monthlyAnalysis =
    analyses.find(
      (analysis) =>
        analysis.timeframe === "1M"
    );

  const shortTermBias =
    dailyAnalysis?.bias ?? "NEUTRAL";

  const longTermBias =
    quarterlyAnalysis?.bias ??
    monthlyAnalysis?.bias ??
    "NEUTRAL";

  const conflict =
    (
      shortTermBias.includes("BULLISH") &&
      longTermBias.includes("BEARISH")
    ) ||
    (
      shortTermBias.includes("BEARISH") &&
      longTermBias.includes("BULLISH")
    );

  const narrative =
    buildNarrative(
      analyses,
      overallBias,
      alignment,
      conflict
    );

  return {
    analyses: {
      "1D": analyses[0],
      "1W": analyses[1],
      "1M": analyses[2],
      "3M": analyses[3],
    },
    overallBias,
    overallScore,
    alignment,
    shortTermBias,
    longTermBias,
    conflict,
    narrative,
  };
}