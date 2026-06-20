"use client";

import { useState } from "react";

export default function OptimusVehicleMarginCausal() {
  const [deployment, setDeployment] = useState(20);

  /**
   * Conservative assumptions (clearly stated)
   */
  const baseVehicleMargin = 0.20; // 20%
  const laborShareOfVehicleCOGS = 0.22; // 22%
  const laborEfficiencyFromOptimus = 0.4; // 40% of labor displaced per deployment %

  const cogsReduction =
    (deployment / 100) *
    laborShareOfVehicleCOGS *
    laborEfficiencyFromOptimus;

  const marginIncrease = cogsReduction;
  const newVehicleMargin = baseVehicleMargin + marginIncrease;

  return (
    <section className="rounded-xl border p-6 space-y-6">
      <h2 className="text-xl font-semibold">
        Optimus → Vehicle Margin Causal Engine
      </h2>

      <p className="text-sm text-muted-foreground max-w-3xl">
        This engine translates Optimus factory deployment into directional
        vehicle margin impact by modeling reductions in labor-driven COGS.
        Assumptions are conservative and intended for causal reasoning.
      </p>

      {/* Slider */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Optimus Factory Deployment: {deployment}%
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
          <p className="text-sm text-muted-foreground">
            Vehicle COGS Reduction
          </p>
          <p className="text-2xl font-semibold">
            {(cogsReduction * 100).toFixed(2)}%
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            Vehicle Margin Uplift
          </p>
          <p className="text-2xl font-semibold">
            +{(marginIncrease * 100).toFixed(2)} pts
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            Projected Vehicle Gross Margin
          </p>
          <p className="text-2xl font-semibold">
            {(newVehicleMargin * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Causal Explanation */}
      <div className="text-sm text-muted-foreground max-w-3xl space-y-2">
        <p>
          Optimus reduces vehicle costs by replacing repetitive, low-variance
          factory labor with autonomous execution.
        </p>
        <p>
          Because labor is a structural component of vehicle COGS, even partial
          Optimus deployment creates durable margin expansion rather than
          one-time efficiency gains.
        </p>
      </div>
    </section>
  );
}
