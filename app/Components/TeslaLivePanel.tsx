"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useTeslaLiveIntelligence,
  MarketMovingType,
  MarketNewsType,
} from "../hooks/useTeslaLiveIntelligence";

/* =============================
   TYPES
============================= */
type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
};

type TeslaLivePanelProps = {
  candles: Candle[];
  latest: Candle;
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
    const avg = slice.reduce((s, c) => s + c.close, 0) / period;
    return avg;
  });
}

/* =============================
   COMPONENT
============================= */
export default function TeslaLivePanel({
  candles,
  latest,
}: TeslaLivePanelProps) {
  const [open, setOpen] = useState(true);

  const {
    summary,
    confidence,
    isBreaking,
    loading,
    lastUpdated,
    marketNews,
    marketMoving,
  } = useTeslaLiveIntelligence();

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

    const prices = candles.map(c => c.close);
    const max = Math.max(...prices);
    const min = Math.min(...prices);

    const scaleX = (i: number) =>
      padding + (i / (prices.length - 1)) * (width - padding * 2);

    const scaleY = (p: number) =>
      height -
      padding -
      ((p - min) / (max - min)) * (height - padding * 2);

    const pricePath = prices
      .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(p)}`)
      .join(" ");

    const ma20 = calculateMA(candles, 20);
    const ma50 = calculateMA(candles, 50);

    const buildPath = (ma: (number | null)[]) =>
      ma
        .map((v, i) => (v === null ? null : `${scaleX(i)},${scaleY(v)}`))
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

  /* =============================
     RENDER
  ============================== */
  const priceChange = latest.close - latest.open;
  const isUp = priceChange >= 0;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <div className="bg-black text-white rounded-xl shadow-xl border border-red-600">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold">TESLA LIVE</span>
            <span className="text-xs bg-red-600 px-2 py-0.5 rounded">
              LIVE
            </span>
          </div>
          <span className="text-sm">{open ? "–" : "+"}</span>
        </div>

        {open && (
          <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
            {/* Breaking */}
            {isBreaking && topNews[0] && (
              <div className="bg-red-700 text-white text-sm px-3 py-2 rounded animate-pulse">
                🚨 {topNews[0].title}
              </div>
            )}

            {/* MINI CHART */}
            {chartData && (
              <div className="border border-gray-700 rounded-lg p-2 bg-gray-900">
                <svg width={chartData.width} height={chartData.height}>
                  <path
                    d={chartData.pricePath}
                    stroke="#22c55e"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  {chartData.ma20Path && (
                    <path
                      d={`M ${chartData.ma20Path}`}
                      stroke="#facc15"
                      strokeWidth="1"
                      fill="none"
                    />
                  )}
                  {chartData.ma50Path && (
                    <path
                      d={`M ${chartData.ma50Path}`}
                      stroke="#60a5fa"
                      strokeWidth="1"
                      fill="none"
                    />
                  )}
                </svg>

                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Price</span>
                  <span className="text-yellow-400">MA20</span>
                  <span className="text-blue-400">MA50</span>
                </div>
              </div>
            )}

            {/* LATEST PRICE */}
            <div className="text-xs border border-gray-700 rounded-md px-3 py-2 bg-black">
              <span className="text-gray-400">Latest price: </span>
              <span className={isUp ? "text-green-400" : "text-red-400"}>
                ${latest.close.toFixed(2)} ({isUp ? "+" : ""}
                {priceChange.toFixed(2)})
              </span>
            </div>

            {/* SUMMARY */}
            <div className="text-sm">
              {loading ? "Analyzing Tesla signals…" : summary}
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
                <span>{lastUpdated.toLocaleTimeString()}</span>
              )}
            </div>

            {/* NEWS (INTERNAL ONLY) */}
            {topNews.length > 0 && (
              <div className="border-t border-gray-700 pt-2 space-y-2">
                {topNews.map((item, idx) =>
                  isMarketNews(item) ? (
                    <Link
                      key={item.id}
                      href={`/tesla/news?src=${encodeURIComponent(item.link)}`}

                      className="block text-sm text-blue-400 underline hover:text-blue-300"
                    >
                      • {item.title}
                    </Link>
                  ) : (
                    <div key={idx} className="text-sm opacity-80">
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
