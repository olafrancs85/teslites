import { NextResponse } from "next/server";

export async function GET() {
  const intelligence = {
    snapshot: {
      sectors: [
        { sector: "EV", momentum: 0.7, volatility: 0.65, capitalFlow: 0.34, innovationVelocity: 0.7, fragility: 0.354, regimeState: "Acceleration", confidence: 0.644 },
        { sector: "Aerospace", momentum: 0.3, volatility: 0.6, capitalFlow: 0.14, innovationVelocity: 0.8, fragility: 0.304, regimeState: "Expansion", confidence: 0.744 }
      ],
      averageMomentum: 0.5,
      averageVolatility: 0.625,
      averageCapitalFlow: 0.24,
      industrialRegime: "Industrial Expansion",
      systemicFragility: 0.329,
      confidence: 0.694
    },
    divergence: {
      divergence: false,
      divergenceScore: 0.5,
      description: "Sectors moving in similar industrial phases"
    },
    narrative: {
      headline: "Industrial Expansion detected across advanced technology sectors",
      summary: "Average momentum across sectors is moderate with low systemic fragility.",
      insights: [
        "Systemic fragility remains contained, suggesting stable expansion conditions.",
        "Elevated volatility suggests rapid technological and market adjustments."
      ]
    }
  };

  return NextResponse.json({ success: true, intelligence });
}