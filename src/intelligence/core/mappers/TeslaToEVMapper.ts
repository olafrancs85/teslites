// /src/intelligence/core/mappers/TeslaToEVMapper.ts

import { MacroSignal } from "../MacroSignalTypes"
import { buildSectorRegime } from "../SectorRegimeEngine"
import { Sector } from "../../domain/types"

/**
 * Map Tesla MacroSignal to EV SectorRegime
 */
export function mapTeslaToEV(signal: MacroSignal) {

  if (signal.scope !== "tesla") {
    throw new Error("Signal scope must be 'tesla'")
  }

  // Step 1: Map Tesla regime to momentum proxy
  let momentum = 0
  switch(signal.regime) {
    case "accelerating":
      momentum = 0.7
      break
    case "stable":
      momentum = 0.3
      break
    case "turbulent":
      momentum = -0.4
      break
    case "Expansion":
      momentum = 0.5
      break
    case "Contraction":
      momentum = -0.5
      break
    default:
      momentum = 0
  }

  // Step 2: Volatility normalization
  const volatility = signal.confidence // simple initial proxy (0–1)

  // Step 3: Capital flow proxy from drivers
  const capitalFlow =
  (signal.drivers?.liquidity ?? 0) * 0.8 +
  (signal.drivers?.riskSpread ?? 0) * -0.2

  // Clamp capitalFlow to -1 → 1
  const clampedCapitalFlow = Math.max(-1, Math.min(1, capitalFlow))

  // Step 4: innovationVelocity placeholder (default for now)
  const innovationVelocity = 0.7

  // Step 5: Build SectorRegime using engine
  const sectorRegime = buildSectorRegime({
    sector: "EV" as Sector,
    momentum,
    volatility,
    capitalFlow: clampedCapitalFlow,
    innovationVelocity
  })

  return sectorRegime
}