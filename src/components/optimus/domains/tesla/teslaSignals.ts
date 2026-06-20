export type TeslaSignal = {
  id: string
  name: string
  description: string
  unit: string
  directionality: "positive" | "negative"
  volatility: "low" | "medium" | "high"
}

export const TESLA_SIGNALS: TeslaSignal[] = [
  {
    id: "vehicle_production",
    name: "Vehicle Production",
    description: "Number of Tesla vehicles produced per month",
    unit: "units/month",
    directionality: "positive",
    volatility: "medium",
  },
]
