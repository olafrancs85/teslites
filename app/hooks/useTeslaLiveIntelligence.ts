"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ConfidenceLevel = "Low" | "Medium" | "High";

export type AlertType = {
  id: string;
  title: string;
  isBreaking?: boolean;
};

export type MarketNewsType = {
  id: string;
  title: string;
  link?: string;
  impactScore?: number;
};

export type MarketMovingType = {
  title: string;
  link: string;
  impactScore?: number;
};

function safeJsonParse(text: string) {
  if (!text || text.startsWith("<")) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeLink(url?: string) {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return "https://" + url.replace(/^\/+/, "");
}

export function useTeslaLiveIntelligence() {
  const [summary, setSummary] = useState("");
  const [confidence, setConfidence] =
    useState<ConfidenceLevel>("Medium");
  const [isBreaking, setIsBreaking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [marketNews, setMarketNews] = useState<MarketNewsType[]>([]);
  const [marketMoving, setMarketMoving] = useState<MarketMovingType[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isFetchingRef = useRef(false);

  const fetchIntelligence = useCallback(async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      /* ---------------------------------
         AI SUMMARY
      --------------------------------- */

      const summaryRes = await fetch(
        "/api/teslite-ai/live/tesla-ai-summary",
        {
          cache: "no-store",
        }
      );

      const summaryData = safeJsonParse(await summaryRes.text());

      if (summaryData) {
        setSummary(summaryData.summary ?? "");

        if (
          ["High", "Medium", "Low"].includes(
            summaryData.confidence
          )
        ) {
          setConfidence(summaryData.confidence);
        }
      }

      /* ---------------------------------
         TESLA NEWS
      --------------------------------- */

      const newsRes = await fetch(
        "/api/teslite-ai/live/tesla-news",
        {
          cache: "no-store",
        }
      );

      const newsData = safeJsonParse(await newsRes.text());

      let normalizedNews: MarketNewsType[] = [];

      if (newsData?.news && Array.isArray(newsData.news)) {
        normalizedNews = newsData.news.map(
          (n: any, index: number) => ({
            id:
              n.id ??
              n.guid ??
              n.url ??
              `tesla-news-${index}`,
            title: n.title ?? "Tesla News",
            link: normalizeLink(n.url),
            impactScore: n.impactScore ?? 45,
          })
        );

        setMarketNews(normalizedNews);
      } else {
        setMarketNews([]);
      }

      /* ---------------------------------
         ALERTS
      --------------------------------- */

      const breakingFromAlerts = false;

      /* ---------------------------------
         MARKET MOVING
      --------------------------------- */

      const normalizedMarketMoving: MarketMovingType[] = [];
      const breakingFromMarket = false;

      /* ---------------------------------
         BREAKING + CONFIDENCE
      --------------------------------- */

      setIsBreaking(
        breakingFromAlerts || breakingFromMarket
      );

      const newsImpact = normalizedNews.map(
        (n) => n.impactScore ?? 40
      );

      const movingImpact = normalizedMarketMoving.map(
        (m) => m.impactScore ?? 0
      );

      const maxImpact = Math.max(
        0,
        ...newsImpact,
        ...movingImpact
      );

      if (maxImpact >= 70) {
        setConfidence("High");
      } else if (maxImpact >= 40) {
        setConfidence("Medium");
      } else {
        setConfidence("Low");
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        "Tesla Live Intelligence error:",
        error
      );
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchIntelligence();

    const interval = setInterval(
      fetchIntelligence,
      60_000
    );

    return () => {
      clearInterval(interval);
    };
  }, [fetchIntelligence]);

  return {
    summary,
    confidence,
    isBreaking,
    loading,
    alerts,
    marketNews,
    marketMoving,
    lastUpdated,
  };
}