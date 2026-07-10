"use client";

import { useEffect, useMemo, useState } from "react";
import { useTeslaLiveIntelligence } from "../hooks/useTeslaLiveIntelligence";

interface ConfidencePoint {
  time: string;
  score: number;
}

function confidenceToScore(level: "Low" | "Medium" | "High"): number {
  switch (level) {
    case "High":
      return 80;
    case "Medium":
      return 55;
    case "Low":
    default:
      return 30;
  }
}

export default function ConfidenceTrend() {
  const { confidence, loading } = useTeslaLiveIntelligence();
  const [trend, setTrend] = useState<ConfidencePoint[]>([]);

  useEffect(() => {
    if (loading) return;

    const score = confidenceToScore(confidence);

    setTrend(prev => {
      const last = prev[prev.length - 1];

      // Prevent duplicates
      if (last && last.score === score) return prev;

      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      return [...prev, { time, score }].slice(-12); // keep last 12 points
    });
  }, [confidence, loading]);

  // Compute trend direction
  const direction = useMemo(() => {
    if (trend.length < 2) return "Stable"; // <- preserve original wording
    const prev = trend[trend.length - 2].score;
    const current = trend[trend.length - 1].score;

    if (current > prev) return "Up";
    if (current < prev) return "Down";
    return "Stable"; // <- preserve original wording
  }, [trend]);

  const directionColor = useMemo(() => {
    return direction === "Up"
      ? "text-green-400"
      : direction === "Down"
      ? "text-red-400"
      : "text-yellow-400";
  }, [direction]);

  // Sparkline path (always called, never conditional)
  const sparklinePath = useMemo(() => {
    const maxScore = 100;
    const width = 100;
    const height = 24;

    if (trend.length < 2) return "";

    const stepX = width / (trend.length - 1);

    return trend
      .map((point, idx) => {
        const x = idx * stepX;
        const y = height - (point.score / maxScore) * height;
        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [trend]);

  if (!trend.length) return null;

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 relative">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80">
          Confidence Trend
        </h3>
        <span className={`text-xs font-medium ${directionColor}`}>
          {direction} {/* <- Stable preserved */}
        </span>
      </div>

      <div className="relative flex h-24 items-end gap-2">
        {/* Sparkline SVG overlay */}
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 24"
          preserveAspectRatio="none"
        >
          <path
            d={sparklinePath}
            fill="none"
            stroke="cyan"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>

        {trend.map((point, idx) => (
          <div key={idx} className="flex flex-1 flex-col items-center">
            <div
              className={`w-full rounded transition-all ${
                point.score >= 70
                  ? "bg-green-500/80"
                  : point.score >= 45
                  ? "bg-yellow-400/80"
                  : "bg-red-500/80"
              }`}
              style={{ height: `${point.score}%` }}
            />
            <span className="mt-1 text-[10px] text-white/40">{point.time}</span>
          </div>
        ))}
      </div>

      <p className="mt-2 text-xs text-white/50">
        Live Tesla confidence momentum over time
      </p>
    </div>
  );
}
