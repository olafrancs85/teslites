"use client"

import { StockCausalResponse } from "@/types/stockCausal"

interface Props {
  data: StockCausalResponse | null
  loading?: boolean
  error?: string | null
}

export default function StockCausalIntelligenceCard({
  data,
  loading,
  error,
}: Props) {
  /* ----------------------------
     Loading State
  -----------------------------*/
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
        <div className="h-5 w-56 bg-zinc-700 rounded mb-4" />
        <div className="h-4 w-full bg-zinc-700 rounded mb-2" />
        <div className="h-4 w-5/6 bg-zinc-700 rounded mb-2" />
        <div className="h-4 w-4/6 bg-zinc-700 rounded" />
      </div>
    )
  }

  /* ----------------------------
     Error State
  -----------------------------*/
  if (error) {
    return (
      <div className="bg-zinc-900 border border-red-500/30 rounded-xl p-5">
        <h3 className="text-red-400 font-semibold">
          Causal Intelligence Unavailable
        </h3>
        <p className="text-sm text-zinc-400 mt-2">{error}</p>
      </div>
    )
  }

  /* ----------------------------
     Empty State
  -----------------------------*/
  if (!data) return null

  /* ----------------------------
     Badge Colors
  -----------------------------*/
  const confidenceColor =
    data.confidence === "High"
      ? "text-green-400"
      : data.confidence === "Medium"
      ? "text-yellow-400"
      : "text-zinc-400"

  const modeColor =
    data.mode === "ai"
      ? "bg-purple-500/20 text-purple-300"
      : "bg-zinc-700/40 text-zinc-300"

  /* ----------------------------
     Render Card
  -----------------------------*/

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Stock–News Causal Intelligence
        </h2>

        {data.mode === "ai" && (
          <span
            className={`text-xs px-2 py-1 rounded ${modeColor}`}
          >
            AI
          </span>
        )}
      </div>

      {/* Explanation */}
      <p className="text-zinc-300 text-sm leading-relaxed">
        {data.explanation}
      </p>

      {/* Drivers */}
      {data.primaryDrivers.length > 0 && (
        <div>
          <p className="text-xs uppercase text-zinc-500 mb-2">
            Primary Drivers
          </p>

          <ul className="space-y-1">
            {data.primaryDrivers.map((driver, index) => (
              <li
                key={index}
                className="text-sm text-zinc-300 flex items-start gap-2"
              >
                <span className="text-blue-400">•</span>
                {driver}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className={confidenceColor}>
          Confidence: {data.confidence}
        </span>

        <span className="text-zinc-500">
          Updated: {new Date(data.lastUpdated).toLocaleTimeString()}
        </span>
      </div>
    </div>
  )
}
