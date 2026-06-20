// components/optimus/domains/spacex/starshipSignalEvolution.ts

export type SignalEvolutionProfile = {
  signalId: string
  evolutionType: "trend" | "volatility" | "step_change"
  narrativeTemplate: string
}

/**
 * STARSHIP SIGNAL EVOLUTION PROFILES
 * These describe how Optimus narrates signal changes over time.
 */
export const STARSHIP_SIGNAL_EVOLUTION: SignalEvolutionProfile[] = [
  {
    signalId: "starship_launches_per_month",
    evolutionType: "trend",
    narrativeTemplate:
      "Starship launch frequency has shown a {direction} trend over the observed period, indicating changes in operational cadence.",
  },
  {
    signalId: "avg_days_between_launches",
    evolutionType: "trend",
    narrativeTemplate:
      "The average time between Starship launches has {direction}, reflecting shifts in launch readiness and throughput.",
  },
  {
    signalId: "estimated_cost_per_launch",
    evolutionType: "trend",
    narrativeTemplate:
      "Estimated marginal cost per Starship launch has {direction}, signaling changes in economic efficiency.",
  },
  {
    signalId: "payload_mass_to_orbit",
    evolutionType: "trend",
    narrativeTemplate:
      "Payload mass delivered to orbit per launch has {direction}, suggesting performance evolution of the Starship system.",
  },
  {
    signalId: "launch_success_rate",
    evolutionType: "volatility",
    narrativeTemplate:
      "Launch success rates have shown {stability} over time, indicating reliability progression.",
  },
]
