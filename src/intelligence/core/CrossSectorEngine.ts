// /src/intelligence/core/CrossSectorEngine.ts

import { SectorRegime } from "../domain/types"

export type IndustrialRegime =
  | "Industrial Expansion"
  | "Industrial Acceleration"
  | "Industrial Compression"
  | "Industrial Stress"

export type CrossSectorSnapshot = {
  sectors: SectorRegime[]
  averageMomentum: number
  averageVolatility: number
  averageCapitalFlow: number
  industrialRegime: IndustrialRegime
  systemicFragility: number
  confidence: number
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

function classifyIndustrialRegime(
  momentum: number,
  volatility: number,
  fragility: number
): IndustrialRegime {

  if (fragility > 0.7) return "Industrial Stress"

  if (momentum > 0.5 && volatility > 0.5)
    return "Industrial Acceleration"

  if (volatility < 0.3)
    return "Industrial Compression"

  return "Industrial Expansion"
}

export function buildCrossSectorSnapshot(
  sectors: SectorRegime[]
): CrossSectorSnapshot {

  const count = sectors.length

  const averageMomentum =
    sectors.reduce((s, r) => s + r.momentum, 0) / count

  const averageVolatility =
    sectors.reduce((s, r) => s + r.volatility, 0) / count

  const averageCapitalFlow =
    sectors.reduce((s, r) => s + r.capitalFlow, 0) / count

  const systemicFragility =
    sectors.reduce((s, r) => s + r.fragility, 0) / count

  const confidence =
    clamp(sectors.reduce((s, r) => s + r.confidence, 0) / count)

  const industrialRegime = classifyIndustrialRegime(
    averageMomentum,
    averageVolatility,
    systemicFragility
  )

  return {
    sectors,
    averageMomentum,
    averageVolatility,
    averageCapitalFlow,
    industrialRegime,
    systemicFragility,
    confidence
  }
}