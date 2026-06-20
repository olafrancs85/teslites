"use client";

import { useEffect, useMemo, useState } from "react";

interface Props {
  latestClose: number;
  previousClose: number;
  hasEarnings: boolean;
  headline?: string;
}

type AISummary = {
  summary: string;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  confidence: "Low" | "Medium" | "High";
};

export default function TeslaAISummary({
  latestClose,
  previousClose,
  hasEarnings,
  headline,
}: Props) {
  const percentMove = useMemo(() => {
    if (!previousClose) return 0;
    return ((latestClose - previousClose) / previousClose) * 100;
  }, [latestClose, previousClose]);

  const earningsVerdict: "beat" | "miss" | "inline" = useMemo(() => {
    if (!hasEarnings) return "inline";
    if (percentMove >= 2) return "beat";
    if (percentMove <= -2) return "miss";
    return "inline";
  }, [hasEarnings, percentMove]);

  const [ai, setAi] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch(
          `/api/teslite-ai/analysis/stock-summary?percentMove=${percentMove}&earningsVerdict=${earningsVerdict}${
            headline ? `&headline=${encodeURIComponent(headline)}` : ""
          }`,
          { cache: "no-store" }
        );

        if (!res.ok) return;

        const data = await res.json();
        if (!cancelled) setAi(data);
      } catch {
        // Silent fail — AI must never break UI
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [percentMove, earningsVerdict, headline]);

  return (
    <div className="mb-6 rounded-lg border border-gray-800 bg-black p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-200">
          Tesla AI Market Summary
        </span>

        {ai && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              ai.sentiment === "Bullish"
                ? "bg-green-500/10 text-green-400 border border-green-500/30"
                : ai.sentiment === "Bearish"
                ? "bg-red-500/10 text-red-400 border border-red-500/30"
                : "bg-gray-500/10 text-gray-300 border border-gray-500/30"
            }`}
          >
            {ai.sentiment}
          </span>
        )}
      </div>

      {loading && (
        <p className="text-sm text-gray-400">
          Analyzing Tesla market signals…
        </p>
      )}

      {!loading && ai && (
        <>
          <p className="text-sm text-gray-200 mb-2">{ai.summary}</p>
          <p className="text-xs text-gray-400">
            AI confidence: <strong>{ai.confidence}</strong>
          </p>
        </>
      )}

      {!loading && !ai && (
        <p className="text-sm text-gray-400">
          AI summary unavailable at this time.
        </p>
      )}
    </div>
  );
}
