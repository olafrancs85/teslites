// components/optimus/domains/spacex/regulatoryConstraintSignals.ts

export type RegulatorySignalCategory =
  | "faa_approval"
  | "environmental"
  | "policy_risk"
  | "legal_constraints"

export type RegulatoryConstraintSignal = {
  id: string
  category: RegulatorySignalCategory
  name: string
  description: string
  unit: string
  directionality: "positive" | "negative"
  volatility: "low" | "medium" | "high"
}

/**
 * REGULATORY & CONSTRAINT SIGNALS
 * These represent non-technical limits on Starship launch scaling.
 */
export const REGULATORY_CONSTRAINT_SIGNALS: RegulatoryConstraintSignal[] = [
  // -------------------------
  // FAA & REGULATORY APPROVAL
  // -------------------------
  {
    id: "faa_launch_license_velocity",
    category: "faa_approval",
    name: "FAA Launch License Velocity",
    description:
      "Speed and frequency at which FAA launch licenses are approved or amended for Starship operations.",
    unit: "approvals/month",
    directionality: "positive",
    volatility: "high",
  },
  {
    id: "license_scope_flexibility",
    category: "faa_approval",
    name: "Launch License Scope Flexibility",
    description:
      "Degree to which existing launch licenses allow changes in vehicle configuration, cadence, or trajectory.",
    unit: "index",
    directionality: "positive",
    volatility: "medium",
  },

  // -------------------------
  // ENVIRONMENTAL CONSTRAINTS
  // -------------------------
  {
    id: "environmental_clearance_stability",
    category: "environmental",
    name: "Environmental Clearance Stability",
    description:
      "Stability of environmental approvals governing Starship launch activities.",
    unit: "index",
    directionality: "positive",
    volatility: "medium",
  },
  {
    id: "environmental_litigation_risk",
    category: "environmental",
    name: "Environmental Litigation Risk",
    description:
      "Risk of lawsuits or injunctions related to environmental impact of Starship launches.",
    unit: "risk_index",
    directionality: "negative",
    volatility: "high",
  },

  // -------------------------
  // POLICY & LEGAL RISK
  // -------------------------
  {
    id: "policy_support_for_commercial_space",
    category: "policy_risk",
    name: "Policy Support for Commercial Spaceflight",
    description:
      "Strength of political and regulatory support for commercial orbital launch programs.",
    unit: "index",
    directionality: "positive",
    volatility: "medium",
  },
  {
    id: "launch_cadence_regulatory_cap",
    category: "legal_constraints",
    name: "Regulatory Launch Cadence Cap",
    description:
      "Maximum number of Starship launches permitted under current regulatory frameworks.",
    unit: "launches/year",
    directionality: "positive",
    volatility: "low",
  },
]
