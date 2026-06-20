export type SignalExplainability = {
  summary: string;
  details?: string[];
};

export type SignalEvolutionProfile = {
  narrativeTemplate: string;
  confidence?: "low" | "medium" | "high"; // default to "medium" if missing
  date?: string;
};

export type Domain = {
  id: string;
  name: string;
  insights?: unknown[];
  signalEvolution?: SignalEvolutionProfile[];
};