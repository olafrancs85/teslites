type ScenarioInput = {
  earningsVerdict: "Beat" | "Miss" | "Mixed"
  technicalBias: "Bullish" | "Moderately Bullish" | "Neutral" | "Bearish"
  rsi: number
  priceAboveMA50: boolean
}

export function generateScenarios(input: ScenarioInput) {
  const bullSignals = [
    input.earningsVerdict === "Beat" || input.earningsVerdict === "Mixed",
    input.technicalBias.includes("Bullish"),
    input.rsi < 70,
    input.priceAboveMA50,
  ].filter(Boolean).length

  const bearSignals = [
    input.earningsVerdict === "Miss" || input.earningsVerdict === "Mixed",
    input.technicalBias === "Bearish" || input.technicalBias === "Neutral",
    input.rsi > 70 || input.rsi < 30,
    !input.priceAboveMA50,
  ].filter(Boolean).length

  return {
    bullActive: bullSignals >= 2,
    bearActive: bearSignals >= 2,
  }
}
