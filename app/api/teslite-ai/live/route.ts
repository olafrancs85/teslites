import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

const MARKET_KEYWORDS = [
  "earnings", "delivery", "guidance", "profit", "loss",
  "bankruptcy", "factory", "recall", "regulator", "sec",
  "autopilot", "fsd", "margin", "price cut", "production",
  "layoff", "china", "model 2", "model 3", "cybertruck"
];

export async function GET() {
  try {
    const feed = await parser.parseURL("https://www.teslarati.com/feed/");

    const items = feed.items.slice(0, 30);

    const scored = items.map(item => {
      const text = `${item.title} ${item.contentSnippet}`.toLowerCase();
      const score = MARKET_KEYWORDS.filter(k => text.includes(k)).length;

      return {
        title: item.title,
        link: item.link,
        date: item.pubDate,
        score
      };
    });

    const marketMoving = scored
      .filter(i => i.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const breaking = scored
      .filter(i => i.score >= 3)
      .slice(0, 3);

    const confidence =
      marketMoving.length >= 4 ? 70 :
      marketMoving.length >= 2 ? 55 :
      45;

    return NextResponse.json({
      breaking,
      confidence,
      marketMoving
    });

  } catch (e) {
    return NextResponse.json({
      breaking: [],
      confidence: 50,
      marketMoving: [],
      error: "Tesla Live feed unavailable"
    }, { status: 200 });
  }
}
