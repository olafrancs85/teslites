"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  LineStyle,
  type UTCTimestamp,
} from "lightweight-charts";
import { analyzeTeslaChart } from "@/lib/teslaAiSignalEngine";
type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

interface Props {
  candles: Candle[];
  support: number | null;
  resistance: number | null;
}

export default function TeslaCandlestickChart({
  candles,
  support,
  resistance,
}: Props) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 420,

      layout: {
        background: { color: "#111827" },
        textColor: "#d1d5db",
      },

      grid: {
        vertLines: { color: "#374151" },
        horzLines: { color: "#374151" },
      },

      rightPriceScale: {
        scaleMargins: {
          top: 0.05,
          bottom: 0.25,
        },
      },
    });

    // Candles
    const candleSeries = chart.addCandlestickSeries();

    // Volume
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "volume",
    });

    // Moving averages
    const ma20Series = chart.addLineSeries({
      color: "#3b82f6",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
    });

    const ma50Series = chart.addLineSeries({
      color: "#f59e0b",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
    });

    // Candles
    candleSeries.setData(
      candles.map((c) => ({
        time: Math.floor(c.time / 1000) as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    // Volume
    volumeSeries.setData(
      candles.map((c) => ({
        time: Math.floor(c.time / 1000) as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "#22c55e" : "#ef4444",
      }))
    );

    // -------- Moving Average Helper --------

    const calculateMA = (period: number) => {
      return candles
        .map((_, index) => {
          if (index < period - 1) return null;

          const slice = candles.slice(index - period + 1, index + 1);

          const avg =
            slice.reduce((sum, c) => sum + c.close, 0) / period;

          return {
            time: Math.floor(candles[index].time / 1000) as UTCTimestamp,
            value: avg,
          };
        })
        .filter(Boolean) as {
        time: UTCTimestamp;
        value: number;
      }[];
    };

    ma20Series.setData(calculateMA(20));
    ma50Series.setData(calculateMA(50));

    // Support
    if (support !== null) {
      candleSeries.createPriceLine({
        price: support,
        color: "#22c55e",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "Support",
      });
    }

    // Resistance
    if (resistance !== null) {
      candleSeries.createPriceLine({
        price: resistance,
        color: "#ef4444",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "Resistance",
      });
    }

   const ai = analyzeTeslaChart(candles);
   console.log(ai);

   // AI Trade Levels
if (ai.entry !== null) {
  candleSeries.createPriceLine({
    price: ai.entry,
    color: "#3b82f6",
    lineWidth: 2,
    lineStyle: LineStyle.Solid,
    axisLabelVisible: true,
    title: "Entry",
  });
}

if (ai.stopLoss !== null) {
  candleSeries.createPriceLine({
    price: ai.stopLoss,
    color: "#ef4444",
    lineWidth: 2,
    lineStyle: LineStyle.Dashed,
    axisLabelVisible: true,
    title: "Stop",
  });
}

if (ai.takeProfit !== null) {
  candleSeries.createPriceLine({
    price: ai.takeProfit,
    color: "#22c55e",
    lineWidth: 2,
    lineStyle: LineStyle.Dashed,
    axisLabelVisible: true,
    title: "Target",
  });
}

const latest = candles[candles.length - 1];

const markers = [];

if (ai.signal === "BUY") {
  markers.push({
    time: Math.floor(latest.time / 1000) as UTCTimestamp,
    position: "belowBar" as const,
    color: "#22c55e",
    shape: "arrowUp" as const,
    text: `BUY ${ai.confidence}%`,
  });
}

if (ai.signal === "SELL") {
  markers.push({
    time: Math.floor(latest.time / 1000) as UTCTimestamp,
    position: "aboveBar" as const,
    color: "#ef4444",
    shape: "arrowDown" as const,
    text: `SELL ${ai.confidence}%`,
  });
}

candleSeries.setMarkers(markers);

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [candles, support, resistance]);

  return (
  <div
    ref={chartRef}
    className="w-full h-[420px]"
  />
);
}