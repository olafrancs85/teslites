// components/optimus/domains/spacex/launchInfrastructureSignals.ts

export type InfrastructureSignalCategory =
  | "launch_pads"
  | "ground_systems"
  | "range_capacity"
  | "operations_parallelism"

export type LaunchInfrastructureSignal = {
  id: string
  category: InfrastructureSignalCategory
  name: string
  description: string
  unit: string
  directionality: "positive" | "negative"
  volatility: "low" | "medium" | "high"
}

/**
 * LAUNCH INFRASTRUCTURE SCALING SIGNALS
 * These represent physical and operational constraints on launch cadence.
 */
export const LAUNCH_INFRASTRUCTURE_SIGNALS: LaunchInfrastructureSignal[] = [
  // -------------------------
  // LAUNCH PAD CAPACITY
  // -------------------------
  {
    id: "active_starship_launch_pads",
    category: "launch_pads",
    name: "Active Starship Launch Pads",
    description:
      "Number of operational launch pads capable of supporting Starship launches.",
    unit: "pads",
    directionality: "positive",
    volatility: "low",
  },
  {
    id: "avg_pad_refurbishment_time",
    category: "launch_pads",
    name: "Average Pad Refurbishment Time",
    description:
      "Average time required to refurbish a launch pad after a Starship launch.",
    unit: "days",
    directionality: "negative",
    volatility: "medium",
  },

  // -------------------------
  // GROUND SYSTEMS
  // -------------------------
  {
    id: "orbital_tower_availability",
    category: "ground_systems",
    name: "Orbital Tower Availability",
    description:
      "Availability of launch towers and catch systems for Starship operations.",
    unit: "index",
    directionality: "positive",
    volatility: "low",
  },

  // -------------------------
  // RANGE & AIRSPACE
  // -------------------------
  {
    id: "range_access_frequency",
    category: "range_capacity",
    name: "Range Access Frequency",
    description:
      "Frequency at which SpaceX receives clearance to use launch ranges and controlled airspace.",
    unit: "windows/month",
    directionality: "positive",
    volatility: "high",
  },

  // -------------------------
  // PARALLEL OPERATIONS
  // -------------------------
  {
    id: "parallel_launch_operations",
    category: "operations_parallelism",
    name: "Parallel Launch Operations Capability",
    description:
      "Ability to conduct overlapping Starship launch preparations across multiple sites.",
    unit: "boolean/index",
    directionality: "positive",
    volatility: "medium",
  },
]
