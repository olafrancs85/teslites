import type { Domain } from "@/components/intelligence/core/types";

// Example Tesla intelligence domains
export const TeslaDomains: Domain[] = [
  {
    id: "ev-innovation",
    name: "EV Innovation",
    signalEvolution: [
      { narrativeTemplate: "Tesla is accelerating battery production", confidence: "high", date: "2026-02-20" },
      { narrativeTemplate: "Scaling new gigafactories", confidence: "medium", date: "2026-02-21" },
    ],
  },
  {
    id: "autopilot",
    name: "Autopilot & AI",
    signalEvolution: [
      { narrativeTemplate: "Autopilot adoption increasing rapidly", confidence: "high", date: "2026-02-19" },
      { narrativeTemplate: "AI safety constraints noted", confidence: "medium", date: "2026-02-21" },
    ],
  },
  {
    id: "financials",
    name: "Financial Performance",
    signalEvolution: [
      { narrativeTemplate: "Revenue scaling up Q4", confidence: "medium", date: "2026-02-20" },
      { narrativeTemplate: "Risk of supply chain constraints", confidence: "low", date: "2026-02-21" },
    ],
  },
];