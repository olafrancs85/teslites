// components/optimus/domains/spacex/raptorProductionSignals.ts

export type RaptorSignalCategory =
  | "engine_production"
  | "manufacturing_efficiency"
  | "supply_chain"

export type RaptorProductionSignal = {
  id: string
  category: RaptorSignalCategory
  name: string
  description: string
  unit: string
  directionality: "positive" | "negative"
  volatility: "low" | "medium" | "high"
}

/**
 * RAPTOR ENGINE PRODUCTION SIGNALS
 * These signals represent Starship's manufacturing constraint layer.
 */
export const RAPTOR_PRODUCTION_SIGNALS: RaptorProductionSignal[] = [
  {
    id: "raptor_engines_produced_per_month",
    category: "engine_production",
    name: "Raptor Engines Produced per Month",
    description:
      "Number of completed Raptor engines produced within a monthly period.",
    unit: "engines/month",
    directionality: "positive",
    volatility: "medium",
  },
  {
    id: "raptor_engine_scrap_rate",
    category: "manufacturing_efficiency",
    name: "Raptor Engine Scrap Rate",
    description:
      "Percentage of Raptor engines rejected due to manufacturing defects.",
    unit: "%",
    directionality: "negative",
    volatility: "high",
  },
  {
    id: "raptor_cost_per_unit",
    category: "manufacturing_efficiency",
    name: "Raptor Engine Cost per Unit",
    description:
      "Estimated marginal manufacturing cost of a single Raptor engine.",
    unit: "USD",
    directionality: "negative",
    volatility: "medium",
  },
  {
    id: "critical_material_supply_stability",
    category: "supply_chain",
    name: "Critical Material Supply Stability",
    description:
      "Stability of supply for key Raptor engine materials and components.",
    unit: "index",
    directionality: "positive",
    volatility: "medium",
  },
]
