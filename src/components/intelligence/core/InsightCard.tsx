import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { SignalExplainability } from "./types";

/* ---------------------------------
   TYPES
--------------------------------- */

export type InsightChange = {
  date: string;
  fromConfidence: "low" | "medium" | "high";
  toConfidence: "low" | "medium" | "high";
  reason: string;
};

export type Insight = {
  title: string;
  action: string;
  confidence?: "low" | "medium" | "high";
  reason: string;
  summary: string;
  implications: string[];
  timeframe: string;
  signalStrength?: number;
  updatedAt?: string;
  trend?: "up" | "flat" | "down";
  history?: InsightChange[];
  confidenceRationale?: string;
  weaknesses?: string[];
  invalidationSignals?: string[];

  trendScore?: number;
  sentimentScore?: number;
  volumeScore?: number;

  explainability?: SignalExplainability;
};

/* ---------------------------------
   HELPERS
--------------------------------- */

function calculateSignalStrength({
  trendScore = 50,
  sentimentScore = 50,
  volumeScore = 50,
}: {
  trendScore?: number;
  sentimentScore?: number;
  volumeScore?: number;
}) {
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  return Math.round(
    clamp(trendScore) * 0.5 +
      clamp(sentimentScore) * 0.3 +
      clamp(volumeScore) * 0.2
  );
}

function deriveConfidence(
  explicit?: "low" | "medium" | "high",
  score?: number
): "low" | "medium" | "high" {
  if (explicit) return explicit;
  if (score === undefined) return "medium";
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function getBadgeVariant(
  signal: number
): "destructive" | "secondary" | "outline" {
  if (signal >= 75) return "destructive";
  if (signal >= 50) return "secondary";
  return "outline";
}

function strengthLabel(score: number) {
  if (score >= 75) return "Strong";
  if (score >= 45) return "Moderate";
  return "Weak";
}

function strengthColor(score: number) {
  if (score >= 75) return "bg-green-500";
  if (score >= 45) return "bg-yellow-400";
  return "bg-red-500";
}

function formatTimeAgo(date?: string) {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/* ---------------------------------
   COMPONENT
--------------------------------- */

export function InsightCard({
  insight,
  source,
}: {
  insight: Insight;
  source: "ai" | "fallback";
}) {
  const [openImplications, setOpenImplications] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [openCritique, setOpenCritique] = useState(false);
  const [openExplainability, setOpenExplainability] = useState(false);

  const signalStrength = useMemo(() => {
    return (
      insight.signalStrength ??
      calculateSignalStrength({
        trendScore: insight.trendScore,
        sentimentScore: insight.sentimentScore,
        volumeScore: insight.volumeScore,
      })
    );
  }, [insight]);

  const confidence = deriveConfidence(insight.confidence, signalStrength);

  return (
    <Card className="rounded-2xl shadow-md">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{insight.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {insight.summary}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge variant={getBadgeVariant(signalStrength)}>
              {confidence}
            </Badge>
            <Badge variant="outline">
              {source === "ai" ? "AI" : "Auto"}
            </Badge>
          </div>
        </div>

        {/* Signal Strength Bar */}
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`${strengthColor(signalStrength)} h-3 rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${signalStrength}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Signal: {strengthLabel(signalStrength)} ({signalStrength}/100)
        </p>

        {/* Trend */}
        {insight.trend && (
          <Badge variant="outline" className="flex gap-1 items-center w-fit">
            {insight.trend === "up" && <ArrowUpRight size={14} />}
            {insight.trend === "down" && <ArrowDownRight size={14} />}
            {insight.trend === "flat" && <Minus size={14} />}
            {insight.trend}
          </Badge>
        )}

        {/* Implications */}
        {insight.implications.length > 0 && (
          <>
            <button
              onClick={() => setOpenImplications(!openImplications)}
              className="flex items-center gap-1 text-sm text-primary"
            >
              Implications & Timeframe
              <ChevronDown
                size={16}
                className={openImplications ? "rotate-180" : ""}
              />
            </button>

            {openImplications && (
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Timeframe:</strong> {insight.timeframe}
                </p>
                <ul className="list-disc pl-5">
                  {insight.implications.map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Explainability */}
        {insight.explainability && (
          <>
            <button
              onClick={() => setOpenExplainability(!openExplainability)}
              className="flex items-center gap-1 text-sm text-primary underline"
            >
              Signal Explainability
              <ChevronDown
                size={16}
                className={openExplainability ? "rotate-180" : ""}
              />
            </button>

            {openExplainability && (
              <div className="text-sm text-muted-foreground space-y-2 border-l pl-3">
                <p>
                  <strong>Summary:</strong>{" "}
                  {insight.explainability.summary}
                </p>
              </div>
            )}
          </>
        )}

        {/* History */}
        {insight.history && insight.history.length > 0 && (
          <>
            <button
              onClick={() => setOpenHistory(!openHistory)}
              className="text-xs text-muted-foreground underline"
            >
              {openHistory ? "Hide signal history" : "View signal evolution"}
            </button>

            {openHistory && (
              <div className="mt-2 space-y-2 border-l pl-3">
                {insight.history.map((h, i) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    <div className="font-medium">
                      {new Date(h.date).toLocaleDateString()}
                    </div>
                    <div>
                      Confidence: <b>{h.fromConfidence}</b> →{" "}
                      <b>{h.toConfidence}</b>
                    </div>
                    <div className="italic">{h.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        {insight.action && (
          <p className="text-sm text-muted-foreground">
            Action: {insight.action}
          </p>
        )}

        {insight.updatedAt && (
          <p className="text-xs text-muted-foreground">
            Updated {formatTimeAgo(insight.updatedAt)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export { calculateSignalStrength };
