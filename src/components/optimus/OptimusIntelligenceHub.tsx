"use client";

import { useEffect, useState, useMemo } from "react";
import OptimusTrajectorySection from "./OptimusTrajectorySection";
import OptimusValuationLink from "./OptimusValuationLink";
import OptimusSecondOrderPanel, { type SecondOrderEffect } from "./OptimusSecondOrderPanel";
import { OptimusInsightCard, type Insight, calculateSignalStrength } from "./OptimusInsightCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignalExplainability } from "@/types/optimus/OptimusSignalExplainability";
import OptimusSignalEvolutionPanel from "./OptimusSignalEvolutionPanel";
import { OptimusDomains } from "./OptimusHub/domains";

/* ---------------------------------
   TYPES
--------------------------------- */
type SignalEvolutionPoint = {
  date: string;
  signalStrength: number;
  confidence: "low" | "medium" | "high";
  reason: string;
};

/* ---------------------------------
   OPTIMUS CORE SIGNAL
--------------------------------- */
const optimusCoreSignal: Insight & { explainability: SignalExplainability } = {
  title: "Humanoid labor substitution accelerating",
  action: "Accelerate factory-first humanoid deployment",
  reason: "Rapid iteration and cost decline indicate near-term viability",
  summary: "Optimus is transitioning from prototype to economically disruptive labor platform.",
  implications: ["Factory labor cost compression", "Logistics automation acceleration", "Regulatory and labor policy pressure"],
  timeframe: "12–36 months",
  trend: "up",
  updatedAt: new Date().toISOString(),
  trendScore: 85,
  sentimentScore: 72,
  volumeScore: 68,
  explainability: {
    summary: "Signal strength is driven primarily by rapid manufacturing iteration and declining actuator cost curves.",
    dominantFactor: "Manufacturing iteration velocity",
    factors: [
      { name: "Manufacturing iteration velocity", weight: 0.35, direction: "positive", evidence: "Tesla reduced prototype-to-line iteration cycles from quarters to weeks." },
      { name: "Actuator cost decline", weight: 0.25, direction: "positive", evidence: "In-house motor and gearbox integration reduced per-unit cost." },
      { name: "Regulatory uncertainty", weight: 0.15, direction: "negative", evidence: "No standardized humanoid workplace safety framework yet exists." },
    ],
  },
};

/* ---------------------------------
   FALLBACK INSIGHTS
--------------------------------- */
const fallbackInsights: Insight[] = [
  {
    title: "Optimus Manufacturing Bottleneck",
    confidence: "medium",
    action: "Monitor battery assembly scaling",
    reason: "Battery throughput may slow early scaling.",
    summary: "Manufacturing constraints could delay rollout.",
    implications: ["Deployment delays", "Cost pressure"],
    timeframe: "12–18 months",
    trend: "up",
    updatedAt: new Date().toISOString(),
    trendScore: 60,
    sentimentScore: 55,
    volumeScore: 50,
  },
  {
    title: "Second-Order Labor Impact",
    confidence: "high",
    action: "Prepare labor transition strategies",
    reason: "Warehouse labor displacement may occur faster than forecast.",
    summary: "Optimus adoption may reshape logistics employment.",
    implications: ["Efficiency gains", "Regulatory scrutiny", "Reskilling urgency"],
    timeframe: "24–36 months",
    trend: "up",
    updatedAt: new Date().toISOString(),
    trendScore: 80,
    sentimentScore: 75,
    volumeScore: 70,
  },
  optimusCoreSignal,
];

/* ---------------------------------
   SKELETON CARD
--------------------------------- */
function InsightSkeleton() {
  return (
    <Card className="animate-pulse rounded-2xl shadow-md">
      <CardContent className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="flex justify-end">
          <Badge variant="outline">Loading</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------------------------
   CONFIDENCE SCORING
--------------------------------- */
function deriveConfidence(insight: Insight): "low" | "medium" | "high" {
  if (insight.signalStrength !== undefined) {
    if (insight.signalStrength >= 75) return "high";
    if (insight.signalStrength >= 45) return "medium";
    return "low";
  }
  switch (insight.trend) {
    case "up": return "high";
    case "flat": return "medium";
    case "down": return "low";
    default: return insight.confidence || "medium";
  }
}

/* ---------------------------------
   SIGNAL STRENGTH FROM NARRATIVE
--------------------------------- */
function computeSignalStrengthFromNarrative(narrative: string): number {
  if (narrative.toLowerCase().includes("accelerat")) return 75;
  if (narrative.toLowerCase().includes("scaling")) return 70;
  if (narrative.toLowerCase().includes("constraint")) return 45;
  if (narrative.toLowerCase().includes("risk")) return 40;
  return 55;
}

/* ---------------------------------
   MAP DOMAIN EVOLUTION → UI POINTS
--------------------------------- */
function mapSignalEvolution(
  profiles?: { narrativeTemplate: string; confidence?: "low" | "medium" | "high"; date?: string }[]
): SignalEvolutionPoint[] {
  if (!profiles) return [];
  return profiles.map((p) => {
    const strength = computeSignalStrengthFromNarrative(p.narrativeTemplate);
    return {
      date: p.date ?? new Date().toISOString(),
      signalStrength: strength,
      confidence: p.confidence ?? (strength >= 70 ? "high" : strength >= 50 ? "medium" : "low"),
      reason: p.narrativeTemplate,
    };
  });
}

/* ---------------------------------
   DYNAMIC SECOND-ORDER EFFECTS
--------------------------------- */
function deriveSecondOrderEffects(insights: Insight[]): SecondOrderEffect[] {
  return insights.flatMap((insight) => {
    if (!insight.implications) return [];
    return [{ originatingInsightId: insight.title, title: insight.title, description: insight.implications.join("; ") }];
  });
}

/* ---------------------------------
   BADGE VARIANT MAPPING (TS SAFE)
--------------------------------- */
const getBadgeVariant = (
  signal: number | null
): "link" | "secondary" | "destructive" | "default" | "outline" | "ghost" | null => {
  if (signal === null) return "secondary";
  if (signal >= 75) return "destructive";
  if (signal >= 50) return "secondary";
  return "outline";
};

/* ---------------------------------
   COMPONENT
--------------------------------- */
export default function OptimusIntelligenceHub() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInsights = async () => {
    try {
      const res = await fetch("/api/teslite-ai/insights");
      if (!res.ok) throw new Error("AI unavailable");
      const data: Insight[] = await res.json();
      const scored = data.map((insight) => {
        const signalStrength = insight.signalStrength ?? calculateSignalStrength({
          trendScore: insight.trendScore,
          sentimentScore: insight.sentimentScore,
          volumeScore: insight.volumeScore,
        });
        return { ...insight, signalStrength, confidence: deriveConfidence({ ...insight, signalStrength }), updatedAt: new Date().toISOString() };
      });
      setInsights(scored);
    } catch {
      setInsights(fallbackInsights);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
    const interval = setInterval(loadInsights, 30_000);
    return () => clearInterval(interval);
  }, []);

  const displayInsights = useMemo(() => {
    const source = insights.length ? insights : fallbackInsights;
    return source.map((insight) => {
      const signalStrength = insight.signalStrength ?? calculateSignalStrength({
        trendScore: insight.trendScore,
        sentimentScore: insight.sentimentScore,
        volumeScore: insight.volumeScore,
      });
      return { ...insight, signalStrength, confidence: deriveConfidence({ ...insight, signalStrength }), updatedAt: insight.updatedAt || new Date().toISOString() };
    });
  }, [insights]);

  const secondOrderEffects = useMemo(() => deriveSecondOrderEffects(displayInsights), [displayInsights]);

  const aggregateOptimusSignal = useMemo(() => {
    const allPoints = OptimusDomains.filter(d => d.id === "tesla").flatMap((d) => mapSignalEvolution(d.signalEvolution));
    if (allPoints.length === 0) return null;
    return Math.round(allPoints.reduce((sum, p) => sum + p.signalStrength, 0) / allPoints.length);
  }, []);

  return (
    <section className="space-y-12">
      <OptimusTrajectorySection />
      <OptimusValuationLink />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Optimus Intelligence Signals</h2>

        {aggregateOptimusSignal !== null && (
          <Badge variant={getBadgeVariant(aggregateOptimusSignal)} className="text-white px-4 py-2">
            Optimus Aggregate Signal: {aggregateOptimusSignal}
          </Badge>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {loading
            ? Array.from({ length: 2 }).map((_, i) => <InsightSkeleton key={i} />)
            : displayInsights.map((insight, i) => <OptimusInsightCard key={i} insight={insight} source={insights.length ? "ai" : "fallback"} />)
          }
        </div>
      </section>

      {/* SIGNAL EVOLUTION PANELS */}
      <section className="space-y-6">
        {OptimusDomains.filter(d => d.id === "tesla").map((domain) => (
          <OptimusSignalEvolutionPanel key={domain.id} title={`${domain.name} — Signal Evolution`} signalEvolution={mapSignalEvolution(domain.signalEvolution)} />
        ))}
      </section>

      {/* SECOND-ORDER EFFECTS */}
      <OptimusSecondOrderPanel title="Second-Order Effects Engine" secondOrder={secondOrderEffects} />
    </section>
  );
}
