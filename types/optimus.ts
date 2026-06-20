export type OptimusStageStatus = "active" | "emerging" | "future";

export type OptimusStage = {
  id: string;
  title: string;
  scope: string;
  status: OptimusStageStatus;
  capabilities: string[];
  implications: string[];
};

export type SecondOrderEffect = {
  id: string;
  chain: string[];       // causal steps
  impactLevel: "high" | "medium" | "low";
  description: string;
};
