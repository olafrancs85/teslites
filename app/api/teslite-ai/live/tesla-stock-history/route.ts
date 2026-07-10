import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export async function GET() {
  try {
    const result: any = await yahooFinance.chart("TSLA", {
      period1: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      period2: new Date(),
      interval: "1d",
    });

    if (!result.quotes || result.quotes.length === 0) {
      return NextResponse.json(
        { error: "No historical data available" },
        { status: 404 }
      );
    }

    const candles = result.quotes
      .filter(
  (q: any) =>
    q.open != null &&
    q.high != null &&
    q.low != null &&
    q.close != null
)
.map((q: any) => ({
        time: new Date(q.date!).getTime(),
        open: q.open!,
        high: q.high!,
        low: q.low!,
        close: q.close!,
        volume: q.volume ?? 0,
      }));

    return NextResponse.json({ candles });
  } catch (error) {
    console.error("Yahoo Finance Error:", error);

return NextResponse.json(
  {
    error: "Failed to fetch Tesla stock history",
    details: error instanceof Error ? error.message : String(error),
  },
  { status: 500 }
);
  }
}