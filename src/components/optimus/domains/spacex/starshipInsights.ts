// components/optimus/domains/spacex/starshipInsights.ts

import { STARSHIP_SIGNALS } from "./starshipSignals"

export type StarshipInsight = {
  id: string
  title: string
  summary: string
  confidence: number
  supportingSignalIds: string[]
  interpretation: string
}

/**
 * STARSHIP INTELLIGENCE INSIGHTS
 * These insights are derived from first-order signals.
 * No raw values are computed here — Optimus does that upstream.
 */
export const STARSHIP_INSIGHTS: StarshipInsight[] = [
  {
    id: "spx_starship_launch_cadence_acceleration",
    title: "Starship Launch Cadence Acceleration",
    summary:
      "Starship launch frequency is increasing, indicating rapid iteration and operational scaling.",
    confidence: 0.78,
    supportingSignalIds: [
      "starship_launches_per_month",
      "avg_days_between_launches",
    ],
    interpretation:
      "Rising launch cadence suggests SpaceX is moving from experimental testing into sustained operational deployment.",
  },

  {
    id: "spx_starship_cost_curve_compression",
    title: "Starship Cost Curve Compression",
    summary:
      "Decreasing time between launches and increasing reuse rates imply a declining marginal cost per launch.",
    confidence: 0.82,
    supportingSignalIds: [
      "estimated_cost_per_launch",
      "reuse_turnaround_time",
      "booster_reuse_rate",
    ],
    interpretation:
      "As hardware reuse improves and turnaround times shrink, fixed costs are amortized faster, compressing the launch cost curve.",
  },

  {
    id: "spx_starship_payload_scaling",
    title: "Starship Payload Scaling Efficiency",
    summary:
      "Payload mass delivered to orbit is increasing faster than launch frequency alone would suggest.",
    confidence: 0.74,
    supportingSignalIds: [
      "payload_mass_to_orbit",
      "total_monthly_payload",
    ],
    interpretation:
      "Non-linear payload scaling indicates improving vehicle performance and mission optimization rather than simple cadence increases.",
  },

  {
    id: "spx_starship_reliability_maturation",
    title: "Starship Reliability Maturation",
    summary:
      "Launch success and booster reuse rates are stabilizing, indicating system maturation.",
    confidence: 0.76,
    supportingSignalIds: [
      "launch_success_rate",
      "booster_reuse_rate",
    ],
    interpretation:
      "Stabilizing reliability metrics suggest Starship is transitioning from prototype volatility to production reliability.",
  },
]
