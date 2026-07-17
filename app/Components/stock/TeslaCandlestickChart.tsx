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
      height: 520,

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

      timeScale: {
        borderColor: "#374151",
        timeVisible: true,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const ma20Series = chart.addLineSeries({
      color: "#3b82f6",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceScaleId: "right",
    });

    const ma50Series = chart.addLineSeries({
      color: "#f59e0b",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceScaleId: "right",
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "volume",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    const formattedCandles = candles.map((c) => ({
      time: Math.floor(c.time) as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeries.setData(formattedCandles);

    volumeSeries.setData(
      candles.map((c) => ({
        time: Math.floor(c.time) as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "#22c55e" : "#ef4444",
      }))
    );

    const calculateMA = (period: number) => {
      return candles
        .map((_, index) => {
          if (index < period - 1) return null;

          const slice = candles.slice(index - period + 1, index + 1);

          const avg = slice.reduce((sum, c) => sum + c.close, 0) / period;

          return {
            time: Math.floor(candles[index].time) as UTCTimestamp,
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
        time: Math.floor(latest.time) as UTCTimestamp,
        position: "belowBar" as const,
        color: "#22c55e",
        shape: "arrowUp" as const,
        text: `BUY ${ai.confidence}%`,
      });
    }

    if (ai.signal === "SELL") {
      markers.push({
        time: Math.floor(latest.time) as UTCTimestamp,
        position: "aboveBar" as const,
        color: "#ef4444",
        shape: "arrowDown" as const,
        text: `SELL ${ai.confidence}%`,
      });
    }

    candleSeries.setMarkers(markers);

    const handleResize = () => {
      if (!chartRef.current) return;

      chart.applyOptions({
        width: chartRef.current.clientWidth,
      });
    };

    window.addEventListener("resize", handleResize);

    chart.timeScale().fitContent();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [candles, support, resistance]);

  return (
    <div
      ref={chartRef}
      className="w-full h-[520px] rounded-xl overflow-hidden border border-white/10"
    />
  );
}
