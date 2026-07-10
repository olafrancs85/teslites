import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.ALPHAVANTAGE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing ALPHAVANTAGE_API_KEY" },
        { status: 500 }
      );
    }

    const url = `https://www.alphavantage.co/query?function=EARNINGS&symbol=TSLA&apikey=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Tesla earnings" },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (!data.quarterlyEarnings) {
  return NextResponse.json({
    earnings: {
      fiscalDate: "Unavailable",
      eps: null,
      estimatedEps: null,
      surprise: null,
      verdict: "unknown",
    },
  });
}

    const latest = data.quarterlyEarnings[0];

    const reportedEPS = Number(latest.reportedEPS);
    const estimatedEPS = Number(latest.estimatedEPS);

    const surprise =
      !isNaN(reportedEPS) && !isNaN(estimatedEPS)
        ? reportedEPS - estimatedEPS
        : null;

    return NextResponse.json({
      earnings: {
        fiscalDate: latest.fiscalDateEnding,
        eps: isNaN(reportedEPS) ? null : reportedEPS,
        estimatedEps: isNaN(estimatedEPS) ? null : estimatedEPS,
        surprise,
        verdict:
          surprise === null
            ? "unknown"
            : surprise >= 0
            ? "beat"
            : "miss",
      },
    });
  } catch (error) {
    console.error("Tesla Earnings API Error:", error);
    return NextResponse.json(
      { error: "Server error fetching earnings" },
      { status: 500 }
    );
  }
}
