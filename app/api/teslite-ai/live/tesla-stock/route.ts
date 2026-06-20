import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing FINNHUB_API_KEY in environment" },
        { status: 500 }
      );
    }

    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=TSLA&token=${apiKey}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Tesla stock price" },
        { status: res.status }
      );
    }

    const data = await res.json();

    const formatted = {
      symbol: "TSLA",
      current: data.c,     // current price
      high: data.h,        // day high
      low: data.l,         // day low
      open: data.o,        // open price
      previousClose: data.pc,
      timestamp: Date.now(),
    };

    return NextResponse.json({ stock: formatted });
  } catch (error) {
    console.error("Tesla Stock API Error:", error);
    return NextResponse.json(
      { error: "Server error fetching Tesla stock price" },
      { status: 500 }
    );
  }
}
