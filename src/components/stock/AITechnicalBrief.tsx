"use client";

interface Props {
  trend: "Bullish" | "Bearish" | "Neutral";
  rsi: number | null;
  ma20: number | null;
  ma50: number | null;
  support: number | null;
  resistance: number | null;
  confidence: number;
}

export default function AITechnicalBrief({
  trend,
  rsi,
  ma20,
  ma50,
  support,
  resistance,
  confidence,
}: Props) {
  const rsiMessage =
    rsi === null
      ? "RSI unavailable."
      : rsi >= 70
      ? "RSI indicates overbought conditions."
      : rsi <= 30
      ? "RSI indicates oversold conditions."
      : "RSI remains in a neutral zone.";

  const maMessage =
    ma20 !== null &&
    ma50 !== null &&
    ma20 > ma50
      ? "Short-term trend remains above the long-term trend."
      : "Short-term trend remains below the long-term trend.";

  const supportMessage =
    support !== null && resistance !== null
      ? `Support near $${support.toFixed(
          2
        )}. Resistance near $${resistance.toFixed(2)}.`
      : "Support and resistance unavailable.";

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          🤖 Tesla AI Technical Brief
        </h2>

        <span className="text-sm px-3 py-1 rounded-full bg-blue-600 text-white">
          {confidence}% Confidence
        </span>
      </div>

      <div className="space-y-3 text-gray-300 leading-relaxed">

        <p>
          <strong>Trend:</strong>{" "}
          <span
            className={
              trend === "Bullish"
                ? "text-green-400"
                : trend === "Bearish"
                ? "text-red-400"
                : "text-yellow-400"
            }
          >
            {trend}
          </span>
        </p>

        <p>{maMessage}</p>

        <p>{rsiMessage}</p>

        <p>{supportMessage}</p>

        <div className="mt-5 border-t border-gray-700 pt-4 text-sm text-gray-400">
          AI evaluates technical momentum using moving averages, RSI,
          trend strength and nearby support/resistance zones. This
          analysis is informational and not financial advice.
        </div>

      </div>
    </div>
  );
}