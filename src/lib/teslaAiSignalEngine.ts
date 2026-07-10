export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AISignal {
  signal: "BUY" | "SELL" | "HOLD";

  confidence: number;

  trend: "Bullish" | "Bearish" | "Neutral";

  momentum: "Strengthening" | "Weakening" | "Sideways";

  risk: "Low" | "Medium" | "High";

  support: number | null;

  resistance: number | null;

  entry: number | null;

  stopLoss: number | null;

  takeProfit: number | null;

  explanation: string;

  reasons: string[];
}

/* -----------------------------
   Moving Average
------------------------------ */
function movingAverage(
  candles: Candle[],
  period: number
): number | null {
  if (candles.length < period) return null;

  const slice = candles.slice(-period);

  return (
    slice.reduce((sum, c) => sum + c.close, 0) / period
  );
}

/* -----------------------------
   RSI
------------------------------ */

function calculateRSI(candles: Candle[], period = 14): number | null {
  if (candles.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = candles.length - period; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;

    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }

  if (losses === 0) return 100;

  const rs = gains / losses;

  return 100 - 100 / (1 + rs);
}

export function analyzeTeslaChart(
  candles: Candle[]
): AISignal {
  if (candles.length < 50) {

    return {
      signal: "HOLD",
      confidence: 40,
      trend: "Neutral",
      momentum: "Sideways",
      risk: "High",
      support: null,
      resistance: null,
      entry: null,
      stopLoss: null,
      takeProfit: null,
      explanation: "Not enough market data to generate a full signal.",
      reasons: ["Not enough market data"],
    };
  }

  const latest = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  const avgVolume =
    candles.reduce((sum, c) => sum + c.volume, 0) /
    candles.length;

  const ma20 = movingAverage(candles, 20);
  const ma50 = movingAverage(candles, 50);
  const rsi = calculateRSI(candles);

  const support = Math.min(
  ...candles.slice(-20).map(c => c.low)
);

const resistance = Math.max(
  ...candles.slice(-20).map(c => c.high)
);

  let score = 0;

  const reasons: string[] = [];

  /* -----------------------------
     Candle Direction
  ------------------------------ */

  if (latest.close > latest.open) {
    score += 15;
    reasons.push("Bullish candle");
  }

  if (latest.close < latest.open) {
    score -= 15;
    reasons.push("Bearish candle");
  }

  /* -----------------------------
     Volume
  ------------------------------ */

  if (latest.volume > avgVolume * 1.5) {
    score += 20;
    reasons.push("Volume spike");
  }

  /* -----------------------------
     Higher High
  ------------------------------ */

  if (latest.high > prev.high) {
    score += 10;
    reasons.push("Higher High");
  }

  /* -----------------------------
     Lower Low
  ------------------------------ */

  if (latest.low < prev.low) {
    score -= 10;
    reasons.push("Lower Low");
  }

  /* -----------------------------
     Moving Averages
  ------------------------------ */

  if (ma20 && latest.close > ma20) {
    score += 20;
    reasons.push("Above MA20");
  }

  if (ma20 && latest.close < ma20) {
    score -= 20;
    reasons.push("Below MA20");
  }

  if (ma50 && latest.close > ma50) {
    score += 25;
    reasons.push("Above MA50");
  }

  if (ma50 && latest.close < ma50) {
    score -= 25;
    reasons.push("Below MA50");
  }

  /* -----------------------------
     Trend Strength
  ------------------------------ */

  if (ma20 && ma50 && ma20 > ma50) {
    score += 15;
    reasons.push("Bullish Trend");
  }

  if (ma20 && ma50 && ma20 < ma50) {
    score -= 15;
    reasons.push("Bearish Trend");
  }

  /* -----------------------------
   RSI Analysis
------------------------------ */

if (rsi !== null) {

  if (rsi < 30) {
    score += 20;
    reasons.push("RSI Oversold");
  }

  else if (rsi > 70) {
    score -= 20;
    reasons.push("RSI Overbought");
  }

  else if (rsi > 50) {
    score += 8;
    reasons.push("RSI Bullish");
  }

  else {
    score -= 8;
    reasons.push("RSI Weak");
  }

}

  let signal: AISignal["signal"] = "HOLD";

if (score >= 35) signal = "BUY";
if (score <= -35) signal = "SELL";

/* -----------------------------
   Trade Levels
------------------------------ */

let entry: number | null = null;
let stopLoss: number | null = null;
let takeProfit: number | null = null;

if (signal === "BUY") {
  entry = latest.close;
  stopLoss = support ?? latest.close * 0.97;
  takeProfit = resistance ?? latest.close * 1.05;
}

if (signal === "SELL") {
  entry = latest.close;
  stopLoss = resistance ?? latest.close * 1.03;
  takeProfit = support ?? latest.close * 0.95;
}

/* -----------------------------
   Trend
------------------------------ */

const trend: AISignal["trend"] =
  ma20 && ma50
    ? ma20 > ma50
      ? "Bullish"
      : "Bearish"
    : "Neutral";

/* -----------------------------
   Momentum
------------------------------ */

const momentum: AISignal["momentum"] =
  latest.close > prev.close
    ? "Strengthening"
    : latest.close < prev.close
    ? "Weakening"
    : "Sideways";

/* -----------------------------
   Risk
------------------------------ */

let risk: AISignal["risk"] = "Medium";

if (Math.abs(score) >= 70) {
  risk = "Low";
} else if (Math.abs(score) <= 30) {
  risk = "High";
}

/* -----------------------------
   AI Explanation
------------------------------ */

let explanation = "";

if (signal === "BUY") {
  explanation =
    `Tesla remains in a ${trend.toLowerCase()} trend. ` +
    `Price is trading above key moving averages with ${momentum.toLowerCase()} momentum. ` +
    `Support sits near $${support.toFixed(2)} while resistance is around $${resistance.toFixed(2)}.`;
}
else if (signal === "SELL") {
  explanation =
    `Tesla is showing bearish pressure. ` +
    `Momentum is ${momentum.toLowerCase()} and price is struggling below key trend levels. ` +
    `Support sits near $${support.toFixed(2)} while resistance remains around $${resistance.toFixed(2)}.`;
}
else {
  explanation =
    `Tesla is currently consolidating. ` +
    `Momentum is ${momentum.toLowerCase()} with a ${trend.toLowerCase()} longer-term trend. ` +
    `Support remains near $${support.toFixed(2)} while resistance is around $${resistance.toFixed(2)}.`;
}


/* -----------------------------
   Return
------------------------------ */

return {
  signal,
  confidence: Math.min(Math.abs(score), 95),
  trend,
  momentum,
  risk,
  support,
  resistance,
  entry: null,
  stopLoss: null,
  takeProfit: null,
  explanation,
  reasons,
};
}