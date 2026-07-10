"use client";

import { useState, useMemo } from "react";
import { useTeslaLiveIntelligence } from "../hooks/useTeslaLiveIntelligence";
import useTeslaRSS from "../hooks/useTeslaRSS";

export default function TeslaLivePanel() {
  const [open, setOpen] = useState(true);
  const { summary, confidence, isBreaking, loading, lastUpdated } =
    useTeslaLiveIntelligence();

  const { items: rssItems, loading: rssLoading } = useTeslaRSS();

  // ✅ Boosted confidence using RSS impactScore
  const boostedConfidence = useMemo(() => {
    if (!confidence) return null;
    const boost =
      rssItems.reduce((acc, item) => acc + (item.signalType === "MARKET_MOVING" ? item.impactScore : 0), 0) || 0;
    const num = Number(confidence) + boost;
    return isNaN(num) ? null : num;
  }, [confidence, rssItems]);

  // ✅ Determine breaking alert only if RSS has MARKET_MOVING
  const rssBreaking = rssItems.some(item => item.signalType === "MARKET_MOVING");
  const finalBreaking = isBreaking && rssBreaking;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <div className="bg-black text-white rounded-xl shadow-xl border border-red-600">
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold">TESLA LIVE</span>
            <span className="text-xs bg-red-600 px-2 py-0.5 rounded">LIVE</span>
          </div>
          <span className="text-sm">{open ? "–" : "+"}</span>
        </div>

        {open && (
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {finalBreaking && (
              <div className="bg-red-700 text-white text-sm px-3 py-2 rounded">
                🚨 Market-Moving Tesla Alert
              </div>
            )}

            <div className="text-sm leading-relaxed">
              {loading
                ? "Analyzing Tesla signals…"
                : summary || "No live signals available."}
            </div>

            <div className="flex items-center justify-between text-xs opacity-80">
              <span>
                Confidence:{" "}
                <strong className="text-red-400">
                  {boostedConfidence !== null ? boostedConfidence.toFixed(2) : "N/A"}
                </strong>
              </span>
              {lastUpdated && <span>Updated {lastUpdated.toLocaleTimeString()}</span>}
            </div>

            {/* RSS Feed */}
            <div className="mt-3 border-t border-gray-700 pt-2 space-y-2">
              {rssLoading ? (
                <div className="text-gray-400 text-xs">Loading news…</div>
              ) : rssItems.length ? (
                rssItems
                  .sort((a, b) =>
                    a.signalType === "MARKET_MOVING" && b.signalType !== "MARKET_MOVING"
                      ? -1
                      : 1
                  )
                  .slice(0, 5)
                  .map((item, i) => (
                    <a
                      key={i}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block text-xs hover:text-red-400 ${
                        item.signalType === "MARKET_MOVING" ? "font-bold" : ""
                      }`}
                    >
                      {item.signalType === "MARKET_MOVING" && "⚡ "}
                      {item.title}
                    </a>
                  ))
              ) : (
                <div className="text-gray-400 text-xs">No news available</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
