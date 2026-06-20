// /src/intelligence/core/SectorDivergenceEngine.ts

import { SectorRegime } from "../domain/types"

export type SectorDivergence = {
  divergence: boolean
  divergenceScore: number
  description: string
}

function regimeToScore(regime: string) {

  switch (regime) {
    case "Acceleration":
      return 1

    case "Expansion":
      return 0.5

    case "Compression":
      return -0.5

    case "Stress":
      return -1

    default:
      return 0
  }
}

export function detectSectorDivergence(
  sectors: SectorRegime[]
): SectorDivergence {

  if (sectors.length < 2) {
    return {
      divergence: false,
      divergenceScore: 0,
      description: "Not enough sectors to evaluate divergence"
    }
  }

  const scores = sectors.map(s => regimeToScore(s.regimeState))

  const max = Math.max(...scores)
  const min = Math.min(...scores)

  const divergenceScore = Math.abs(max - min)

  const divergence = divergenceScore >= 1

  let description = "Sectors moving in similar industrial phases"

  if (divergence) {
    description =
      "Industrial divergence detected between technology sectors"
  }

  return {
    divergence,
    divergenceScore,
    description
  }
}