"use client";

import { useEffect, useState } from "react";

interface ConfidencePoint {
  score: number;
  timestamp: number;
}

const STORAGE_KEY = "teslites_confidence_trend";

export function useConfidenceTrend(confidenceScore?: number) {
  const [trend, setTrend] = useState<ConfidencePoint[]>([]);

  useEffect(() => {
    if (confidenceScore === undefined) return;

    const raw = localStorage.getItem(STORAGE_KEY);
    const history: ConfidencePoint[] = raw ? JSON.parse(raw) : [];

    const updated = [
      ...history,
      { score: confidenceScore, timestamp: Date.now() },
    ]
      // keep last 24 hours
      .filter(p => Date.now() - p.timestamp < 24 * 60 * 60 * 1000);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTrend(updated);
  }, [confidenceScore]);

  return trend;
}
