"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export type SignalEvolutionPoint = {
  date: string;
  signalStrength: number;
  confidence: "low" | "medium" | "high";
  reason: string;
};

export type SignalEvolutionPanelProps = {
  title: string;
  signalEvolution?: SignalEvolutionPoint[];
};

/* ---------------------------------
   HELPERS
--------------------------------- */

function getBadgeVariant(
  signal: number | null
): "destructive" | "secondary" | "outline" {
  if (signal === null) return "secondary";
  if (signal >= 75) return "destructive";
  if (signal >= 50) return "secondary";
  return "outline";
}

function strengthColor(score: number) {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-400";
  return "bg-red-500";
}

/* ---------------------------------
   COMPONENT
--------------------------------- */
export default function SignalEvolutionPanel({
  title,
  signalEvolution = [],
}: SignalEvolutionPanelProps) {
  if (!signalEvolution || signalEvolution.length === 0) {
    return (
      <Card className="rounded-2xl shadow-md">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-2">
            No signals available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>

      <div className="grid gap-4 md:grid-cols-2">
        {signalEvolution.map((point, i) => (
          <Card key={i} className="rounded-2xl shadow-md">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{new Date(point.date).toLocaleDateString()}</span>
                <Badge variant={getBadgeVariant(point.signalStrength)}>
                  {point.confidence}
                </Badge>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`${strengthColor(point.signalStrength)} h-3 rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${point.signalStrength}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{point.reason}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
