import { Sector, RegimeState } from "@/intelligence/domain/types"

export type EffectDirection =
  | "Positive"
  | "Negative"
  | "Neutral"

export type SecondOrderEffect = {
  sourceSector: Sector
  targetSector: Sector

  sourceRegime: RegimeState

  effect: EffectDirection

  magnitude: number   // 0 – 1
  confidence: number  // propagated confidence

  narrative: string
}

export type SectorRegimeInput = {
  sector: Sector
  regime: RegimeState
  confidence: number
}