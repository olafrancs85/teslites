// /components/optimus/OptimusHub/domains.ts

// Tesla imports
import {
  TESLA_SIGNALS,
  TESLA_INSIGHTS,
  TESLA_EXPLAINABILITY,
  TESLA_SECOND_ORDER_EFFECTS,
  TESLA_SIGNAL_EVOLUTION,
} from "@/components/optimus/domains/tesla";

// SpaceX imports
import {
  STARSHIP_SIGNALS,
  STARSHIP_INSIGHTS,
  STARSHIP_EXPLAINABILITY,
  STARSHIP_SECOND_ORDER_EFFECTS,
  STARSHIP_SIGNAL_EVOLUTION,
  RAPTOR_PRODUCTION_SIGNALS,
  LAUNCH_INFRASTRUCTURE_SIGNALS,
  REGULATORY_CONSTRAINT_SIGNALS,
} from "@/components/optimus/domains/spacex";

import { Insight } from "@/components/optimus/OptimusInsightCard";

type Domain = {
  id: string;
  name: string;
  signals: any[];
  insights: Insight[];
  explainability?: any;
  secondOrder?: any[];
  signalEvolution?: any[];
};

// Map TeslaInsights and StarshipInsights to full Insight type
const mapToInsight = (i: any): Insight => ({
  title: i.title,
  action: i.action ?? "N/A",
  reason: i.reason ?? i.description ?? "No reason provided",
  summary: i.summary ?? i.description ?? "No summary",
  implications: i.implications ?? [],
  timeframe: i.timeframe ?? "N/A",
  trend: i.trend ?? "flat",
  trendScore: i.trendScore ?? 50,
  sentimentScore: i.sentimentScore ?? 50,
  volumeScore: i.volumeScore ?? 50,
  confidence: i.confidence ?? "medium",
  signalStrength: i.signalStrength ?? 50,
  updatedAt: i.updatedAt ?? new Date().toISOString(),
  explainability: i.explainability,
});

// All domains exported here
export const OptimusDomains: Domain[] = [
  {
    id: "tesla",
    name: "Tesla",
    signals: TESLA_SIGNALS,
    insights: TESLA_INSIGHTS.map(mapToInsight),
    explainability: TESLA_EXPLAINABILITY,
    secondOrder: TESLA_SECOND_ORDER_EFFECTS,
    signalEvolution: TESLA_SIGNAL_EVOLUTION,
  },
  {
    id: "spacex",
    name: "SpaceX Starship",
    signals: [
      ...STARSHIP_SIGNALS,
      ...RAPTOR_PRODUCTION_SIGNALS,
      ...LAUNCH_INFRASTRUCTURE_SIGNALS,
      ...REGULATORY_CONSTRAINT_SIGNALS,
    ],
    insights: STARSHIP_INSIGHTS.map(mapToInsight),
    explainability: STARSHIP_EXPLAINABILITY,
    secondOrder: STARSHIP_SECOND_ORDER_EFFECTS,
    signalEvolution: STARSHIP_SIGNAL_EVOLUTION,
  },
];
