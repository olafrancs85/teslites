"use client";

import type { DecisionResult } from "@/lib/ai/decisionEngine";

interface Props {
  decision: DecisionResult;
  explanation: string;
}

export default function AIAnalysisPanel({
  decision,
  explanation,
}: Props) {
  const recommendationColor = {
    "STRONG BUY": "text-green-500",
    BUY: "text-green-400",
    HOLD: "text-yellow-400",
    SELL: "text-red-400",
    "STRONG SELL": "text-red-600",
  }[decision.recommendation];

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-lg">

      <h2 className="text-xl font-bold mb-6">
        🤖 AI Trade Recommendation
      </h2>

      <div className="grid grid-cols-2 gap-6">

        <div>
          <p className="text-zinc-400 text-sm">
            Recommendation
          </p>

          <p
            className={`text-3xl font-bold ${recommendationColor}`}
          >
            {decision.recommendation}
          </p>
        </div>

        <div>
          <p className="text-zinc-400 text-sm">
            Confidence
          </p>

          <p className="text-3xl font-bold">
            {decision.confidence}%
          </p>
        </div>

        <div>
          <p className="text-zinc-400 text-sm">
            AI Score
          </p>

          <p className="text-2xl font-semibold">
            {decision.totalScore}
          </p>
        </div>

      </div>

      <div className="mt-8">

        <h3 className="font-semibold mb-3">
          AI Reasoning
        </h3>

        <ul className="space-y-2">

          {decision.explanation.map((reason, index) => (
            <li
              key={index}
              className="flex gap-3 text-sm"
            >
              <span className="text-green-400">
                ✓
              </span>

              <span>{reason}</span>

            </li>
          ))}

        </ul>

      </div>

      {/* Institutional AI Narrative */}

      <div className="mt-8 border-t border-zinc-700 pt-6">

        <h3 className="font-semibold text-lg mb-4">
          🧠 AI Market Narrative
        </h3>

        <div className="rounded-xl bg-zinc-800/50 p-5 border border-zinc-700">

          <p className="text-zinc-300 whitespace-pre-line leading-8">
            {explanation}
          </p>

        </div>

      </div>

    </div>
  );
}