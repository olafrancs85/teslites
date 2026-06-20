// types/optimus/OptimusSignalExplainability.ts

export type SignalFactor = {
  name: string
  weight: number        // 0–1
  direction: "positive" | "negative"
  evidence: string
}

export type SignalExplainability = {
  // Optional label/title for display on the app
  label?: string

  summary: string
  dominantFactor: string
  factors: SignalFactor[]
}
