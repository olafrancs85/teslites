// /src/intelligence/core/buildIndustrialSnapshot.ts

import { MacroSignal } from "./MacroSignalTypes"
import { mapTeslaToEV } from "./mappers/TeslaToEVMapper"
import { mapSpaceXToAerospace } from "./mappers/SpaceXToAerospaceMapper"
import { buildCrossSectorSnapshot } from "./CrossSectorEngine"
import { buildStrategicNarrative } from "./StrategicNarrativeEngine"
import { detectSectorDivergence } from "./SectorDivergenceEngine"

import { SectorRegime } from "../domain/types"

export function buildIndustrialSnapshot(signals: MacroSignal[]) {

  const sectorRegimes: SectorRegime[] = []

  for (const signal of signals) {

    if (signal.scope === "tesla") {
      sectorRegimes.push(mapTeslaToEV(signal))
    }

    if (signal.scope === "spacex") {
      sectorRegimes.push(mapSpaceXToAerospace(signal))
    }

  }

  const snapshot = buildCrossSectorSnapshot(sectorRegimes)

  const divergence = detectSectorDivergence(sectorRegimes)

  const narrative = buildStrategicNarrative(snapshot)

  return {
    snapshot,
    divergence,
    narrative
  }
}