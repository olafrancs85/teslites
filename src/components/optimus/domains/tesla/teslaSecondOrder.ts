export type TeslaSecondOrderEffect = {
  originatingInsightId: string
  title: string
  description: string
}

export const TESLA_SECOND_ORDER_EFFECTS: TeslaSecondOrderEffect[] = [
  {
    originatingInsightId: "production_trend",
    title: "Market Saturation Pressure",
    description:
      "Rising vehicle production may lead to price adjustments or incentives to maintain demand.",
  },
]
