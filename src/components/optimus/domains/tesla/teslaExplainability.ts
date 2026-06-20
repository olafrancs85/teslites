export type TeslaExplainability = {
  insightId: string
  explanation: string
}

export const TESLA_EXPLAINABILITY: TeslaExplainability[] = [
  {
    insightId: "production_trend",
    explanation:
      "Production trends are influenced by factory output, supply chain, and demand dynamics",
  },
]
