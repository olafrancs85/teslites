// components/optimus/domains/spacex/starshipExplainability.ts

export type ExplainabilityStep = {
  order: number
  statement: string
}

export type StarshipExplainability = {
  insightId: string
  steps: ExplainabilityStep[]
}

/**
 * STARSHIP EXPLAINABILITY CHAINS
 * Each chain explains WHY an insight emerges from its signals.
 */
export const STARSHIP_EXPLAINABILITY: StarshipExplainability[] = [
  {
    insightId: "spx_starship_launch_cadence_acceleration",
    steps: [
      {
        order: 1,
        statement:
          "Increased launch frequency indicates that regulatory, production, and ground operations bottlenecks are being reduced.",
      },
      {
        order: 2,
        statement:
          "Shorter intervals between launches enable faster engineering feedback loops.",
      },
      {
        order: 3,
        statement:
          "Faster iteration cycles accelerate system improvement and operational readiness.",
      },
    ],
  },

  {
    insightId: "spx_starship_cost_curve_compression",
    steps: [
      {
        order: 1,
        statement:
          "Reusable launch systems reduce the need for new hardware manufacturing per mission.",
      },
      {
        order: 2,
        statement:
          "Shorter refurbishment and turnaround times lower labor and facility overhead per launch.",
      },
      {
        order: 3,
        statement:
          "As fixed costs are spread across more launches, marginal cost per launch declines.",
      },
    ],
  },

  {
    insightId: "spx_starship_payload_scaling",
    steps: [
      {
        order: 1,
        statement:
          "Increasing payload mass per launch reflects improvements in vehicle performance and mission planning.",
      },
      {
        order: 2,
        statement:
          "Higher payload efficiency amplifies the economic value of each launch.",
      },
      {
        order: 3,
        statement:
          "Non-linear payload growth suggests optimization beyond simple launch frequency increases.",
      },
    ],
  },

  {
    insightId: "spx_starship_reliability_maturation",
    steps: [
      {
        order: 1,
        statement:
          "Higher launch success rates indicate stabilization of critical flight systems.",
      },
      {
        order: 2,
        statement:
          "Consistent booster reuse demonstrates confidence in hardware durability.",
      },
      {
        order: 3,
        statement:
          "Reliability stabilization marks the transition from experimental testing to operational maturity.",
      },
    ],
  },
]
