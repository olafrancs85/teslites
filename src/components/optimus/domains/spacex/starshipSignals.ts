// components/optimus/domains/spacex/starshipSignals.ts

export type StarshipSignalCategory =
  | "launch_cadence"
  | "economics"
  | "capacity"
  | "reliability"

export type StarshipSignal = {
  id: string
  category: StarshipSignalCategory
  name: string
  description: string
  unit: string
  directionality: "positive" | "negative" | "neutral"
  volatility: "low" | "medium" | "high"
}

/**
 * STARSHIP FIRST-ORDER SIGNALS
 * These are observable, non-interpretive metrics.
 * Optimus derives insight later — NOT here.
 */
export const STARSHIP_SIGNALS: StarshipSignal[] = [
  // -------------------------
  // LAUNCH CADENCE SIGNALS
  // -------------------------
  {
    id: "starship_launches_per_month",
    category: "launch_cadence",
    name: "Starship Launches per Month",
    description: "Number of Starship launches conducted within a rolling 30-day window",
    unit: "launches/month",
    directionality: "positive",
    volatility: "medium",
  },
  {
    id: "avg_days_between_launches",
    category: "launch_cadence",
    name: "Average Days Between Launches",
    description: "Mean number of days separating consecutive Starship launches",
    unit: "days",
    directionality: "negative",
    volatility: "medium",
  },

  // -------------------------
  // ECONOMICS SIGNALS
  // -------------------------
  {
    id: "estimated_cost_per_launch",
    category: "economics",
    name: "Estimated Cost per Launch",
    description: "Estimated marginal cost of a single Starship launch",
    unit: "USD",
    directionality: "negative",
    volatility: "high",
  },
  {
    id: "reuse_turnaround_time",
    category: "economics",
    name: "Reuse Turnaround Time",
    description: "Average time required to refurbish Starship hardware for reuse",
    unit: "days",
    directionality: "negative",
    volatility: "medium",
  },

  // -------------------------
  // CAPACITY SIGNALS
  // -------------------------
  {
    id: "payload_mass_to_orbit",
    category: "capacity",
    name: "Payload Mass to Orbit",
    description: "Total payload mass delivered to orbit per Starship launch",
    unit: "kg",
    directionality: "positive",
    volatility: "low",
  },
  {
    id: "total_monthly_payload",
    category: "capacity",
    name: "Total Monthly Payload to Orbit",
    description: "Aggregate payload mass delivered to orbit per month by Starship",
    unit: "kg/month",
    directionality: "positive",
    volatility: "medium",
  },

  // -------------------------
  // RELIABILITY SIGNALS
  // -------------------------
  {
    id: "launch_success_rate",
    category: "reliability",
    name: "Launch Success Rate",
    description: "Percentage of Starship launches achieving mission-defined success",
    unit: "%",
    directionality: "positive",
    volatility: "low",
  },
  {
    id: "booster_reuse_rate",
    category: "reliability",
    name: "Booster Reuse Rate",
    description: "Percentage of launches using previously flown Starship boosters",
    unit: "%",
    directionality: "positive",
    volatility: "medium",
  },
]
