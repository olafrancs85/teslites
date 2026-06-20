import { useMemo } from "react";
import type { Domain } from "./types";

export type MacroSignalResult = {
  aggregateSignal: number | null;
  previousAggregate: number | null;
  delta: number | null;
  volatility: number | null;
  anomaly: boolean;
  regime: "stable" | "turbulent" | "accelerating" | null;
  regimePrediction?: "upshift" | "downshift" | null;
  regimeConfidence?: number; // 0–1
};

export function useMacroSignal(
  domains: Domain[],
  computeSignalStrengthFromNarrative: (narrative: string) => number
): MacroSignalResult {
  return useMemo(() => {
    const allCurrent = domains.flatMap((d) => d.signalEvolution ?? []);

    if (allCurrent.length === 0) {
      return {
        aggregateSignal: null,
        previousAggregate: null,
        delta: null,
        volatility: null,
        anomaly: false,
        regime: null,
      };
    }

    // -----------------------------
    // Weighted Signal Strength
    // -----------------------------
    const weighted = allCurrent.map((p) => {
      const strength =
        computeSignalStrengthFromNarrative(p.narrativeTemplate);

      const weight =
        p.confidence === "high"
          ? 1.2
          : p.confidence === "medium"
          ? 1
          : 0.8;

      return { strength, weight };
    });

    const weightedAvg =
      weighted.reduce((sum, p) => sum + p.strength * p.weight, 0) /
      weighted.reduce((sum, p) => sum + p.weight, 0);

    // -----------------------------
    // Previous Average
    // -----------------------------
    const allPrevious = domains.flatMap((d) =>
      (d.signalEvolution ?? []).slice(0, -1)
    );

    const previousAvg =
      allPrevious.length > 0
        ? allPrevious.reduce(
            (sum, p) =>
              sum + computeSignalStrengthFromNarrative(p.narrativeTemplate),
            0
          ) / allPrevious.length
        : weightedAvg;

    // -----------------------------
    // Volatility (Std Deviation)
    // -----------------------------
    const mean = weightedAvg;
    const variance =
      weighted.reduce(
        (sum, p) => sum + Math.pow(p.strength - mean, 2),
        0
      ) / weighted.length;

    const volatilityScore = Math.sqrt(variance);

    // -----------------------------
    // Rounded Values
    // -----------------------------
    const roundedCurrent = Math.round(weightedAvg);
    const roundedPrevious = Math.round(previousAvg);
    const deltaValue = roundedCurrent - roundedPrevious;
    const volatilityRounded = Math.round(volatilityScore);

    // -----------------------------
    // Anomaly Detection
    // -----------------------------
    const anomaly =
      Math.abs(deltaValue) >= 10 || volatilityRounded >= 15;

    // -----------------------------
    // Advanced Regime Classification
    // -----------------------------
    let regime: "stable" | "turbulent" | "accelerating" | null = null;
    let stableScore = 0;
    let turbulentScore = 0;
    let acceleratingScore = 0;

    // Volatility influence
    if (volatilityRounded < 8) stableScore += 2;
    if (volatilityRounded >= 12) turbulentScore += 2;

    // Momentum influence
    if (Math.abs(deltaValue) >= 8) acceleratingScore += 2;
    if (Math.abs(deltaValue) >= 12) turbulentScore += 1;

    // Combined stress condition
    if (volatilityRounded >= 15 && Math.abs(deltaValue) >= 10) {
      turbulentScore += 2;
    }

    // Decide dominant regime
    const maxScore = Math.max(stableScore, turbulentScore, acceleratingScore);

    if (maxScore === 0) {
      regime = null;
    } else if (maxScore === stableScore) {
      regime = "stable";
    } else if (maxScore === turbulentScore) {
      regime = "turbulent";
    } else {
      regime = "accelerating";
    }

    // -----------------------------
    // Regime Confidence
    // -----------------------------
    const totalScore = stableScore + turbulentScore + acceleratingScore;
    let regimeConfidence = 0;
    if (totalScore > 0) {
      if (regime === "stable") regimeConfidence = stableScore / totalScore;
      else if (regime === "turbulent") regimeConfidence = turbulentScore / totalScore;
      else if (regime === "accelerating") regimeConfidence = acceleratingScore / totalScore;
    }

    // -----------------------------
    // Forward Regime Prediction
    // -----------------------------
    let regimePrediction: "upshift" | "downshift" | null = null;
    if (regime === "stable" && deltaValue > 0 && volatilityRounded > 6)
      regimePrediction = "upshift"; // likely to accelerate
    else if ((regime === "accelerating" || regime === "turbulent") && deltaValue < 0 && volatilityRounded > 6)
      regimePrediction = "downshift"; // likely to decelerate

    return {
      aggregateSignal: roundedCurrent,
      previousAggregate: roundedPrevious,
      delta: deltaValue,
      volatility: volatilityRounded,
      anomaly,
      regime,
      regimeConfidence,
      regimePrediction,
    };
  }, [domains, computeSignalStrengthFromNarrative]);
}