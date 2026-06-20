// /src/intelligence/core/SectorRegimeEngine.ts

import { Sector, SectorRegime, RegimeState } from "../domain/types"

type SectorInputs = {
  sector: Sector

  momentum: number            // normalized -1 to 1
  volatility: number          // 0 to 1
  capitalFlow: number         // -1 to 1
  innovationVelocity: number  // 0 to 1
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

function computeFragility(
  volatility: number,
  momentum: number,
  capitalFlow: number
) {
  const compression = 1 - volatility
  const divergence = Math.abs(momentum - capitalFlow)

  return clamp((compression * 0.6) + (divergence * 0.4))
}

function classifyRegime(
  momentum: number,
  volatility: number,
  capitalFlow: number,
  fragility: number
): RegimeState {

  if (fragility > 0.75) return "Stress"

  if (momentum > 0.4 && capitalFlow > 0.3 && volatility > 0.5)
    return "Acceleration"

  if (volatility < 0.3 && Math.abs(momentum) < 0.3)
    return "Compression"

  return "Expansion"
}

function computeConfidence(
  momentum: number,
  capitalFlow: number,
  volatility: number
) {
  const alignment = 1 - Math.abs(momentum - capitalFlow)
  return clamp((alignment * 0.6) + (volatility * 0.4))
}

export function buildSectorRegime(
  inputs: SectorInputs
): SectorRegime {

  const fragility = computeFragility(
    inputs.volatility,
    inputs.momentum,
    inputs.capitalFlow
  )

  const regimeState = classifyRegime(
    inputs.momentum,
    inputs.volatility,
    inputs.capitalFlow,
    fragility
  )

  const confidence = computeConfidence(
    inputs.momentum,
    inputs.capitalFlow,
    inputs.volatility
  )

  return {
    sector: inputs.sector,
    momentum: inputs.momentum,
    volatility: inputs.volatility,
    capitalFlow: inputs.capitalFlow,
    innovationVelocity: inputs.innovationVelocity,
    fragility,
    regimeState,
    confidence
  }
}