"use client";

import { useEffect, useState } from "react";

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
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return "https://" + url.replace(/^\/+/, "");
}

export function useTeslaLiveIntelligence() {
  const [summary, setSummary] = useState("");
  const [confidence, setConfidence] = useState<ConfidenceLevel>("Medium");
  const [isBreaking, setIsBreaking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [marketNews, setMarketNews] = useState<MarketNewsType[]>([]);
  const [marketMoving, setMarketMoving] = useState<MarketMovingType[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchIntelligence = async () => {
    try {
      setLoading(true);

      /* ---------- AI Summary ---------- */
      const summaryRes = await fetch("/api/teslite-ai/live/tesla-ai-summary", { cache: "no-store" });
      const summaryData = safeJsonParse(await summaryRes.text());

      if (summaryData) {
        setSummary(summaryData.summary ?? "");
        if (["High", "Medium", "Low"].includes(summaryData.confidence)) {
          setConfidence(summaryData.confidence);
        }
      }

      /* ---------- Tesla News ---------- */
      const newsRes = await fetch("/api/teslite-ai/live/tesla-news", { cache: "no-store" });
      const newsData = safeJsonParse(await newsRes.text());

      // ✅ declare outside the if block so we can use later
      let rewrittenNews: MarketNewsType[] = [];

      if (newsData?.news) {
        rewrittenNews = await Promise.all(
          newsData.news.map(async (n: any) => {
            const res = await fetch("/api/tesla/news/store", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: n.title,
                source: n.source,
                publishedAt: n.publishedAt,
                originalUrl: n.url,
                summary: n.description || "",
                rewritten: n.aiSummary || n.description || "",
              }),
            });

            const { id } = await res.json();

            return {
              id,
              title: n.title,
              link: normalizeLink(n.url),
              impactScore: n.impactScore ?? 45,
            };
          })
        );

        setMarketNews(rewrittenNews);
      }

      /* ---------- Alerts ---------- */
      const alertsRes = await fetch("/api/teslite-ai/alerts/recent", { cache: "no-store" });
      const alertsData = safeJsonParse(await alertsRes.text());

      let breakingFromAlerts = false;

      if (alertsData?.alerts) {
        setAlerts(alertsData.alerts);
        breakingFromAlerts = alertsData.alerts.some((a: AlertType) => a.isBreaking);
      }

      /* ---------- Market-Moving ---------- */
      const liveRes = await fetch("/api/tesla/live", { cache: "no-store" });
      const liveData = safeJsonParse(await liveRes.text());

      let breakingFromMarket = false;
      let normalized: MarketMovingType[] = [];

      if (liveData?.marketMoving) {
        normalized = liveData.marketMoving.map((m: MarketMovingType) => {
          const impact = m.impactScore ?? 50;
          if (impact >= 70) breakingFromMarket = true;

          return {
            title: m.title,
            link: normalizeLink(m.link),
            impactScore: impact,
          };
        });

        setMarketMoving(normalized);
      }

      /* ---------- Breaking + Confidence ---------- */
      setIsBreaking(breakingFromAlerts || breakingFromMarket);

      // compute maxImpact from fresh data arrays
      const newsImpact = rewrittenNews.map(n => n.impactScore ?? 40);
      const movingImpact = normalized.map(m => m.impactScore ?? 0);
      const maxImpact = Math.max(0, ...newsImpact, ...movingImpact);

      if (maxImpact >= 70) setConfidence("High");
      else if (maxImpact >= 40) setConfidence("Medium");
      else setConfidence("Low");

      setLastUpdated(new Date());
    } catch (e) {
      console.error("Tesla Live error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
    const t = setInterval(fetchIntelligence, 30000);
    return () => clearInterval(t);
  }, []);

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
