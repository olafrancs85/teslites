import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

type Timeframe = "1D" | "1W" | "1M";

function getChartConfig(timeframe: Timeframe) {
  const now = new Date();

  switch (timeframe) {
    case "1D":
      return {
        period1: new Date(
          now.getTime() - 90 * 24 * 60 * 60 * 1000
        ),
        period2: now,
        interval: "1d" as const,
      };

    case "1W":
      return {
        period1: new Date(
          now.getTime() - 365 * 24 * 60 * 60 * 1000
        ),
        period2: now,
        interval: "1wk" as const,
      };

    case "1M":
      return {
        period1: new Date(
          now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000
        ),
        period2: now,
        interval: "1mo" as const,
      };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const requestId =
    searchParams.get("requestId") ?? "none";

  const requestedTimeframe =
    searchParams.get("timeframe") ?? "1D";

  const timeframe: Timeframe =
    requestedTimeframe === "1W"
      ? "1W"
      : requestedTimeframe === "1M"
      ? "1M"
      : "1D";

  console.log(
    "STOCK HISTORY API CALLED",
    requestId,
    "TIMEFRAME:",
    timeframe
  );

  try {
    const config = getChartConfig(timeframe);

    const result: any = await yahooFinance.chart("TSLA", config);

    console.log(
      "YAHOO RESULT RECEIVED",
      requestId,
      "TIMEFRAME:",
      timeframe
    );

    if (!result.quotes || result.quotes.length === 0) {
      console.log(
        "NO QUOTES FOUND",
        requestId,
        timeframe
      );

      return NextResponse.json(
        {
          error: "No historical data available",
          timeframe,
        },
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

    console.log(
      "CANDLES CREATED:",
      candles.length,
      "TIMEFRAME:",
      timeframe
    );

    return NextResponse.json({
      timeframe,
      candles,
    });
  } catch (error) {
    console.error(
      "Yahoo Finance Error:",
      requestId,
      timeframe,
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch Tesla stock history",
        timeframe,
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}