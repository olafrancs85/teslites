// components/optimus/domains/spacex/starshipSecondOrder.ts

export type SecondOrderEffect = {
  id: string
  originatingInsightId: string
  title: string
  description: string
  impactDomain:
    | "launch_market"
    | "satellite_economics"
    | "national_security"
    | "space_industry"
    | "long_term_exploration"
  timeHorizon: "short_term" | "medium_term" | "long_term"
}

/**
 * STARSHIP SECOND-ORDER EFFECTS
 * These effects emerge indirectly from first-order insights.
 */
export const STARSHIP_SECOND_ORDER_EFFECTS: SecondOrderEffect[] = [
  {
    id: "spx_launch_market_price_pressure",
    originatingInsightId: "spx_starship_cost_curve_compression",
    title: "Downward Pressure on Global Launch Prices",
    description:
      "Declining Starship launch costs force competing launch providers to reduce prices or exit certain market segments.",
    impactDomain: "launch_market",
    timeHorizon: "short_term",
  },

  {
    id: "spx_competitor_business_model_strain",
    originatingInsightId: "spx_starship_payload_scaling",
    title: "Competitor Business Model Strain",
    description:
      "Starship’s payload scaling advantages weaken the viability of expendable and medium-lift launch business models.",
    impactDomain: "space_industry",
    timeHorizon: "medium_term",
  },

  {
    id: "spx_starlink_deployment_acceleration",
    originatingInsightId: "spx_starship_launch_cadence_acceleration",
    title: "Starlink Deployment Acceleration",
    description:
      "Higher launch cadence enables faster and cheaper deployment of large satellite constellations.",
    impactDomain: "satellite_economics",
    timeHorizon: "short_term",
  },

  {
    id: "spx_defense_logistics_shift",
    originatingInsightId: "spx_starship_reliability_maturation",
    title: "Shift in Defense and National Security Logistics",
    description:
      "Reliable, high-capacity launch systems increase military interest in rapid orbital deployment and point-to-point logistics.",
    impactDomain: "national_security",
    timeHorizon: "medium_term",
  },

  {
    id: "spx_mars_mission_timeline_compression",
    originatingInsightId: "spx_starship_cost_curve_compression",
    title: "Mars Mission Timeline Compression",
    description:
      "Lower launch costs and higher payload capacity reduce economic barriers to sustained interplanetary missions.",
    impactDomain: "long_term_exploration",
    timeHorizon: "long_term",
  },
]
