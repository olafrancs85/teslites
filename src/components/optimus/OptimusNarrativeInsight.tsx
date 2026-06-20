"use client";

import { ProgressStage } from "./OptimusProgressTracker";

interface NarrativeProps {
  stage: ProgressStage;
}

const insights: Record<ProgressStage, string[]> = {
  Early: [
    "Optimus demonstrates labor abstraction potential in controlled tasks.",
    "Impact on overall production is limited but measurable.",
  ],
  Pilot: [
    "Pilot deployments show reductions in repetitive labor needs.",
    "Factory workflows are beginning to optimize around autonomous assistance.",
  ],
  "Factory-wide": [
    "Optimus integration significantly reduces labor volatility and increases throughput.",
    "Margins are improved due to consistent, low-variance production.",
  ],
};

export default function OptimusNarrativeInsight({ stage }: NarrativeProps) {
  return (
    <section className="rounded-xl border p-6 space-y-4 bg-muted/30">
      <h2 className="text-xl font-semibold">Narrative Intelligence</h2>

      <p className="text-sm text-muted-foreground">
        Insights update dynamically as Optimus progresses through stages.
      </p>

      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
        {insights[stage].map((text, idx) => (
          <li key={idx}>{text}</li>
        ))}
      </ul>
    </section>
  );
}
