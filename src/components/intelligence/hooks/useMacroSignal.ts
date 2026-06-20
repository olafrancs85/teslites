"use client";

import { useMemo } from "react";
import type { Domain } from "../core/types";
import type { MacroSignal } from "@/components/intelligence/types/macro";

export function useMacroSignal(
  domains: Domain[],
  computeSignalStrengthFromNarrative: (narrative: string) => number
): MacroSignal {
  return useMemo<MacroSignal>(() => {
    const allCurrent = domains.flatMap((d) => d.signalEvolution ?? []);

    if (allCurrent.length === 0) {
      return {
        id: "macro-signal",            // temporary unique ID
        scope: "macro",                // current scope
        timestamp: Date.now(),         // required timestamp

        regime: null,
        confidence: 0,
        anomaly: false,
        anomalyScore: 0,
        drivers: {},
        narrative: "",
      };
    }

    // Weighted Signal Strength
    const weighted = allCurrent.map((p) => {
      const strength = computeSignalStrengthFromNarrative(p.narrativeTemplate);
      const weight =
        p.confidence === "high" ? 1.2 : p.confidence === "medium" ? 1 : 0.8;
      return { strength, weight, narrative: p.narrativeTemplate };
    });

    const weightedAvg =
      weighted.reduce((sum, p) => sum + p.strength * p.weight, 0) /
      weighted.reduce((sum, p) => sum + p.weight, 0);

    // Previous Average
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

    // Volatility
    const mean = weightedAvg;
    const variance =
      weighted.reduce((sum, p) => sum + Math.pow(p.strength - mean, 2), 0) /
      weighted.length;
    const volatilityScore = Math.sqrt(variance);

    // Rounded values
    const roundedCurrent = Math.round(weightedAvg);
    const roundedPrevious = Math.round(previousAvg);
    const deltaValue = roundedCurrent - roundedPrevious;
    const volatilityRounded = Math.round(volatilityScore);

    // Anomaly
    const anomaly: boolean =
      Math.abs(deltaValue) >= 10 || volatilityRounded >= 15;
    const anomalyScore = Math.max(Math.abs(deltaValue), volatilityRounded);

    // Regime classification
    let regime: MacroSignal["regime"] = null;
    let stableScore = 0;
    let turbulentScore = 0;
    let acceleratingScore = 0;

    if (volatilityRounded < 8) stableScore += 2;
    if (volatilityRounded >= 12) turbulentScore += 2;
    if (Math.abs(deltaValue) >= 8) acceleratingScore += 2;
    if (Math.abs(deltaValue) >= 12) turbulentScore += 1;
    if (volatilityRounded >= 15 && Math.abs(deltaValue) >= 10) turbulentScore += 2;

    const maxScore = Math.max(stableScore, turbulentScore, acceleratingScore);
    if (maxScore === stableScore) regime = "stable";
    else if (maxScore === turbulentScore) regime = "turbulent";
    else if (maxScore === acceleratingScore) regime = "accelerating";

    // Confidence
    const totalScore = stableScore + turbulentScore + acceleratingScore;
    const confidence =
      totalScore > 0
        ? regime === "stable"
          ? stableScore / totalScore
          : regime === "turbulent"
          ? turbulentScore / totalScore
          : acceleratingScore / totalScore
        : 0;

    // Drivers placeholder
    const drivers = {
      inflation: Math.round(weightedAvg * 0.1),
      rates: Math.round(weightedAvg * 0.05),
      liquidity: Math.round(weightedAvg * 0.08),
      riskSpread: Math.round(weightedAvg * 0.07),
    };

    // Narrative: most extreme
    const extremeNarrative =
      weighted.reduce((prev, curr) =>
        Math.abs(curr.strength - mean) > Math.abs(prev.strength - mean)
          ? curr
          : prev
      ).narrative ?? "";

    // Return object with all required fields
    return {
      id: "macro-signal",           // temporary unique ID
      scope: "macro",               // current scope
      timestamp: Date.now(),        // current timestamp

      regime,
      confidence,
      anomaly,
      anomalyScore,
      drivers,
      narrative: extremeNarrative,
    };
  }, [domains, computeSignalStrengthFromNarrative]);
}