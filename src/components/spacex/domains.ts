import type { SignalEvolutionProfile } from "@/components/intelligence/core/types";

export const SpaceXDomains = [
  {
    id: "launch-economics",
    name: "Launch Economics",
    signalEvolution: [
      {
        narrativeTemplate:
          "Reusable launch systems accelerating global cost collapse",
        confidence: "high",
        date: "2026-02-18",
      },
    ] as SignalEvolutionProfile[],
  },
  {
    id: "starship-industrialization",
    name: "Starship Industrialization",
    signalEvolution: [
      {
        narrativeTemplate:
          "Starship scaling toward high-frequency orbital dominance",
        confidence: "medium",
        date: "2026-02-18",
      },
    ] as SignalEvolutionProfile[],
  },
];
