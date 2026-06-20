export function getConfidenceLabel(score: number) {
  if (score >= 75) return "Strong Setup";
  if (score >= 55) return "Moderate Setup";
  if (score >= 40) return "Weak Setup";
  return "High Risk";
}
