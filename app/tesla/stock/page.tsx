"use client";

import { useEffect, useMemo, useState } from "react";
import TeslaAISummary from "../../Components/TeslaAISummary";
import ScenarioCards from "../../Components/stock/ScenarioCards";
import AIConfidenceCard from "../../Components/stock/AIConfidenceCard";
import { generateScenarios } from "@/lib/ai/scenarioEngine";
import { bullCaseText, bearCaseText } from "@/lib/ai/scenarioText";
import { calculateConfidenceScore } from "@/lib/ai/confidenceEngine";
import { getConfidenceLabel } from "@/lib/ai/confidenceLabel";
import { updateConfidenceTrend, getTrendDirection } from "@/lib/ai/confidenceTrend";
import ConfidenceTrend from "@/app/tesla/ConfidenceTrend";
import dynamic from "next/dynamic";
import TeslaLivePanel from "../../Components/TeslaLivePanel";
import StockCausalIntelligenceCard from "@/components/stock/StockCausalIntelligenceCard"
import { useTeslaStockCausalIntelligence } from "@/hooks/useTeslaStockCausalIntelligence"
import { StockCausalRequest } from "@/types/stockCausal";


const TeslaLive = dynamic(() => import("@/app/tesla/TeslaLive"), {
  ssr: false,
});


/* =============================
   TYPES
============================= */
interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  extended?: boolean; // true if pre/post-market
}

interface Earnings {
  fiscalDate: string;
  revenue: number | null;
  eps: number | null;
  actualEPS?: number | null;
  expectedEPS?: number | null;
}

/* =============================
   RSI HELPER (PURE & SAFE)
============================= */
function calculateRSI(candles: { close: number }[], period = 14): number | null {
  if (candles.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = candles.length - period; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  if (losses === 0) return 100;

  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function calculateMA(candles: { close: number }[], period = 20): number | null {
  if (candles.length < period) return null;

  const slice = candles.slice(-period);
  const sum = slice.reduce((acc, c) => acc + c.close, 0);
  return sum / period;
}

/* =============================
   PAGE
============================= */
export default function TeslaStockPage() {
  
  /* -----------------------------
     STATE (DO NOT REORDER)
  ----------------------------- */
  const [candles, setCandles] = useState<Candle[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [headline, setHeadline] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [hoveredCrossover, setHoveredCrossover] = useState<{
    x: number;
    y: number;
    type: "bullish" | "bearish";
  } | null>(null);

  const [confidenceHistory, setConfidenceHistory] = useState<number[]>([]);
useEffect(() => {
  if (!candles.length) {
    setCandles([
      { time: Date.now() - 86400000 * 5, open: 210, high: 215, low: 205, close: 212 },
      { time: Date.now() - 86400000 * 4, open: 212, high: 218, low: 210, close: 216 },
      { time: Date.now() - 86400000 * 3, open: 216, high: 220, low: 215, close: 218 },
      { time: Date.now() - 86400000 * 2, open: 218, high: 222, low: 217, close: 221 },
      { time: Date.now() - 86400000 * 1, open: 221, high: 225, low: 220, close: 224 },
    ]);
  }
}, []);

  /* -----------------------------
     FETCH DATA
  ----------------------------- */
  const fetchAll = async () => {
  setLoading(true);

  /* -----------------------------
     STOCK HISTORY
  ----------------------------- */
  try {
    const historyRes = await fetch("/api/teslite-ai/live/tesla-stock-history", {
      cache: "no-store",
    });
    const historyData = await historyRes.json();

    if (historyRes.status === 429 || historyData.error) {
      console.warn("Stock API rate limit reached, keeping previous data.");
      // Do not clear candles; keep the last successful data
    } else if (historyData?.candles?.length) {
      setCandles(historyData.candles);
      console.log("Stock history data:", historyData.candles);
    }
  } catch (err) {
    console.warn("Failed to fetch stock history:", err);
  }

  /* -----------------------------
     EARNINGS
  ----------------------------- */
  try {
    const earningsRes = await fetch("/api/teslite-ai/live/tesla-earnings", {
      cache: "no-store",
    });
    const earningsData = await earningsRes.json();

    if (earningsRes.status === 429 || earningsData.error) {
      console.warn("Earnings API rate limit reached, keeping previous data.");
      // Keep previous earnings state
    } else if (earningsData?.earnings) {
      setEarnings(earningsData.earnings);
      console.log("Earnings data:", earningsData.earnings);
    }
  } catch (err) {
    console.warn("Failed to fetch earnings:", err);
  }

  /* -----------------------------
     NEWS
  ----------------------------- */
  try {
    const newsRes = await fetch("/api/teslite-ai/live/tesla-news", {
      cache: "no-store",
    });
    const newsData = await newsRes.json();

    if (newsRes.status === 429 || newsData.error) {
      console.warn("News API rate limit reached, keeping previous headline.");
    } else if (newsData?.news?.length) {
      setHeadline(newsData.news[0].title);
      console.log("News headline:", newsData.news[0].title);
    }
  } catch (err) {
    console.warn("Failed to fetch news:", err);
  }

  setLastUpdated(new Date().toLocaleTimeString());
  setLoading(false);
};



  /* -----------------------------
     INITIAL LOAD
  ----------------------------- */
  useEffect(() => {
  fetchAll();
  const interval = setInterval(fetchAll, 60_000); // 60 seconds
  return () => clearInterval(interval);
}, []);


  /* -----------------------------
     DERIVED VALUES
  ----------------------------- */
  const latest = candles[candles.length - 1];
  const previous = candles[candles.length - 2] ?? latest;

  const percentMove = useMemo(() => {
    if (!latest || !previous) return 0;
    return ((latest.close - previous.close) / previous.close) * 100;
  }, [latest, previous]);

  const isBreakingAlert = Boolean(headline) && Math.abs(percentMove) >= 3;

  /* -----------------------------
   TECHNICAL INSIGHT (DETERMINISTIC)
----------------------------- */

  const ma20 = useMemo(() => {
    if (candles.length < 20) return null;
    const slice = candles.slice(-20);
    return (
      slice.reduce((sum, c) => sum + c.close, 0) / slice.length
    );
  }, [candles]);

  const ma50 = useMemo(() => {
    if (candles.length < 50) return null;
    const slice = candles.slice(-50);
    return slice.reduce((sum, c) => sum + c.close, 0) / slice.length;
  }, [candles]);

  // Determine if there’s a crossover
  let maCrossoverMessage = "";
  if (ma20 && ma50) {
    const prevMa20 = candles.length >= 21 ? candles.slice(-21, -1).reduce((sum, c) => sum + c.close, 0) / 20 : null;
    if (prevMa20) {
      if (prevMa20 < ma50 && ma20 > ma50) {
        maCrossoverMessage = "Bullish crossover forming — potential upside";
      } else if (prevMa20 > ma50 && ma20 < ma50) {
        maCrossoverMessage = "Bearish crossover forming — potential weakness";
      } else {
        maCrossoverMessage = "No significant crossover";
      }
    }
  }

  const rsi14 = useMemo(() => {
    if (candles.length < 15) return null;

    let gains = 0;
    let losses = 0;

    for (let i = candles.length - 14; i < candles.length; i++) {
      const diff = candles[i].close - candles[i - 1].close;
      if (diff > 0) gains += diff;
      else losses += Math.abs(diff);
    }

    if (losses === 0) return 100;

    const rs = gains / losses;
    return 100 - 100 / (1 + rs);
  }, [candles]);

  const maCrossoverSignal = useMemo(() => {
    if (!ma20 || !ma50 || candles.length < 51) return null;

    const prev20 =
      candles
        .slice(-21, -1)
        .reduce((sum, c) => sum + c.close, 0) / 20;

    const prev50 =
      candles
        .slice(-51, -1)
        .reduce((sum, c) => sum + c.close, 0) / 50;

    if (prev20 <= prev50 && ma20 > ma50) {
      return "BULLISH";
    }

    if (prev20 >= prev50 && ma20 < ma50) {
      return "BEARISH";
    }

    return null;
  }, [candles, ma20, ma50]);

  // Keep `rsi` variable for compatibility with existing labels / UI
  const rsi = rsi14;

  

  const technicalInsight = useMemo(() => {
    if (!latest) return "Technical data unavailable.";

    const insights: string[] = [];

    if (ma20) {
      if (latest.close > ma20) {
        insights.push(
          "Price is trading above the 20-day moving average, indicating short-term bullish momentum."
        );
      } else {
        insights.push(
          "Price is trading below the 20-day moving average, suggesting short-term weakness."
        );
      }
    } else {
      insights.push(
        "Insufficient historical data to compute the 20-day moving average."
      );
    }

    if (typeof rsi14 === "number") {
      if (rsi14 < 30) {
        insights.push(
          "RSI indicates oversold conditions, which may signal a potential short-term rebound."
        );
      } else if (rsi14 > 70) {
        insights.push(
          "RSI indicates overbought conditions, increasing the risk of a pullback."
        );
      } else {
        insights.push(
          "RSI is in a neutral range, indicating balanced momentum."
        );
      }
    } else {
      insights.push("RSI data unavailable due to insufficient price history.");
    }

    if (maCrossoverSignal === "BULLISH") {
      insights.push(
        "A bullish moving-average crossover has occurred, with the 20-day MA crossing above the 50-day MA, often interpreted as a positive momentum shift."
      );
    }

    if (maCrossoverSignal === "BEARISH") {
      insights.push(
        "A bearish moving-average crossover has occurred, with the 20-day MA crossing below the 50-day MA, signaling potential downside momentum."
      );
    }

    return insights.join(" ");
  }, [latest, ma20, rsi14, maCrossoverSignal]);

  const aiNarrative = useMemo(() => {
    if (!latest || !ma20 || !ma50 || rsi === null) return null;

    const trend =
      ma20 > ma50 ? "bullish" : ma20 < ma50 ? "bearish" : "neutral";

    const momentum =
      rsi < 30
        ? "oversold"
        : rsi > 70
        ? "overbought"
        : "neutral";

    let narrative = `Tesla is currently in a ${trend} technical posture. `;

    if (maCrossoverSignal === "BULLISH") {
      narrative +=
        "A bullish moving-average crossover suggests strengthening upside momentum. ";
    }

    if (maCrossoverSignal === "BEARISH") {
      narrative +=
        "A bearish moving-average crossover indicates increasing downside risk. ";
    }

    if (momentum === "oversold") {
      narrative +=
        "RSI indicates oversold conditions, which historically can precede short-term rebounds. ";
    }

    if (momentum === "overbought") {
      narrative +=
        "RSI is in overbought territory, increasing the likelihood of a pullback. ";
    }

    if (momentum === "neutral") {
      narrative +=
        "Momentum indicators remain neutral, suggesting consolidation rather than a decisive move. ";
    }

    return narrative.trim();
  }, [latest, ma20, ma50, rsi, maCrossoverSignal]);

  const maCrossover = useMemo(() => {
    if (ma20 === null || ma50 === null) return null;

    if (ma20 > ma50) return "Bullish";
    if (ma20 < ma50) return "Bearish";
    return "Neutral";
  }, [ma20, ma50]);

  const rsiLabel =
    rsi === null
      ? "Unavailable"
      : rsi > 70
      ? "Overbought"
      : rsi < 30
      ? "Oversold"
      : "Neutral";

  /* -----------------------------
   AI TECHNICAL INTERPRETATION
  ----------------------------- */

  let technicalSummary = "Technical indicators are stabilizing.";

  if (ma20 && ma50 && rsi !== null) {
    const trend =
      ma20 > ma50
        ? "short-term bullish"
        : ma20 < ma50
        ? "short-term bearish"
        : "neutral";

    const momentum =
      rsi > 70
        ? "overbought"
        : rsi < 30
        ? "oversold"
        : "balanced";

    technicalSummary = `Tesla is currently showing a ${trend} structure. 
  The 20-day moving average is ${
      ma20 > ma50 ? "above" : "below"
    } the 50-day average, indicating ${
      ma20 > ma50 ? "near-term strength" : "near-term weakness"
    }. 
  RSI is at ${rsi.toFixed(
      1
    )}, suggesting ${momentum} momentum. 
  Overall conditions remain ${
      momentum === "balanced" ? "stable" : "technically stretched"
    }.`;
  }

  // Earnings verdict (for scenario engine)
  const earningsVerdict: "Beat" | "Miss" | "Mixed" = (() => {
    if (!earnings) return "Mixed";
    if (earnings.actualEPS != null && earnings.expectedEPS != null) {
      if (earnings.actualEPS > earnings.expectedEPS) return "Beat";
      if (earnings.actualEPS < earnings.expectedEPS) return "Miss";
      return "Mixed";
    }

    // Fallback to percent move if EPS not provided
    if (percentMove >= 2) return "Beat";
    if (percentMove <= -2) return "Miss";
    return "Mixed";
  })();

  // Technical bias (coarse classification)
  const technicalBias: "Bullish" | "Moderately Bullish" | "Neutral" | "Bearish" = (() => {
    if (!ma20 || !ma50 || rsi === null) return "Neutral";
    if (ma20 > ma50 && rsi < 70) return "Bullish";
    if (ma20 > ma50) return "Moderately Bullish";
    if (ma20 < ma50 && rsi > 70) return "Bearish";
    return "Neutral";
  })();

  const priceAboveMA50 = ma50 ? latest.close > ma50 : false;

  const confidenceScore: number | null =
    rsi !== null
      ? calculateConfidenceScore({
          earningsVerdict,
          technicalBias,
          rsi,
          intelligenceConfidence: "Medium",



        })
      : null;

  const confidenceLabel =
    confidenceScore !== null ? getConfidenceLabel(confidenceScore) : "Unavailable";

  useEffect(() => {
    if (confidenceScore === null) return;
    const updated = updateConfidenceTrend(confidenceScore);
    setConfidenceHistory(updated);
  }, [confidenceScore]);

  const confidenceDirection = getTrendDirection(confidenceHistory);

  const { bullActive, bearActive } = generateScenarios({
    earningsVerdict,
    technicalBias,
    rsi: rsi ?? 50,
    priceAboveMA50,
  });

  const bullCaseText = () => {
    if (bullActive) {
      return `Bull case: Earnings and technicals align (${earningsVerdict}, ${technicalBias}). Price is ${
        priceAboveMA50 ? "above" : "below"
      } the 50-day MA.`;
    }
    return "Bull case inactive based on current signals.";
  };

  const bearCaseText = () => {
    if (bearActive) {
      return `Bear case: Downside risks present (${earningsVerdict}, ${technicalBias}). Monitor RSI (${rsi?.toFixed(1) ?? "—"}).`;
    }

    return "Bear case inactive based on current signals.";
  };
  /* -----------------------------
     STOCK–NEWS CAUSAL INTELLIGENCE
  ----------------------------- */

// Helper functions
function mapCrossover(signal?: string): "bullish" | "bearish" | "none" {
  if (!signal) return "none";

  switch (signal.toLowerCase()) {
    case "bullish":
      return "bullish";
    case "bearish":
      return "bearish";
    default:
      return "none";
  }
}

function mapEarningsVerdict(verdict?: string): "beat" | "miss" | "inline" | "unknown" {
  switch (verdict?.toLowerCase()) {
    case "beat":
      return "beat";
    case "miss":
      return "miss";
    case "inline":
      return "inline";
    default:
      return "unknown";
  }
}

// Memoized causal payload to prevent unnecessary re-fetches
const causalPayload: StockCausalRequest = useMemo(() => ({
  price: {
    current: latest?.close ?? 0,
    changePercent: percentMove ?? 0,
    intradayDirection:
      percentMove > 0 ? "up" : percentMove < 0 ? "down" : "flat",
  },
  technicals: {
    ma20: ma20 ?? undefined,
    ma50: ma50 ?? undefined,
    rsi14: rsi ?? undefined,
    crossover: mapCrossover(maCrossoverSignal ?? undefined),
  },
  earnings: {
    lastEarningsDate: earnings?.fiscalDate,
    revenue: earnings?.revenue ?? undefined,
    eps: earnings?.eps ?? undefined,
    beatOrMiss: mapEarningsVerdict(earningsVerdict),
  },
  news: {
    headlines: headline ? [headline] : [],
  },
  marketContext: {
    summary: technicalSummary,
  },
}), [latest?.close, percentMove, ma20, ma50, rsi, maCrossoverSignal, earnings?.fiscalDate, earnings?.revenue, earnings?.eps, earningsVerdict, headline, technicalSummary]);

  const {
    data: causalData,
    loading: causalLoading,
    error: causalError,
  } = useTeslaStockCausalIntelligence({
    payload: causalPayload,
    refreshInterval: 30_000,
  });

  /* -----------------------------
     PERSIST ALERT
  ----------------------------- */
  useEffect(() => {
    if (!isBreakingAlert || !headline) return;

    const persistAlert = async () => {
      try {
        await fetch("/api/teslite-ai/alerts/persist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            headline,
            percentMove,
            confidence: "High",
          }),
        });
      } catch {
        // Silent fail
      }
    };

    persistAlert();
  }, [isBreakingAlert, headline, percentMove]);

  /* -----------------------------
     GUARDS
  ----------------------------- */
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        Loading Tesla stock data…
      </div>
    );
  }

  if (!loading && (!candles.length || !latest)) {
  return (
    <div className="p-6 text-center text-gray-400">
      Tesla stock data unavailable (API may be rate-limited). Retrying…
    </div>
  );
}

  const maxPrice = Math.max(...candles.map(c => c.high));
  const minPrice = Math.min(...candles.map(c => c.low));
  const scaleY = (price: number) =>
    280 - ((price - minPrice) / (maxPrice - minPrice)) * 260;

  const buildMAPoints = (period: number) => {
    if (candles.length < period) return [];

    return candles
      .map((_, index) => {
        if (index < period - 1) return null;

        const slice = candles.slice(index - period + 1, index + 1);
        const avg = slice.reduce((sum, c) => sum + c.close, 0) / period;

        return {
          x: index * (1000 / candles.length),
          y: scaleY(avg),
        };
      })
      .filter(Boolean) as { x: number; y: number }[];
  };

  const ma20Points = buildMAPoints(20);
  const ma50Points = buildMAPoints(50);

  const getLastCrossover = () => {
    if (ma20Points.length < 2 || ma50Points.length < 2) return null;

    const len = Math.min(ma20Points.length, ma50Points.length);

    const prevDiff = ma20Points[len - 2].y - ma50Points[len - 2].y;
    const currDiff = ma20Points[len - 1].y - ma50Points[len - 1].y;

    if (prevDiff <= 0 && currDiff > 0) {
      return {
        type: "bullish",
        label: "Bullish MA Crossover",
        confidence: "Positive momentum forming",
      };
    }

    if (prevDiff >= 0 && currDiff < 0) {
      return {
        type: "bearish",
        label: "Bearish MA Crossover",
        confidence: "Downward momentum increasing",
      };
    }

    return {
      type: "neutral",
      label: "No Recent Crossover",
      confidence: "Trend continuation",
    };
  };

  const maSignal = getLastCrossover();

  const crossoverPoints = candles
    .map((candle, index) => {
      if (index < 50) return null; // need enough data for MA50

      const ma20Prev =
        candles
          .slice(index - 20, index)
          .reduce((sum, c) => sum + c.close, 0) / 20;
      const ma50Prev =
        candles
          .slice(index - 50, index)
          .reduce((sum, c) => sum + c.close, 0) / 50;

      const ma20Curr =
        candles.slice(index - 19, index + 1).reduce((sum, c) => sum + c.close, 0) / 20;
      const ma50Curr =
        candles.slice(index - 49, index + 1).reduce((sum, c) => sum + c.close, 0) / 50;

      if (ma20Prev < ma50Prev && ma20Curr > ma50Curr) {
        return { index, type: "bullish" };
      } else if (ma20Prev > ma50Prev && ma20Curr < ma50Curr) {
        return { index, type: "bearish" };
      }
      return null;
    })
    .filter(Boolean) as { index: number; type: "bullish" | "bearish" }[];

  /* -----------------------------
     RENDER
  ----------------------------- */
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold">Tesla Stock (TSLA)</h1>
        <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400 border border-green-500/30">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live updating (30s)
        </span>
        {process.env.NODE_ENV === "development" ? null : <TeslaLive />}



      </div>

      <p className="mb-3 text-xs text-gray-400">
        Last update: {lastUpdated || "—"}
      </p>

      <TeslaAISummary
        latestClose={latest.close}
        previousClose={previous.close}
        hasEarnings={Boolean(earnings)}
        headline={headline ?? undefined}
      />
      {/* ======================
          Tesla Live Panel
      ====================== */}
      <div className="mt-4 mb-6">
        <TeslaLivePanel candles={candles} latest={latest} />
      </div>
      {isBreakingAlert && (
        <div className="mt-4 mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4">
          <p className="text-sm text-gray-200 mb-1">{headline}</p>
          <p className="text-xs text-gray-400">
            Price moved {percentMove.toFixed(2)}%
          </p>
        </div>
      )}

      {/* PRICE SUMMARY */}
      <div className="mb-6 text-gray-300">
        <span className="mr-4">
          Close: <strong>${latest.close.toFixed(2)}</strong>
        </span>
        <span className="mr-4">
          High: <strong>${latest.high.toFixed(2)}</strong>
        </span>
        <span>
          Low: <strong>${latest.low.toFixed(2)}</strong>
        </span>
      </div>

      {/* TECHNICAL INDICATORS */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* MA 20 */}
        <div className="rounded-lg border border-gray-800 bg-black p-4">
          <p className="text-sm text-gray-400 mb-1">MA (20)</p>
          <p className="text-2xl font-semibold">
            {ma20 !== null ? `$${ma20.toFixed(2)}` : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Short-term trend
          </p>
        </div>

        {/* MA Crossover */}
        <div className="rounded-lg border border-gray-800 bg-black p-4">
          <p className="text-sm text-gray-400 mb-1">MA Crossover</p>

          {maCrossover ? (
            <p
              className={`text-2xl font-semibold ${
                maCrossover === "Bullish"
                  ? "text-green-400"
                  : maCrossover === "Bearish"
                  ? "text-red-400"
                  : "text-yellow-400"
              }`}
            >
              {maCrossover}
            </p>
          ) : (
            <p className="text-gray-500">—</p>
          )}

          <p className="text-xs text-gray-500 mt-1">
            MA(20) vs MA(50)
          </p>
        </div>

        {/* RSI */}
        <div className="rounded-lg border border-gray-800 bg-black p-4">
          <p className="text-sm text-gray-400 mb-1">RSI (14)</p>
          <p className="text-2xl font-semibold">
            {rsi !== null ? rsi.toFixed(1) : "—"}
          </p>
          <p
            className={`text-xs mt-1 ${
              rsiLabel === "Overbought"
                ? "text-red-400"
                : rsiLabel === "Oversold"
                ? "text-green-400"
                : "text-yellow-400"
            }`}
          >
            {rsiLabel}
          </p>
        </div>
      </div>

      <ScenarioCards
        bullActive={bullActive}
        bearActive={bearActive}
        bullText={bullCaseText()}
        bearText={bearCaseText()}
      />

      {confidenceScore !== null && (
        <AIConfidenceCard
          score={confidenceScore}
          label={confidenceLabel}
        />
      )}

      

      <div className="bg-black border border-gray-800 rounded-lg p-5 mb-8">
        <h2 className="text-lg font-semibold mb-2 text-white">
          Technical Insight
        </h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          {technicalInsight}
        </p>
      </div>

      {/* -----------------------------
           AI MARKET INTERPRETATION
      ------------------------------ */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-yellow-400 mb-2">
          AI Market Interpretation
        </h2>
        <p className="text-gray-300 text-sm leading-relaxed">
          {latest && ma20 && rsi !== null
            ? `Short-term price action shows ${
                latest.close < ma20 ? "weakness below the 20-day MA" : "strength above the 20-day MA"
              }. The 50-day MA is ${
                ma50 ? `$${ma50.toFixed(2)}` : "not yet computed"
              }, and RSI (${rsi.toFixed(1)}) indicates ${
                rsi < 30
                  ? "oversold conditions"
                  : rsi > 70
                  ? "overbought conditions"
                  : "neutral momentum"
              }. ${maCrossoverMessage}. Overall, this suggests ${
                latest.close < ma20 && rsi > 30
                  ? "consolidation rather than a breakdown"
                  : latest.close > ma20 && rsi < 70
                  ? "potential upside continuation"
                  : "balanced market conditions"
              }.`
            : "Technical data unavailable for AI interpretation."}
        </p>
      </div>

      {/* PRICE CHART */}
      <div className="bg-black rounded-lg p-4 border border-gray-800 mb-8">
        <svg viewBox="0 0 1000 300" className="w-full h-64">

          {/* PRICE LINE */}
          {candles.map((candle, index) => {
            if (index === 0) return null;
            const prev = candles[index - 1];
            const x1 = (index - 1) * (1000 / candles.length);
            const x2 = index * (1000 / candles.length);

            return (
              <line
                key={`price-${index}`}
                x1={x1}
                y1={scaleY(prev.close)}
                x2={x2}
                y2={scaleY(candle.close)}
                stroke={candle.extended ? "#6366f1" : "#22c55e"}
                strokeWidth={candle.extended ? 1 : 2}
                strokeDasharray={candle.extended ? "4,2" : undefined}
              />
            );
          })}

          {/* MA 20 */}
          {ma20Points.map((point, index) => {
            if (index === 0) return null;
            const prev = ma20Points[index - 1];

            return (
              <line
                key={`ma20-${index}`}
                x1={prev.x}
                y1={prev.y}
                x2={point.x}
                y2={point.y}
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            );
          })}

          {/* MA 50 */}
          {ma50Points.map((point, index) => {
            if (index === 0) return null;
            const prev = ma50Points[index - 1];

            return (
              <line
                key={`ma50-${index}`}
                x1={prev.x}
                y1={prev.y}
                x2={point.x}
                y2={point.y}
                stroke="#f59e0b"
                strokeWidth="2"
              />
            );
          })}

          {/* Crossover markers */}
          {crossoverPoints.map((point, i) => {
            const x = point.index * (1000 / candles.length);
            const y = scaleY(candles[point.index].close);

            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={5}
                  fill={point.type === "bullish" ? "#22c55e" : "#ef4444"}
                  stroke="#ffffff"
                  strokeWidth={1}
                  onMouseEnter={() =>
                    setHoveredCrossover({ x, y, type: point.type })
                  }
                  onMouseLeave={() => setHoveredCrossover(null)}
                />
              </g>
            );
          })}

          {hoveredCrossover && (
            <text
              x={hoveredCrossover.x + 10}
              y={hoveredCrossover.y - 10}
              fill="#fff"
              fontSize="12"
              fontWeight="bold"
              pointerEvents="none"
            >
              {hoveredCrossover.type === "bullish"
                ? "Bullish MA20/50 Crossover"
                : "Bearish MA20/50 Crossover"}
            </text>
          )}
        </svg>

        <div className="flex gap-4 text-xs text-gray-400 mt-2">
          <span className="flex items-center gap-1">
            <span className="h-1 w-4 bg-green-500 inline-block" /> Price
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1 w-4 bg-blue-500 inline-block" /> MA (20)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1 w-4 bg-yellow-500 inline-block" /> MA (50)
          </span>
        </div>

        <div className="flex gap-4 text-gray-400 text-xs mt-2">
          <div className="flex items-center gap-1">
            <span className="h-2 w-4 bg-green-500" />
            Regular Hours
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-4 bg-purple-500" />
            Extended Hours
          </div>
        </div>

        {maSignal && (
          <div
            className={`mt-4 rounded-xl p-4 text-sm border ${
              maSignal.type === "bullish"
                ? "border-green-500/40 bg-green-500/10 text-green-300"
                : maSignal.type === "bearish"
                ? "border-red-500/40 bg-red-500/10 text-red-300"
                : "border-gray-500/30 bg-gray-500/10 text-gray-300"
            }`}
          >
            <p className="font-semibold">{maSignal.label}</p>
            <p className="opacity-80">{maSignal.confidence}</p>
          </div>
        )}
      </div>

      <div className="bg-black border border-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-3">
          Technical Intelligence Summary
        </h2>

        <p className="text-sm text-gray-300 leading-relaxed mb-4">
          {technicalSummary}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-400">
          <div>
            <p>MA (20)</p>
            <p className="font-semibold text-gray-200">
              {ma20 ? `$${ma20.toFixed(2)}` : "—"}
              {maCrossoverSignal && (
                <span className="ml-3 text-xs text-blue-400">
                  MA crossover: {maCrossoverSignal}
                </span>
              )}
            </p>
          </div>

          <div>
            <p>MA (50)</p>
            <p className="font-semibold text-gray-200">
              {ma50 ? `$${ma50.toFixed(2)}` : "—"}
            </p>
          </div>

          <div>
            <p>RSI (14)</p>
            <p className="font-semibold text-gray-200">
              {rsi !== null ? rsi.toFixed(1) : "—"}
            </p>
          </div>
        </div>
      </div>

      {aiNarrative && (
        <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <h3 className="text-sm font-semibold text-blue-400 mb-1">
            AI Market Interpretation
          </h3>
          <p className="text-sm text-gray-200 leading-relaxed">
            {aiNarrative}
          </p>
        </div>
      )}

      <StockCausalIntelligenceCard
  data={causalData}
  loading={causalLoading}
  error={causalError}
/>

      {/* EARNINGS */}
      <div className="bg-black border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Latest Earnings</h2>

        {earnings ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-gray-300">
            {/* Fiscal Date */}
            <div>
              <p className="text-sm text-gray-500">Fiscal Date</p>
              <p className="font-semibold">{earnings.fiscalDate}</p>
            </div>

            {/* Revenue */}
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="font-semibold">
                {typeof earnings.revenue === "number"
                  ? `$${(earnings.revenue / 1_000_000_000).toFixed(2)}B`
                  : "—"}
              </p>
            </div>

            {/* EPS */}
            <div>
              <p className="text-sm text-gray-500">EPS</p>
              <p className="font-semibold">
                {typeof earnings.eps === "number"
                  ? `$${earnings.eps.toFixed(2)}`
                  : "—"}
              </p>

              {/* Earnings Verdict */}
              {earnings.actualEPS != null && earnings.expectedEPS != null && (
                <p className="text-gray-400 mt-2">
                  Verdict: {" "}
                  <strong
                    className={`${
                      earnings.actualEPS! > earnings.expectedEPS!
                        ? "text-green-400"
                        : earnings.actualEPS! < earnings.expectedEPS!
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                  >
                    {earnings.actualEPS! > earnings.expectedEPS!
                      ? "Beat"
                      : earnings.actualEPS! < earnings.expectedEPS!
                      ? "Miss"
                      : "In Line"}
                  </strong>
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-400">Earnings data unavailable</p>
        )}
      </div>
    </div>
  );
}
