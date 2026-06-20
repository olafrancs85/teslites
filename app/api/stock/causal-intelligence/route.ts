import { NextResponse } from "next/server"
import { StockCausalRequest, StockCausalResponse } from "@/types/stockCausal"

/* ----------------------------
   FALLBACK CAUSAL ENGINE
-----------------------------*/

function buildFallbackExplanation(data: StockCausalRequest): StockCausalResponse {
  const { price, technicals, earnings, news } = data

  const drivers: string[] = []
  let explanationParts: string[] = []
  let confidence: "Low" | "Medium" | "High" = "Low"

  /* ----------------------------
     PRICE MOVEMENT FOUNDATION
  -----------------------------*/

  if (price.changePercent > 0.5) {
    explanationParts.push(
      `Tesla shares are moving higher today, gaining approximately ${price.changePercent.toFixed(
        2
      )}%.`
    )
  } else if (price.changePercent < -0.5) {
    explanationParts.push(
      `Tesla shares are declining today, falling approximately ${Math.abs(
        price.changePercent
      ).toFixed(2)}%.`
    )
  } else {
    explanationParts.push(
      `Tesla shares are trading relatively flat today with limited directional conviction.`
    )
  }

  /* ----------------------------
     TECHNICAL DRIVERS
  -----------------------------*/

  if (technicals?.crossover === "bullish") {
    drivers.push("Bullish moving average crossover")
    explanationParts.push(
      "Technical momentum has strengthened following a bullish moving average crossover."
    )
    confidence = "Medium"
  }

  if (technicals?.crossover === "bearish") {
    drivers.push("Bearish moving average crossover")
    explanationParts.push(
      "Technical pressure increased after a bearish moving average crossover."
    )
    confidence = "Medium"
  }

  if (technicals?.rsi14 !== undefined) {
    if (technicals.rsi14 > 70) {
      drivers.push("Overbought RSI condition")
      explanationParts.push(
        "Momentum indicators suggest the stock may be overbought, which can trigger profit-taking."
      )
    }

    if (technicals.rsi14 < 30) {
      drivers.push("Oversold RSI condition")
      explanationParts.push(
        "Momentum indicators suggest the stock is in oversold territory, which sometimes attracts bargain buying."
      )
    }
  }

  /* ----------------------------
     EARNINGS DRIVERS
  -----------------------------*/

  if (earnings?.beatOrMiss === "miss") {
    drivers.push("Earnings miss sentiment")
    explanationParts.push(
      "Investor sentiment remains cautious following a recent earnings miss."
    )
    confidence = "Medium"
  }

  if (earnings?.beatOrMiss === "beat") {
    drivers.push("Strong earnings performance")
    explanationParts.push(
      "Positive sentiment continues following stronger-than-expected earnings results."
    )
    confidence = "Medium"
  }

  /* ----------------------------
     NEWS DRIVERS
  -----------------------------*/

  if (news.headlines.length > 0) {
    drivers.push("Recent Tesla news catalysts")

    explanationParts.push(
      `Market attention is also focused on recent headlines including: "${news.headlines[0]}".`
    )

    if (confidence === "Low") confidence = "Medium"
  }

  /* ----------------------------
     FINAL CONFIDENCE ADJUSTMENT
  -----------------------------*/

  if (drivers.length >= 3) {
    confidence = "High"
  }

  return {
    explanation: explanationParts.join(" "),
    primaryDrivers: drivers,
    confidence,
    mode: "fallback",
    lastUpdated: new Date().toISOString(),
  }
}

/* ----------------------------
   API ROUTE
-----------------------------*/

export async function POST(req: Request) {
  try {
    const body: StockCausalRequest = await req.json()

    if (!body?.price || !body?.news?.headlines) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      )
    }

    // For now we always use fallback
    const response = buildFallbackExplanation(body)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Causal Intelligence API error:", error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
