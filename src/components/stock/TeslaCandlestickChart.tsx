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
  const priceChartRef = useRef<HTMLDivElement>(null);
  const volumeChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !priceChartRef.current ||
      !volumeChartRef.current ||
      candles.length === 0
    ) {
      return;
    }

    /*
    =====================================================
    PRICE CHART
    =====================================================
    */

    const priceChart = createChart(priceChartRef.current, {
      width: priceChartRef.current.clientWidth,
      height: 340,

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
          bottom: 0.05,
        },
      },

      timeScale: {
        borderColor: "#374151",
        timeVisible: true,
      },
    });

    const candleSeries = priceChart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const ma20Series = priceChart.addLineSeries({
      color: "#3b82f6",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
    });

    const ma50Series = priceChart.addLineSeries({
      color: "#f59e0b",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
    });

    const chartCandles = candles.map((c) => ({
      time: Math.floor(c.time) as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeries.setData(chartCandles);

    /*
    =====================================================
    MOVING AVERAGES
    =====================================================
    */

    const calculateMA = (period: number) => {
      return candles
        .map((_, index) => {
          if (index < period - 1) return null;

          const slice = candles.slice(index - period + 1, index + 1);

          const average =
            slice.reduce((sum, candle) => sum + candle.close, 0) / period;

          return {
            time: Math.floor(candles[index].time) as UTCTimestamp,
            value: average,
          };
        })
        .filter(Boolean) as {
        time: UTCTimestamp;
        value: number;
      }[];
    };

    ma20Series.setData(calculateMA(20));
    ma50Series.setData(calculateMA(50));

    /*
    =====================================================
    SUPPORT & RESISTANCE
    =====================================================
    */

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

    /*
    =====================================================
    AI TRADE LEVELS
    =====================================================
    */

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

    /*
    =====================================================
    AI SIGNAL MARKER
    =====================================================
    */

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

    /*
    =====================================================
    VOLUME CHART
    =====================================================
    */

    const volumeChart = createChart(volumeChartRef.current, {
      width: volumeChartRef.current.clientWidth,
      height: 110,

      layout: {
        background: { color: "#111827" },
        textColor: "#9ca3af",
      },

      grid: {
        vertLines: { color: "#374151" },
        horzLines: { color: "#374151" },
      },

      rightPriceScale: {
        scaleMargins: {
          top: 0.1,
          bottom: 0.05,
        },
      },

      timeScale: {
        borderColor: "#374151",
        timeVisible: true,
      },
    });

    const volumeSeries = volumeChart.addHistogramSeries({
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    });

    volumeSeries.setData(
      candles.map((c) => ({
        time: Math.floor(c.time) as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "#22c55e" : "#ef4444",
      }))
    );

    /*
    =====================================================
    SYNCHRONIZE BOTH CHARTS
    =====================================================
    */

    let syncing = false;

    priceChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (!range || syncing) return;

      syncing = true;
      volumeChart.timeScale().setVisibleLogicalRange(range);
      syncing = false;
    });

    volumeChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (!range || syncing) return;

      syncing = true;
      priceChart.timeScale().setVisibleLogicalRange(range);
      syncing = false;
    });

    priceChart.timeScale().fitContent();
    volumeChart.timeScale().fitContent();

    /*
    =====================================================
    RESPONSIVE RESIZING
    =====================================================
    */

    const resizeObserver = new ResizeObserver(() => {
      if (priceChartRef.current) {
        priceChart.applyOptions({
          width: priceChartRef.current.clientWidth,
        });
      }

      if (volumeChartRef.current) {
        volumeChart.applyOptions({
          width: volumeChartRef.current.clientWidth,
        });
      }
    });

    resizeObserver.observe(priceChartRef.current);
    resizeObserver.observe(volumeChartRef.current);

    return () => {
      resizeObserver.disconnect();
      priceChart.remove();
      volumeChart.remove();
    };
  }, [candles, support, resistance]);

  return (
    <div className="w-full rounded-xl overflow-hidden border border-white/10">
      {/* PRICE CHART */}
      <div
        ref={priceChartRef}
        className="w-full h-[340px]"
      />

      {/* VOLUME PANEL */}
      <div className="border-t border-white/10">
        <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-gray-500">
          Volume
        </div>

        <div
          ref={volumeChartRef}
          className="w-full h-[110px]"
        />
      </div>
    </div>
  );
}