// src/intelligence/core/IndustrialRegimeEngine.ts

import type { SectorRegime } from "@/intelligence/domain/types";

/**
 * Temporary mock industrial regimes.
 * Later this will be replaced with a real engine that
 * computes regimes from sector signals.
 */
export function getIndustrialRegimes(): SectorRegime[] {
  return [
    {
      sector: "EV",
      momentum: 0.65,
      volatility: 0.3,
      capitalFlow: 0.55,
      innovationVelocity: 0.7,
      fragility: 0.2,
      regimeState: "Expansion",
      confidence: 0.85,
    },
    {
      sector: "AEROSPACE",
      momentum: 0.45,
      volatility: 0.5,
      capitalFlow: 0.6,
      innovationVelocity: 0.5,
      fragility: 0.25,
      regimeState: "Acceleration",
      confidence: 0.75,
    },
    {
      sector: "AI",
      momentum: 0.55,
      volatility: 0.4,
      capitalFlow: 0.65,
      innovationVelocity: 0.8,
      fragility: 0.15,
      regimeState: "Compression",
      confidence: 0.8,
    },
  ];
}