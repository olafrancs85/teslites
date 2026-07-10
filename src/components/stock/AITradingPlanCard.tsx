"use client";

interface Props {
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  trend: "Bullish" | "Bearish" | "Neutral";
  momentum: "Strengthening" | "Weakening" | "Sideways";
  risk: "Low" | "Medium" | "High";
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  explanation: string;
}

export default function AITradingPlanCard({
  signal,
  confidence,
  trend,
  momentum,
  risk,
  entry,
  stopLoss,
  takeProfit,
  explanation,
}: Props) {
  const signalColor =
    signal === "BUY"
      ? "bg-green-600"
      : signal === "SELL"
      ? "bg-red-600"
      : "bg-yellow-600";

  return (
    <div className="mt-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">
          🎯 AI Trading Plan
        </h2>

        <span
          className={`px-3 py-1 rounded-full text-white text-sm ${signalColor}`}
        >
          {signal}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm">

        <div>
          <p className="text-gray-400">Confidence</p>
          <p className="text-white font-semibold">
            {confidence}%
          </p>
        </div>

        <div>
          <p className="text-gray-400">Trend</p>
          <p className="text-white font-semibold">
            {trend}
          </p>
        </div>

        <div>
          <p className="text-gray-400">Momentum</p>
          <p className="text-white font-semibold">
            {momentum}
          </p>
        </div>

        <div>
          <p className="text-gray-400">Risk</p>
          <p className="text-white font-semibold">
            {risk}
          </p>
        </div>

        <div>
          <p className="text-gray-400">Entry</p>
          <p className="text-white font-semibold">
            {entry !== null ? `$${entry.toFixed(2)}` : "N/A"}
          </p>
        </div>

        <div>
          <p className="text-gray-400">Stop Loss</p>
          <p className="text-white font-semibold">
            {stopLoss !== null ? `$${stopLoss.toFixed(2)}` : "N/A"}
          </p>
        </div>

        <div>
          <p className="text-gray-400">Take Profit</p>
          <p className="text-white font-semibold">
            {takeProfit !== null ? `$${takeProfit.toFixed(2)}` : "N/A"}
          </p>
        </div>

      </div>

      <div className="mt-6 border-t border-gray-700 pt-5">
        <h3 className="font-semibold text-white mb-2">
          AI Commentary
        </h3>

        <p className="text-gray-300 leading-relaxed">
          {explanation}
        </p>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        Educational purposes only. This is not financial advice.
      </div>
    </div>
  );
}