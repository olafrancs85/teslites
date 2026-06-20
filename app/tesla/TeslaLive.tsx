"use client";

import { useEffect, useMemo, useState } from "react";
import TeslaLivePanel from "@/app/Components/TeslaLivePanel";
import ConfidenceTrend from "@/app/Components/stock/ConfidenceTrend";
import { useTeslaLiveIntelligence } from "@/hooks/useTeslaLiveIntelligence";

export default function TeslaLive() {
  const { confidence, isBreaking, loading, lastUpdated, marketMoving } =
    useTeslaLiveIntelligence();

  const [scores, setScores] = useState<number[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("teslaConfidenceTrend");
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
      confidence === "High" ? 80 :
      confidence === "Medium" ? 55 :
      30;

    setScores(prev => {
      const last = prev[prev.length - 1];
      if (last === score) return prev;

      const next = [...prev, score].slice(-12);
      localStorage.setItem("teslaConfidenceTrend", JSON.stringify(next));
      return next;
    });
  }, [confidence, loading]);

  const direction = useMemo<"Stable" | "Improving" | "Weakening">(() => {
    if (scores.length < 2) return "Stable";

    const prev = scores[scores.length - 2];
    const curr = scores[scores.length - 1];

    if (curr > prev) return "Improving";
    if (curr < prev) return "Weakening";
    return "Stable";
  }, [scores]);

  return (
    <div className="space-y-4">
      <TeslaLivePanel />

      {scores.length > 0 && (
        <ConfidenceTrend scores={scores} direction={direction} />
      )}

      {/* ---- Market-Moving Tesla News ---- */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">
          Market-Moving Tesla News
        </h3>

        <div className="space-y-2">
          {marketMoving?.length === 0 && (
            <p className="text-xs text-gray-400">
              No major Tesla market events detected.
            </p>
          )}

          {marketMoving?.map((n, i) => (
            <a
              key={i}
              href={n.link}
              target="_blank"
              className="block text-sm text-blue-400 hover:underline"
            >
              {n.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
