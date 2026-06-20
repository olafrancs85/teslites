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

    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=TSLA&outputsize=compact&apikey=${apiKey}`;

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Tesla stock history" },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (!data["Time Series (Daily)"]) {
      return NextResponse.json(
        { error: "Alpha Vantage rate limit reached" },
        { status: 429 }
      );
    }

    const candles = Object.entries(data["Time Series (Daily)"])
      .slice(0, 30)
      .reverse()
      .map(([date, values]: any) => ({
        time: new Date(date).getTime(),
        open: Number(values["1. open"]),
        high: Number(values["2. high"]),
        low: Number(values["3. low"]),
        close: Number(values["4. close"]),
      }));

    return NextResponse.json({ candles });
  } catch (error) {
    console.error("Tesla Stock History API Error:", error);
    return NextResponse.json(
      { error: "Server error fetching stock history" },
      { status: 500 }
    );
  }
}
