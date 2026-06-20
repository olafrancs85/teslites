"use client";

import { useState } from "react";

export type ProgressStage = "Early" | "Pilot" | "Factory-wide";

interface TrackerProps {
  onStageChange: (stage: ProgressStage) => void;
}

export default function OptimusProgressTracker({ onStageChange }: TrackerProps) {
  const stages: ProgressStage[] = ["Early", "Pilot", "Factory-wide"];
  const [currentStage, setCurrentStage] = useState<ProgressStage>("Early");

  const handleStageClick = (stage: ProgressStage) => {
    setCurrentStage(stage);
    onStageChange(stage);
  };

  return (
    <section className="rounded-xl border p-6 space-y-4">
      <h2 className="text-xl font-semibold">Optimus Progress Tracker</h2>

      <div className="flex gap-4">
        {stages.map((stage) => (
          <button
            key={stage}
            onClick={() => handleStageClick(stage)}
            className={`px-4 py-2 rounded font-medium border transition ${
              stage === currentStage
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {stage}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p>
          <strong>Selected stage:</strong> {currentStage}
        </p>
        <ul className="list-disc pl-5 space-y-1">
          {currentStage === "Early" && (
            <>
              <li>Basic manipulation and scripted tasks</li>
              <li>Controlled lab environment</li>
            </>
          )}
          {currentStage === "Pilot" && (
            <>
              <li>Pilot deployment in select factory tasks</li>
              <li>Partial autonomy under supervision</li>
            </>
          )}
          {currentStage === "Factory-wide" && (
            <>
              <li>Full integration into factory operations</li>
              <li>Autonomous task execution with monitoring</li>
            </>
          )}
        </ul>
      </div>
    </section>
  );
}
