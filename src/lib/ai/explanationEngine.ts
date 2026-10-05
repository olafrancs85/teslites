interface ExplanationInput {
  recommendation: string;
  confidence: number;
  trend: "Bullish" | "Bearish" | "Neutral";
  regime: string;
  rsi: number | null;
  macdTrend: "bullish" | "bearish" | "neutral";
  volumeTrend: "rising" | "falling" | "neutral";
  newsSummary: string;
}

export function explanationEngine({
  recommendation,
  confidence,
  trend,
  regime,
  rsi,
  macdTrend,
  volumeTrend,
  newsSummary,
}: ExplanationInput): string {

  const paragraphs: string[] = [];

  // Overall conclusion
  paragraphs.push(
    `The AI currently assigns a ${recommendation} recommendation with ${confidence}% confidence.`
  );

  // Trend
  if (trend === "Bullish") {
    paragraphs.push(
      "The primary market trend remains bullish, indicating buyers continue to control the broader direction."
    );
  } else if (trend === "Bearish") {
    paragraphs.push(
      "The prevailing market trend remains bearish, suggesting sellers continue to dominate price action."
    );
  } else {
    paragraphs.push(
      "The market currently lacks a clear directional trend and remains neutral."
    );
  }

  // Regime
  switch (regime) {

    case "STRONG_UPTREND":
      paragraphs.push(
        "The current market regime is classified as a strong uptrend where trend-following strategies historically perform best."
      );
      break;

    case "UPTREND":
      paragraphs.push(
        "The market continues to trade in an established uptrend with healthy momentum."
      );
      break;

    case "RANGE":
      paragraphs.push(
        "Price is currently trading within a range, making breakout confirmation more important than trend-following."
      );
      break;

    case "DOWNTREND":
      paragraphs.push(
        "The market remains in a downtrend, favouring defensive positioning."
      );
      break;

    case "STRONG_DOWNTREND":
      paragraphs.push(
        "Selling pressure remains dominant and the market is classified as being in a strong downtrend."
      );
      break;

    case "HIGH_VOLATILITY":
      paragraphs.push(
        "Current market volatility is unusually elevated, increasing trading risk despite directional signals."
      );
      break;
  }

  // Momentum
  if (macdTrend === "bullish") {
    paragraphs.push(
      "MACD continues to support positive momentum."
    );
  } else if (macdTrend === "bearish") {
    paragraphs.push(
      "MACD continues to support bearish momentum."
    );
  }

  // RSI
  if (rsi !== null) {

    if (rsi >= 70) {
      paragraphs.push(
        "RSI indicates overbought conditions, suggesting upside momentum could begin slowing."
      );
    }

    else if (rsi <= 30) {
      paragraphs.push(
        "RSI indicates oversold conditions, increasing the probability of a technical rebound."
      );
    }

    else {
      paragraphs.push(
        "RSI remains within a healthy trading range and does not currently indicate extreme positioning."
      );
    }

  }

  // Volume
  if (volumeTrend === "rising") {
    paragraphs.push(
      "Increasing trading volume confirms growing market participation."
    );
  }

  if (volumeTrend === "falling") {
    paragraphs.push(
      "Declining trading volume suggests weakening conviction behind the current move."
    );
  }

  if (newsSummary.trim().length > 0) {
    paragraphs.push(newsSummary);
  }

  return paragraphs.join("\n\n");
}