import type { MarketRegime } from "./marketRegimeEngine";

export function weightEngine(
  regime: MarketRegime
) {
  switch (regime) {
    case "STRONG_UPTREND":
      return {
        trend: 2,
        momentum: 1.8,
        volume: 1.4,
        priceAction: 1.2,
        risk: 0.8,
        news: 1.2,
        multiTimeframe: 2,
        supportResistance: 1.2,
      };

    case "UPTREND":
      return {
        trend: 1.5,
        momentum: 1.3,
        volume: 1.2,
        priceAction: 1,
        risk: 1,
        news: 1,
        multiTimeframe: 1.7,
        supportResistance: 1.2,
      };

    case "RANGE":
      return {
        trend: 0.8,
        momentum: 0.8,
        volume: 1,
        priceAction: 1.6,
        risk: 1.3,
        news: 1,
        multiTimeframe: 1.3,
        supportResistance: 1.8,
      };

    case "DOWNTREND":
      return {
        trend: 1.3,
        momentum: 1.3,
        volume: 1.2,
        priceAction: 1,
        risk: 1.6,
        news: 1,
        multiTimeframe: 1.7,
        supportResistance: 1.3,
      };

    case "STRONG_DOWNTREND":
      return {
        trend: 1.8,
        momentum: 1.8,
        volume: 1.5,
        priceAction: 1.2,
        risk: 2,
        news: 1.3,
        multiTimeframe: 2,
        supportResistance: 1.3,
      };

    case "HIGH_VOLATILITY":
      return {
        trend: 1,
        momentum: 0.8,
        volume: 1.5,
        priceAction: 1.4,
        risk: 2.5,
        news: 1.5,
        multiTimeframe: 1.5,
        supportResistance: 1.6,
      };

    default:
      return {
        trend: 1,
        momentum: 1,
        volume: 1,
        priceAction: 1,
        risk: 1,
        news: 1,
        multiTimeframe: 1,
        supportResistance: 1,
      };
  }
}