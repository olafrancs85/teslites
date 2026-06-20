"use client";

import { useEffect, useState } from "react";

export interface TeslaRSSItem {
  title: string;
  link: string;
  published: string;
  source: string;
  signalType: "MARKET_MOVING" | "NORMAL";
  impactScore: number;
}

interface UseTeslaRSSResult {
  items: TeslaRSSItem[];
  loading: boolean;
  lastUpdated: string | null;
}

export default function useTeslaRSS(): UseTeslaRSSResult {
  const [items, setItems] = useState<TeslaRSSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchRSS = async () => {
      setLoading(true);

      try {
        const res = await fetch("/api/teslite-ai/rss", {
          cache: "no-store",
        });

        if (!res.ok) {
          console.error("Tesla RSS fetch error: non-OK response", res.status);
          if (mounted) setItems([]);
          return;
        }

        const data = await res.json();

        const rawItems = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.rss?.items)
          ? data.rss.items
          : [];

        const normalized: TeslaRSSItem[] = rawItems.map((item: any) => {
          const signal =
            item.signalType === "MARKET_MOVING" ? "MARKET_MOVING" : "NORMAL";

          const impact =
            typeof item.impactScore === "number" && !Number.isNaN(item.impactScore)
              ? item.impactScore
              : 0;

          return {
            title: item.title || item.titleText || "",
            link: item.link || item.url || "",
            source: item.source || item.feed || "RSS",
            published:
              item.pubDate ||
              item.published ||
              item.publishedAt ||
              item.isoDate ||
              "",
            signalType: signal,
            impactScore: impact,
          };
        });

        // 🔥 Signal surfacing logic for TeslaLivePanel
        // MARKET_MOVING first, then by highest impactScore
        normalized.sort((a, b) => {
          if (a.signalType !== b.signalType) {
            return a.signalType === "MARKET_MOVING" ? -1 : 1;
          }
          return b.impactScore - a.impactScore;
        });

        if (mounted) {
          setItems(normalized);
          setLastUpdated(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error("Tesla RSS fetch error:", err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRSS();
    const interval = setInterval(fetchRSS, 60_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return {
    items,
    loading,
    lastUpdated,
  };
}
