import { RegimeState, Sector } from "@/intelligence/domain/types"
import {
  SecondOrderEffect,
  SectorRegimeInput,
  EffectDirection,
} from "./effectTypes"

import { interSectorInfluence } from "./effectMap"

function regimeFactor(regime: RegimeState): number {
  switch (regime) {
    case "Expansion":
      return 1

    case "Acceleration":
      return 1.4

    case "Compression":
      return -0.5

    case "Stress":
      return -1
  }
}

function effectDirection(value: number): EffectDirection {
  if (value > 0.05) return "Positive"
  if (value < -0.05) return "Negative"
  return "Neutral"
}

export function runSecondOrderEffectsEngine(
  sectorRegimes: SectorRegimeInput[]
): SecondOrderEffect[] {
  const effects: SecondOrderEffect[] = []

  for (const source of sectorRegimes) {
    const targets = interSectorInfluence[source.sector]

    if (!targets) continue

    for (const [targetSector, baseInfluence] of Object.entries(targets)) {
      const factor = regimeFactor(source.regime)

      const rawEffect =
        baseInfluence *
        factor *
        source.confidence

      const direction = effectDirection(rawEffect)

      const magnitude = Math.min(Math.abs(rawEffect), 1)

      effects.push({
        sourceSector: source.sector,
        targetSector: targetSector as Sector,

        sourceRegime: source.regime,

        effect: direction,

        magnitude,

        confidence: source.confidence,

        narrative: `${source.sector} in ${source.regime} regime is exerting ${direction.toLowerCase()} pressure on ${targetSector}`,
      })
    }
  }

  return effects
}