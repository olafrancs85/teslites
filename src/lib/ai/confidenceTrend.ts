const STORAGE_KEY = "tesla_confidence_trend";
const MAX_POINTS = 5;

export function updateConfidenceTrend(score: number): number[] {
  if (typeof window === "undefined") return [];

  const existing = localStorage.getItem(STORAGE_KEY);
  const parsed: number[] = existing ? JSON.parse(existing) : [];

  const updated = [...parsed, score].slice(-MAX_POINTS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function getTrendDirection(scores: number[]) {
  if (scores.length < 2) return "Stable";

  const first = scores[0];
  const last = scores[scores.length - 1];
  const diff = last - first;

  if (diff > 3) return "Improving";
  if (diff < -3) return "Weakening";
  return "Stable";
}
