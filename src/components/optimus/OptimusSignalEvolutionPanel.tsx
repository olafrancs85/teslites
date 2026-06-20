"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export type SignalEvolutionPoint = {
  date: string;
  signalStrength: number;
  confidence: "low" | "medium" | "high";
  reason: string;
};

type OptimusSignalEvolutionPanelProps = {
  title: string;
  signalEvolution?: SignalEvolutionPoint[];
};

export default function OptimusSignalEvolutionPanel({ title, signalEvolution = [] }: OptimusSignalEvolutionPanelProps) {
  if (!signalEvolution.length) {
    return (
      <Card className="rounded-2xl shadow-md">
        <CardContent className="p-4 text-sm text-muted-foreground">
          No signal evolution data available.
        </CardContent>
      </Card>
    );
  }

  const minStrength = Math.min(...signalEvolution.map((p) => p.signalStrength));
  const maxStrength = Math.max(...signalEvolution.map((p) => p.signalStrength));
  const scale = (value: number) => ((value - minStrength) / (maxStrength - minStrength)) * 100;

  return (
    <Card className="rounded-2xl shadow-md">
      <CardContent className="space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-end gap-2 overflow-x-auto pb-2">
          {signalEvolution.map((p, i) => {
            const barHeight = scale(p.signalStrength);
            const color = p.confidence === "high" ? "bg-green-500" : p.confidence === "medium" ? "bg-yellow-400" : "bg-red-500";

            return (
              <div key={i} className="flex flex-col items-center">
                <motion.div
                  className={`w-6 rounded-t ${color}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${barHeight}px` }}
                  transition={{ duration: 0.6 }}
                  title={`${p.date} — ${p.signalStrength} (${p.confidence})`}
                />
                <span className="text-xs mt-1 whitespace-nowrap">
                  {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
