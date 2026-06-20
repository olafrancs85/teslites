"use client"

import { useEffect, useState, useRef } from "react"
import {
  StockCausalRequest,
  StockCausalResponse,
} from "@/types/stockCausal"

interface HookParams {
  enabled?: boolean
  payload?: StockCausalRequest | null
  refreshInterval?: number // milliseconds (optional)
}

export function useTeslaStockCausalIntelligence({
  enabled = true,
  payload,
  refreshInterval,
}: HookParams) {
  const [data, setData] = useState<StockCausalResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastPayloadRef = useRef<StockCausalRequest | null>(null)
  const isFetchingRef = useRef(false)

  async function fetchCausalIntelligence() {
    if (!payload || !enabled) return
    if (isFetchingRef.current) return // Prevent duplicate requests

    try {
      isFetchingRef.current = true
      setLoading(true)
      setError(null)

      const res = await fetch("/api/stock/causal-intelligence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch causal intelligence")
      }

      const result: StockCausalResponse = await res.json()
      setData(result)
    } catch (err: any) {
      console.error("Causal intelligence hook error:", err)
      setError(err.message || "Unknown error")
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }

  /* ----------------------------
     Initial Fetch (only when payload actually changes)
  -----------------------------*/

  useEffect(() => {
    const payloadChanged = JSON.stringify(lastPayloadRef.current) !== JSON.stringify(payload)
    
    if (payloadChanged && payload) {
      lastPayloadRef.current = payload
      fetchCausalIntelligence()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, enabled])

  /* ----------------------------
     Optional Auto Refresh
  -----------------------------*/

  useEffect(() => {
    if (!refreshInterval || !enabled || !payload) return

    const interval = setInterval(() => {
      fetchCausalIntelligence()
    }, refreshInterval)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, refreshInterval, enabled])

  return {
    data,
    loading,
    error,
    refetch: fetchCausalIntelligence,
  }
}
