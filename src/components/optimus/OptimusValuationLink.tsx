"use client";

import { useState } from "react";

type OptimusValuationLinkProps = {
  domain?: string; // e.g., "Tesla" or "SpaceX Starship"
};

export default function OptimusValuationLink({ domain }: OptimusValuationLinkProps) {
  const [deployment, setDeployment] = useState(20);

  // Phase 4 logic reused
  const baseVehicleMargin = 0.2; // 20%
  const laborShareOfVehicleCOGS = 0.22; // 22%
  const laborEfficiencyFromOptimus = 0.4; // 40% labor displaced per deployment %

  const cogsReduction =
    (deployment / 100) * laborShareOfVehicleCOGS * laborEfficiencyFromOptimus;

  const marginIncrease = cogsReduction;
  const newVehicleMargin = baseVehicleMargin + marginIncrease;

  // Rough directional valuation multiplier (illustrative)
  const valuationEffect = newVehicleMargin / baseVehicleMargin;

  return (
    <section className="rounded-xl border p-6 space-y-6">
      <h2 className="text-xl font-semibold">
        Optimus Trajectory → Vehicle Margin → Valuation
        {domain ? ` (${domain})` : ""}
      </h2>

      <p className="text-sm text-muted-foreground max-w-3xl">
        Adjust deployment to see directional impact on vehicle margins and
        approximate valuation effect.
      </p>

      {/* Slider */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Optimus Deployment: {deployment}%
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
          <p className="text-sm text-muted-foreground">COGS Reduction</p>
          <p className="text-2xl font-semibold">
            {(cogsReduction * 100).toFixed(2)}%
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">Vehicle Margin Uplift</p>
          <p className="text-2xl font-semibold">
            +{(marginIncrease * 100).toFixed(2)} pts
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">Approx. Valuation Effect</p>
          <p className="text-2xl font-semibold">×{valuationEffect.toFixed(2)}</p>
        </div>
      </div>
    </section>
  );
}
