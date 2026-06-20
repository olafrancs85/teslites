"use client";

import { useState } from "react";
import OptimusOverviewCard from "@/components/optimus/OptimusOverviewCard";
import OptimusProgressTracker, { ProgressStage } from "@/components/optimus/OptimusProgressTracker";
import OptimusNarrativeInsight from "@/components/optimus/OptimusNarrativeInsight";
import OptimusLaborModel from "@/components/optimus/OptimusLaborModel";
import OptimusSystemConnections from "@/components/optimus/OptimusSystemConnections";
import OptimusVehicleMarginCausal from "@/components/optimus/OptimusVehicleMarginCausal";
import OptimusTrajectorySection from "@/components/optimus/OptimusTrajectorySection";
import OptimusValuationLink from "@/components/optimus/OptimusValuationLink";
import OptimusIntelligenceHub from "@/components/optimus/OptimusIntelligenceHub";

export default function OptimusPage() {
  const [currentStage, setCurrentStage] = useState<ProgressStage>("Early");

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Optimus Intelligence Hub</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          Understanding Optimus as Tesla’s labor abstraction system — not a product demo.
        </p>
      </header>

      <OptimusOverviewCard />

      <OptimusProgressTracker onStageChange={setCurrentStage} />

      <OptimusNarrativeInsight stage={currentStage} />

      <OptimusLaborModel />

      <OptimusVehicleMarginCausal />

      <OptimusSystemConnections />

      <OptimusIntelligenceHub />


    </main>
  );
}
