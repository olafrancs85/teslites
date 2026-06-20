// /src/intelligence/core/MacroSignalTypes.ts

export type MacroRegime =
  | "Expansion"
  | "Contraction"
  | "Liquidity Tightening"
  | "Liquidity Expansion"
  | "Risk-Off"
  | "Risk-On"
  | "stable"
  | "turbulent"
  | "accelerating";

export type MacroSignal = {
  id: string;                      // unique signal id
  scope: "tesla" | "macro" | "spacex";
  timestamp: number;               // Date.now()

  regime: MacroRegime | null;
  confidence: number;              // 0–1

  anomaly: boolean;
  anomalyScore: number;

  drivers: {
    inflation?: number;
    rates?: number;
    liquidity?: number;
    riskSpread?: number;
  };

  narrative: string;
};