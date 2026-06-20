// types/optimus/OptimusSignalEvolution.ts

export type SignalEvolutionPoint = {
  date: string;
  signalStrength: number;
  confidence: "low" | "medium" | "high";
  reason: string;
};

export type SignalEvolution = {
  title: string;
  history: SignalEvolutionPoint[];
};

// --- your actual data ---
export const optimusEvolution: SignalEvolution = {
  title: "Humanoid labor substitution accelerating",
  history: [
    {
      date: "2025-09-01",
      signalStrength: 58,
      confidence: "medium",
      reason: "Prototype capability validated but costs unclear",
    },
    {
      date: "2025-11-15",
      signalStrength: 71,
      confidence: "high",
      reason: "Manufacturing iteration velocity increased",
    },
    {
      date: "2026-02-10",
      signalStrength: 82,
      confidence: "high",
      reason: "Actuator cost curve inflecting downward",
    },
  ],
};
