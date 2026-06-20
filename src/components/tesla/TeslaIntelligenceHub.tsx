"use client";

import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { getIndustrialRegimes } from "@/intelligence/core/IndustrialRegimeEngine";
import { IndustrialRegimeCard } from "@/components/intelligence/industrial/IndustrialRegimeCard";
import {
  InsightCard,
  type Insight,
  calculateSignalStrength,
} from "@/components/intelligence/core/InsightCard";

import SignalEvolutionPanel, {
  type SignalEvolutionPoint,
} from "@/components/intelligence/core/SignalEvolutionPanel";

import SecondOrderPanel, {
  type SecondOrderEffect,
} from "@/components/intelligence/core/SecondOrderPanel";

import { useMacroSignal } from "@/components/intelligence/core/useMacroSignal";
import { TeslaDomains } from "@/components/tesla/domains";

/* ---------------------------------
   TYPES
--------------------------------- */
import type {
  Domain,
  SignalEvolutionProfile,
} from "@/components/intelligence/core/types";

import type { SectorRegime, IndustrialIntelligence } from "@/intelligence/domain/types";

/* ---------------------------------
   SKELETON CARD
--------------------------------- */
function InsightSkeleton() {
  return (
    <div className="animate-pulse p-4 border rounded-2xl shadow-md space-y-3">
      <div className="h-4 w-3/4 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
      <div className="flex justify-end">
        <Badge variant="outline">Loading</Badge>
      </div>
    </div>
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
    case "up":
      return "high";
    case "flat":
      return "medium";
    case "down":
      return "low";
    default:
      return insight.confidence || "medium";
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
  profiles?: SignalEvolutionProfile[]
): SignalEvolutionPoint[] {
  if (!profiles) return [];

  return profiles.map((p) => {
    const strength = computeSignalStrengthFromNarrative(p.narrativeTemplate);

    return {
      date: p.date ?? new Date().toISOString(),
      signalStrength: strength,
      confidence:
        p.confidence ?? (strength >= 70 ? "high" : strength >= 50 ? "medium" : "low"),
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
    return [
      {
        originatingInsightId: insight.title,
        title: insight.title,
        description: insight.implications.join("; "),
      },
    ];
  });
}

/* ---------------------------------
   BADGE VARIANT MAPPING
--------------------------------- */
const getBadgeVariant = (
  signal: number | null
):
  | "link"
  | "secondary"
  | "destructive"
  | "default"
  | "outline"
  | "ghost"
  | null => {
  if (signal === null) return "secondary";
  if (signal >= 75) return "destructive";
  if (signal >= 50) return "secondary";
  return "outline";
};

/* ---------------------------------
   COMPONENT
--------------------------------- */
export default function TeslaIntelligenceHub() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------- INDUSTRIAL REGIMES ---------- */
  const [regimes, setRegimes] = useState<SectorRegime[]>([]);

  useEffect(() => {
    setRegimes(getIndustrialRegimes());
  }, []);

  /* ---------- LOAD AI INSIGHTS ---------- */
  const loadInsights = async () => {
    try {
      const res = await fetch("/api/teslite-ai/insights/tesla");
      if (!res.ok) throw new Error("AI unavailable");

      const data: Insight[] = await res.json();

      const scored = data.map((insight) => {
        const signalStrength =
          insight.signalStrength ??
          calculateSignalStrength({
            trendScore: insight.trendScore,
            sentimentScore: insight.sentimentScore,
            volumeScore: insight.volumeScore,
          });

        return {
          ...insight,
          signalStrength,
          confidence: deriveConfidence({ ...insight, signalStrength }),
          updatedAt: new Date().toISOString(),
        };
      });

      setInsights(scored);
    } catch {
      setInsights([]);
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
    return insights.map((insight) => {
      const signalStrength =
        insight.signalStrength ??
        calculateSignalStrength({
          trendScore: insight.trendScore,
          sentimentScore: insight.sentimentScore,
          volumeScore: insight.volumeScore,
        });

      return {
        ...insight,
        signalStrength,
        confidence: deriveConfidence({ ...insight, signalStrength }),
        updatedAt: insight.updatedAt ?? new Date().toISOString(),
      };
    });
  }, [insights]);

  const secondOrderEffects = useMemo(
    () => deriveSecondOrderEffects(displayInsights),
    [displayInsights]
  );

  /* ---------- MACRO SIGNAL HOOK ---------- */
  const {
    aggregateSignal,
    previousAggregate,
    delta,
    volatility,
    anomaly,
    regime,
    regimeConfidence,
    regimePrediction,
  } = useMacroSignal(TeslaDomains, computeSignalStrengthFromNarrative);

  /* ---------- UI ---------- */
  return (
    <section className="space-y-12 p-6">

      {/* ---------- INDUSTRIAL REGIME CARDS ---------- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Industrial Regimes</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {regimes.map((r) => {
            const intelligence: IndustrialIntelligence = {
              snapshot: {
                sectors: [r],
                averageMomentum: r.momentum,
                averageVolatility: r.volatility,
                averageCapitalFlow: r.capitalFlow,
                industrialRegime: r.regimeState,
                systemicFragility: r.fragility,
                confidence: r.confidence,
              },
              divergence: {
                divergence: false,
                divergenceScore: 0,
                description: "",
              },
              narrative: {
                headline: r.sector,
                summary: r.regimeState,
                insights: [],
              },
            };

            return <IndustrialRegimeCard key={r.sector} intelligence={intelligence} />;
          })}
        </div>
      </section>

      {/* ---------- TESLA AI SIGNALS ---------- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Tesla Intelligence Signals</h2>

        {aggregateSignal !== null && (
          <motion.div
            className="inline-flex flex-col gap-2 rounded-2xl border px-6 py-3 bg-card shadow-sm"
            animate={
              delta !== null && Math.abs(delta) >= 5
                ? {
                    boxShadow: [
                      "0 0 0px transparent",
                      "0 0 18px rgba(34,197,94,0.4)",
                      "0 0 0px transparent",
                    ],
                  }
                : {}
            }
            transition={
              delta !== null && Math.abs(delta) >= 5
                ? { duration: 2, repeat: Infinity }
                : {}
            }
          >
            <div className="inline-flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Aggregate Signal
              </span>
              <Badge
                variant={getBadgeVariant(aggregateSignal)}
                className="text-base font-semibold px-3 py-1"
              >
                {aggregateSignal}
              </Badge>

              {delta !== null && (
                <span
                  className={`text-sm font-medium ${
                    delta > 0
                      ? "text-green-500"
                      : delta < 0
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {delta > 0 ? `↑ +${delta}` : delta < 0 ? `↓ ${delta}` : `→ ${delta}`}
                </span>
              )}
            </div>

            {volatility !== null && (
              <span className="text-xs text-muted-foreground">
                Volatility: {volatility}
              </span>
            )}

            {anomaly && (
              <span className="text-xs text-red-400 font-semibold">
                Anomaly Detected
              </span>
            )}

            {regime && (
              <span className="text-xs text-blue-400 font-medium">
                Regime: {regime} ({(regimeConfidence! * 100).toFixed(0)}%)
              </span>
            )}

            {regimePrediction && (
              <span className="text-xs text-purple-400 font-medium">
                Predicted Shift: {regimePrediction === "upshift" ? "↑ Accelerating" : "↓ Decelerating"}
              </span>
            )}
          </motion.div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {loading
            ? Array.from({ length: 2 }).map((_, i) => <InsightSkeleton key={i} />)
            : displayInsights.map((insight, i) => <InsightCard key={i} insight={insight} source="ai" />)}
        </div>
      </section>

      {/* ---------- SIGNAL EVOLUTION PANELS ---------- */}
      <section className="space-y-6">
        {TeslaDomains.map((domain: Domain) => (
          <SignalEvolutionPanel
            key={domain.id}
            title={`${domain.name} — Signal Evolution`}
            signalEvolution={mapSignalEvolution(domain.signalEvolution)}
          />
        ))}
      </section>

      {/* ---------- SECOND-ORDER EFFECTS PANEL ---------- */}
      <SecondOrderPanel title="Second-Order Effects Engine" secondOrder={secondOrderEffects} />
    </section>
  );
}