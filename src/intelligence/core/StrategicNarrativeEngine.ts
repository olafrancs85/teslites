// /src/intelligence/core/StrategicNarrativeEngine.ts

import { CrossSectorSnapshot } from "./CrossSectorEngine"

export type StrategicNarrative = {
  headline: string
  summary: string
  insights: string[]
}

function describeMomentum(value: number) {
  if (value > 0.6) return "strong"
  if (value > 0.3) return "moderate"
  if (value > 0) return "mild"
  return "weak"
}

function describeFragility(value: number) {
  if (value > 0.7) return "high"
  if (value > 0.4) return "moderate"
  return "low"
}

export function buildStrategicNarrative(
  snapshot: CrossSectorSnapshot
): StrategicNarrative {

  const momentumDescriptor = describeMomentum(snapshot.averageMomentum)
  const fragilityDescriptor = describeFragility(snapshot.systemicFragility)

  const headline =
    `${snapshot.industrialRegime} detected across advanced technology sectors`

  const summary =
    `Average momentum across sectors is ${momentumDescriptor} with ${fragilityDescriptor} systemic fragility.`

  const insights: string[] = []

  if (snapshot.averageMomentum > 0.6) {
    insights.push(
      "Industrial innovation cycles are accelerating across multiple sectors."
    )
  }

  if (snapshot.averageCapitalFlow > 0.3) {
    insights.push(
      "Capital flows indicate sustained investment in advanced technology infrastructure."
    )
  }

  if (snapshot.systemicFragility < 0.35) {
    insights.push(
      "Systemic fragility remains contained, suggesting stable expansion conditions."
    )
  }

  if (snapshot.averageVolatility > 0.6) {
    insights.push(
      "Elevated volatility suggests rapid technological and market adjustments."
    )
  }

  return {
    headline,
    summary,
    insights
  }
}