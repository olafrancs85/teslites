export interface StockCausalRequest {
  price: {
    current: number
    changePercent: number
    intradayDirection: "up" | "down" | "flat"
  }

  technicals: {
    ma20?: number
    ma50?: number
    rsi14?: number
    crossover?: "bullish" | "bearish" | "none"
  }

  earnings?: {
    lastEarningsDate?: string
    revenue?: number
    eps?: number
    beatOrMiss?: "beat" | "miss" | "inline" | "unknown"
  }

  news: {
    headlines: string[]
  }

  marketContext?: {
    summary?: string
  }
}

export interface StockCausalResponse {
  explanation: string
  primaryDrivers: string[]
  confidence: "Low" | "Medium" | "High"
  mode: "fallback" | "ai"
  lastUpdated: string
}
