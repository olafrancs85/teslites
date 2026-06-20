"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { MacroSignal } from "@/components/intelligence/types/macro";

interface MacroSignalCardProps {
  signal: MacroSignal;
}

const getBadgeVariant = (signalValue: number | null) => {
  if (signalValue === null) return "secondary";
  if (signalValue >= 75) return "destructive";
  if (signalValue >= 50) return "secondary";
  return "outline";
};

export default function MacroSignalCard({ signal }: MacroSignalCardProps) {
  return (
    <motion.div
      className="flex flex-col gap-2 rounded-2xl border px-6 py-4 bg-card shadow-sm"
      animate={
        signal.anomaly
          ? { boxShadow: ["0 0 0px transparent", "0 0 18px rgba(239,68,68,0.4)", "0 0 0px transparent"] }
          : {}
      }
      transition={signal.anomaly ? { duration: 1.5, repeat: Infinity } : {}}
    >
      <div className="inline-flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Aggregate Signal</span>
        <Badge variant={getBadgeVariant(signal.confidence)} className="text-base font-semibold px-3 py-1">
          {signal.confidence ? Math.round(signal.confidence * 100) : "N/A"}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {signal.anomaly && <span className="text-red-400 font-semibold">Anomaly Detected</span>}
        {signal.regime && <span className="text-blue-400 font-medium">Regime: {signal.regime}</span>}

        {signal.drivers?.inflation !== undefined && (
          <span className="text-green-500">Inflation: {signal.drivers.inflation}</span>
        )}
        {signal.drivers?.rates !== undefined && (
          <span className="text-green-500">Rates: {signal.drivers.rates}</span>
        )}
        {signal.drivers?.liquidity !== undefined && (
          <span className="text-green-500">Liquidity: {signal.drivers.liquidity}</span>
        )}
        {signal.drivers?.riskSpread !== undefined && (
          <span className="text-green-500">Risk Spread: {signal.drivers.riskSpread}</span>
        )}
      </div>

      {signal.narrative && <p className="text-sm mt-2">{signal.narrative}</p>}
    </motion.div>
  );
}