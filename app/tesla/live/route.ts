import { NextResponse } from "next/server";

// Dummy / live market-moving data
// In production, replace this with real API / AI integration
export async function GET() {
  try {
    const marketMoving = [
      {
        title: "Tesla deliveries beat expectations",
        link: "https://www.reuters.com/business/autos-transportation/tesla-deliveries-beat-expectations-2026-01-10/",
        impactScore: 85,
      },
      {
        title: "Analysts raise Tesla price targets",
        link: "https://www.cnbc.com/2026/01/11/analysts-raise-tesla-price-targets.html",
        impactScore: 70,
      },
      {
        title: "Tesla stock shows steady growth",
        link: "https://www.bloomberg.com/news/articles/2026-01-12/tesla-stock-steady-growth",
        impactScore: 60,
      },
      {
        title: "Elon Musk announces new EV initiative",
        link: "https://techcrunch.com/2026/01/11/elon-musk-new-ev-initiative/",
        impactScore: 75,
      },
      {
        title: "Tesla expands Supercharger network in Europe",
        link: "https://insideevs.com/news/618547/tesla-expands-supercharger-europe/",
        impactScore: 55,
      },
    ];

    return NextResponse.json({ marketMoving, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Tesla Live API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Tesla live market-moving data" },
      { status: 500 }
    );
  }
}
