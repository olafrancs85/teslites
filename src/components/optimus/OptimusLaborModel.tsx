"use client";

import { useState } from "react";

export default function OptimusLaborModel() {
  const [deployment, setDeployment] = useState(10);

  /**
   * Conservative baseline assumptions
   */
  const laborShareOfCOGS = 0.25; // 25% of factory COGS
  const efficiencyGainFactor = 0.4; // Optimus replaces 40% of human labor per deployment %
  const baseAutoGrossMargin = 0.20; // 20%

  const laborReduction =
    (deployment / 100) * laborShareOfCOGS * efficiencyGainFactor;

  const marginUplift = laborReduction;
  const projectedMargin = baseAutoGrossMargin + marginUplift;

  return (
    <section className="rounded-xl border p-6 space-y-6">
      <h2 className="text-xl font-semibold">
        Optimus Labor Displacement Model
      </h2>

      <p className="text-sm text-muted-foreground max-w-3xl">
        This model estimates directional cost impact from Optimus deployment
        in Tesla factories. Values are conservative and intended for scenario
        analysis — not precise forecasting.
      </p>

      {/* Slider */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Optimus Deployment in Factories: {deployment}%
        </label>
        <input
          type="range"
          min={0}
          max={50}
          step={5}
          value={deployment}
          onChange={(e) => setDeployment(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Outputs */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">Estimated Labor Cost Reduction</p>
          <p className="text-2xl font-semibold">
            {(laborReduction * 100).toFixed(2)}%
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">Margin Uplift</p>
          <p className="text-2xl font-semibold">
            +{(marginUplift * 100).toFixed(2)} pts
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">Projected Auto Margin</p>
          <p className="text-2xl font-semibold">
            {(projectedMargin * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Interpretation */}
      <div className="text-sm text-muted-foreground max-w-3xl">
        <p>
          Even partial Optimus deployment alters factory economics by reducing
          exposure to labor variability, wage inflation, and staffing constraints.
        </p>
        <p className="mt-2">
          The primary impact compounds over time as deployment expands and task
          generalization improves.
        </p>
      </div>
    </section>
  );
}
