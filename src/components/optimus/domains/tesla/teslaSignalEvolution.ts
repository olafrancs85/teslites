export type TeslaSignalEvolutionProfile = {
  signalId: string
  evolutionType: "trend" | "volatility" | "step_change"
  narrativeTemplate: string
}

export const TESLA_SIGNAL_EVOLUTION: TeslaSignalEvolutionProfile[] = [
  {
    signalId: "vehicle_production",
    evolutionType: "trend",
    narrativeTemplate:
      "Tesla vehicle production has shown a {direction} trend over the observed period.",
  },
]
