// src/intelligence/domain/types.ts

// Core Sectors
export type Sector = "EV" | "AEROSPACE" | "AI";

// Regime states
export type RegimeState = "Expansion" | "Compression" | "Acceleration" | "Stress";

// Sector-level regime snapshot
export type SectorRegime = {
  sector: Sector;
  momentum: number;
  volatility: number;
  capitalFlow: number;
  innovationVelocity: number;
  fragility: number;
  regimeState: RegimeState;
  confidence: number; // 0–1
};

// Industrial engine types
export type SectorSnapshot = {
  sector: string;
  momentum: number;           // normalized 0–1
  volatility: number;         // 0–1
  capitalFlow: number;        // 0–1
  innovationVelocity: number; // 0–1
  fragility: number;          // 0–1
  regimeState: RegimeState;
  confidence: number;         // 0–1
};

export type IndustrialSnapshot = {
  sectors: SectorSnapshot[];
  averageMomentum: number;
  averageVolatility: number;
  averageCapitalFlow: number;
  industrialRegime: RegimeState;
  systemicFragility: number;
  confidence: number;
};

// Strategic narrative for insights
export type StrategicNarrative = {
  headline: string;
  summary: string;
  insights: string[];
};

// Full industrial intelligence
export type IndustrialIntelligence = {
  snapshot: IndustrialSnapshot;
  divergence: {
    divergence: boolean;
    divergenceScore: number;
    description: string;
  };
  narrative: StrategicNarrative;
};