export type TeslaInsight = {
  id: string
  signalId: string
  title: string
  description: string
}

export const TESLA_INSIGHTS: TeslaInsight[] = [
  {
    id: "production_trend",
    signalId: "vehicle_production",
    title: "Production Trend Insight",
    description: "Tracks monthly Tesla vehicle production trends",
  },
]
