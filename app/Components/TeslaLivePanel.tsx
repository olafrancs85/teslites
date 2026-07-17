"use client";

import TeslaCandlestickChart from "@/components/stock/TeslaCandlestickChart";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MarketMovingType,
  MarketNewsType,
} from "../hooks/useTeslaLiveIntelligence";

/* =============================
   TYPES
============================= */

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type TeslaLivePanelProps = {
  candles?: Candle[];
  latest?: Candle;

  summary: string;
  confidence: "Low" | "Medium" | "High";
  isBreaking: boolean;
  loading: boolean;
  lastUpdated: Date | null;
  marketNews: MarketNewsType[];
  marketMoving: MarketMovingType[];
};

/* =============================
   HELPERS
============================= */

function isMarketNews(
  item: MarketNewsType | MarketMovingType
): item is MarketNewsType & { id: string; link: string } {
  return (
    "id" in item &&
    typeof item.id === "string" &&
    typeof item.link === "string"
  );
}

function calculateMA(candles: Candle[], period: number) {
  if (candles.length < period) return [];

  return candles.map((_, i) => {
    if (i < period - 1) return null;

    const slice = candles.slice(i - period + 1, i + 1);

    const avg =
      slice.reduce((sum, candle) => sum + candle.close, 0) / period;

    return avg;
  });
}

/* =============================
   COMPONENT
============================= */

export default function TeslaLivePanel({
  candles = [],
  latest = {
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    time: 0,
    volume: 0,
  },
  summary,
  confidence,
  isBreaking,
  loading,
  lastUpdated,
  marketNews,
  marketMoving,
}: TeslaLivePanelProps) {
  const [open, setOpen] = useState(true);

  const topNews: (MarketMovingType | MarketNewsType)[] = [
    ...marketMoving,
    ...marketNews,
  ].slice(0, 3);

  /* -----------------------------
     MINI CHART DATA
  ----------------------------- */

  const chartData = useMemo(() => {
    if (!candles.length) return null;

    const width = 320;
    const height = 140;
    const padding = 10;

    const prices = candles.map((candle) => candle.close);

    const max = Math.max(...prices);
    const min = Math.min(...prices);

    const scaleX = (index: number) =>
      padding +
      (index / Math.max(prices.length - 1, 1)) *
        (width - padding * 2);

    const scaleY = (price: number) =>
      height -
      padding -
      ((price - min) / Math.max(max - min, 1)) *
        (height - padding * 2);

    const pricePath = prices
      .map(
        (price, index) =>
          `${index === 0 ? "M" : "L"} ${scaleX(index)} ${scaleY(price)}`
      )
      .join(" ");

    const ma20 = calculateMA(candles, 20);
    const ma50 = calculateMA(candles, 50);

    const buildPath = (ma: (number | null)[]) =>
      ma
        .map((value, index) =>
          value === null
            ? null
            : `${scaleX(index)},${scaleY(value)}`
        )
        .filter(Boolean)
        .join(" L ");

    return {
      width,
      height,
      pricePath,
      ma20Path: buildPath(ma20),
      ma50Path: buildPath(ma50),
    };
  }, [candles]);

  /* -----------------------------
     PRICE
  ----------------------------- */

  const priceChange = latest.close - latest.open;
  const isUp = priceChange >= 0;

  const support = candles.length
    ? Math.min(...candles.map((candle) => candle.low))
    : null;

  const resistance = candles.length
    ? Math.max(...candles.map((candle) => candle.high))
    : null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <div className="bg-black text-white rounded-xl shadow-xl border border-red-600">
        {/* HEADER */}

        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold">
              TESLA LIVE
            </span>

            <span className="text-xs bg-red-600 px-2 py-0.5 rounded">
              LIVE
            </span>
          </div>

          <span className="text-sm">
            {open ? "–" : "+"}
          </span>
        </div>

        {open && (
          <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
            {/* BREAKING */}

            {isBreaking && topNews[0] && (
              <div className="bg-red-700 text-white text-sm px-3 py-2 rounded animate-pulse">
                🚨 {topNews[0].title}
              </div>
            )}

            {/* CHART */}

            {candles.length > 0 && (
              <div className="border border-gray-700 rounded-lg p-2 bg-gray-900">
                <TeslaCandlestickChart
                  candles={candles}
                  support={support}
                  resistance={resistance}
                />
              </div>
            )}

            {/* LATEST PRICE */}

            <div className="text-xs border border-gray-700 rounded-md px-3 py-2 bg-black">
              <span className="text-gray-400">
                Latest price:{" "}
              </span>

              <span
                className={
                  isUp ? "text-green-400" : "text-red-400"
                }
              >
                ${latest.close.toFixed(2)} ({isUp ? "+" : ""}
                {priceChange.toFixed(2)})
              </span>
            </div>

            {/* SUMMARY */}

            <div className="text-sm">
              {loading
                ? "Analyzing Tesla signals…"
                : summary}
            </div>

            {/* CONFIDENCE */}

            <div className="flex justify-between text-xs opacity-80">
              <span>
                Confidence:{" "}
                <strong
                  className={
                    confidence === "High"
                      ? "text-red-400"
                      : confidence === "Medium"
                      ? "text-yellow-400"
                      : "text-orange-400"
                  }
                >
                  {confidence}
                </strong>
              </span>

              {lastUpdated && (
                <span>
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* NEWS */}

            {topNews.length > 0 && (
              <div className="border-t border-gray-700 pt-2 space-y-2">
                {topNews.map((item, index) =>
                  isMarketNews(item) ? (
                    <Link
                      key={item.id}
                      href={`/tesla/news?src=${encodeURIComponent(
                        item.link
                      )}`}
                      className="block text-sm text-blue-400 underline hover:text-blue-300"
                    >
                      • {item.title}
                    </Link>
                  ) : (
                    <div
                      key={index}
                      className="text-sm opacity-80"
                    >
                      • {item.title}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}