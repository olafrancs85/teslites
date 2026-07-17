"use client";

import { useEffect, useMemo, useState } from "react";
import TeslaLivePanel from "../Components/TeslaLivePanel";
import ConfidenceTrend from "../Components/stock/ConfidenceTrend";
import { useTeslaLiveIntelligence } from "@/hooks/useTeslaLiveIntelligence";

type TeslaLiveProps = {
  candles?: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];

  latest?: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
};

export default function TeslaLive({
  candles = [],
  latest,
}: TeslaLiveProps) {
  const {
    confidence,
    isBreaking,
    loading,
    lastUpdated,
    marketMoving,
    summary,
    marketNews,
  } = useTeslaLiveIntelligence();

  const [scores, setScores] = useState<number[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(
      "teslaConfidenceTrend"
    );

    if (stored) {
      try {
        setScores(JSON.parse(stored));
      } catch {
        setScores([]);
      }
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    const score =
      confidence === "High"
        ? 80
        : confidence === "Medium"
        ? 55
        : 30;

    setScores((previous) => {
      const last = previous[previous.length - 1];

      if (last === score) return previous;

      const next = [...previous, score].slice(-12);

      localStorage.setItem(
        "teslaConfidenceTrend",
        JSON.stringify(next)
      );

      return next;
    });
  }, [confidence, loading]);

  const direction = useMemo<
    "Stable" | "Improving" | "Weakening"
  >(() => {
    if (scores.length < 2) return "Stable";

    const previous = scores[scores.length - 2];
    const current = scores[scores.length - 1];

    if (current > previous) return "Improving";
    if (current < previous) return "Weakening";

    return "Stable";
  }, [scores]);

  return (
    <div className="space-y-4">
      <TeslaLivePanel
        candles={candles}
        latest={latest}
        summary={summary}
        confidence={confidence}
        isBreaking={isBreaking}
        loading={loading}
        lastUpdated={lastUpdated}
        marketNews={marketNews}
        marketMoving={marketMoving}
      />

      {scores.length > 0 && (
        <ConfidenceTrend
          scores={scores}
          direction={direction}
        />
      )}

      {/* MARKET-MOVING TESLA NEWS */}

      <div className="bg-black/40 border border-white/10 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">
          Market-Moving Tesla News
        </h3>

        <div className="space-y-2">
          {marketMoving.length === 0 && (
            <p className="text-xs text-gray-400">
              No major Tesla market events detected.
            </p>
          )}

          {marketMoving.map((news, index) => (
            <a
              key={index}
              href={news.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-400 hover:underline"
            >
              {news.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}