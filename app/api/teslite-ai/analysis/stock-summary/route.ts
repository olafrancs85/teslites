import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const percentMove = Number(searchParams.get("percentMove") || 0);
    const headline = searchParams.get("headline") || "";
    const earningsVerdict =
      (searchParams.get("earningsVerdict") as
        | "beat"
        | "miss"
        | "inline") || "inline";

    let sentiment: "Bullish" | "Bearish" | "Neutral" = "Neutral";
    let confidence: "Low" | "Medium" | "High" = "Medium";

    if (percentMove >= 3) sentiment = "Bullish";
    if (percentMove <= -3) sentiment = "Bearish";

    if (Math.abs(percentMove) >= 5) confidence = "High";
    else if (Math.abs(percentMove) < 2) confidence = "Low";

    let summary = "Tesla shares traded relatively flat.";

    if (sentiment === "Bullish") {
      summary =
        "Tesla shares surged as investors reacted positively to recent developments.";
    }

    if (sentiment === "Bearish") {
      summary =
        "Tesla shares declined as investors reacted cautiously to recent developments.";
    }

    if (earningsVerdict === "miss") {
      summary +=
        " The move follows an earnings miss, which weighed on near-term sentiment.";
    }

    if (earningsVerdict === "beat") {
      summary +=
        " The rally was supported by an earnings beat, reinforcing investor confidence.";
    }

    if (headline) {
      summary += ` Headline focus: “${headline}”.`;
    }

    return NextResponse.json({
      summary,
      sentiment,
      confidence,
    });
  } catch {
    return NextResponse.json(
      {
        summary: "Tesla stock activity could not be analyzed at this time.",
        sentiment: "Neutral",
        confidence: "Low",
      },
      { status: 200 }
    );
  }
}
