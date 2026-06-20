import { OptimusStage } from "@/types/optimus";

export const optimusTrajectory: OptimusStage[] = [
  {
    id: "stage-1",
    title: "Internal Factory Deployment",
    scope: "Tesla Gigafactories",
    status: "active",
    capabilities: [
      "Repetitive task automation",
      "Material handling",
      "Vision-based manipulation"
    ],
    implications: [
      "Labor cost reduction",
      "Throughput stability",
      "Improved safety"
    ]
  },
  {
    id: "stage-2",
    title: "External Industrial Deployment",
    scope: "Select industrial partners",
    status: "emerging",
    capabilities: [
      "Task specialization",
      "Human-robot collaboration",
      "Remote supervision"
    ],
    implications: [
      "New revenue stream",
      "Manufacturing moat expansion",
      "Ecosystem lock-in"
    ]
  },
  {
    id: "stage-3",
    title: "Scaled Labor Abstraction",
    scope: "Broad economic labor market",
    status: "future",
    capabilities: [
      "General-purpose task execution",
      "Self-improvement via fleet learning"
    ],
    implications: [
      "Structural labor displacement",
      "Productivity explosion",
      "Valuation regime shift"
    ]
  }
];
