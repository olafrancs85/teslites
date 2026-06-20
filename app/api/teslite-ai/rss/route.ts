import { NextResponse } from "next/server";
import Parser from "rss-parser";

/* ----------------------------------
   Market-moving keywords
---------------------------------- */
const MARKET_KEYWORDS = [
  "earnings",
  "delivery",
  "guidance",
  "profit",
  "loss",
  "bankruptcy",
  "merger",
  "acquisition",
  "ipo",
  "revenue",
  "sec",
  "recall",
  "scandal",
  "investigation",
  "lawsuit",
  "settlement",
  "regulator",
  "crash",
  "autopilot",
  "fsd",
  "factory",
  "gigafactory",
  "china",
  "production",
  "layoff",
  "price cut",
  "price increase",
];

/* ----------------------------------
   Types
---------------------------------- */
interface RssSignal {
  title: string;
  link: string;
  published: string;
  source: string;
  signalType: "MARKET_MOVING" | "NORMAL";
  impactScore: number;
}

const parser = new Parser();

/* ----------------------------------
   Signal classification
---------------------------------- */
function classifyRSS(title: string, summary?: string) {
  const text = `${title} ${summary ?? ""}`.toLowerCase();

  let score = 0;
  for (const keyword of MARKET_KEYWORDS) {
    if (text.includes(keyword)) score += 15;
  }

  if (score >= 30) {
    return { signalType: "MARKET_MOVING" as const, impactScore: Math.min(score, 100) };
  }

  return { signalType: "NORMAL" as const, impactScore: score };
}

/* ----------------------------------
   Robust link extraction (FIX)
---------------------------------- */
function extractLink(item: any): string | null {
  const candidates = [
    item.link,
    item.guid,
    item.id,
    item.links?.[0]?.url,
  ];

  for (const raw of candidates) {
    if (typeof raw === "string") {
      const clean = raw.trim();
      if (clean.startsWith("http://") || clean.startsWith("https://")) {
        return clean;
      }
      if (clean.startsWith("//")) {
        return `https:${clean}`;
      }
    }
  }

  return null;
}

/* ----------------------------------
   API handler
---------------------------------- */
export async function GET() {
  try {
    const isDev = process.env.NODE_ENV !== "production";
    const results: RssSignal[] = [];

    if (isDev) {
      // DEV fallback — clickable & realistic (FIX)
      results.push(
        {
          title: "Tesla deliveries beat expectations",
          link: "https://www.reuters.com/",
          published: new Date().toISOString(),
          source: "Teslites AI",
          signalType: "MARKET_MOVING",
          impactScore: 35,
        },
        {
          title: "Analysts raise Tesla price targets",
          link: "https://www.cnbc.com/",
          published: new Date().toISOString(),
          source: "Teslites AI",
          signalType: "NORMAL",
          impactScore: 10,
        },
        {
          title: "Tesla stock shows steady growth",
          link: "https://news.google.com/",
          published: new Date().toISOString(),
          source: "Teslites AI",
          signalType: "NORMAL",
          impactScore: 5,
        }
      );
    } else {
      const feeds = [
        { url: "https://news.google.com/rss/search?q=Tesla&hl=en-US&gl=US&ceid=US:en", source: "Google News · Tesla" },
        { url: "https://news.google.com/rss/search?q=Elon+Musk&hl=en-US&gl=US&ceid=US:en", source: "Google News · Elon Musk" },
        { url: "https://www.reuters.com/rssFeed/tesla", source: "Reuters" },
        { url: "https://www.cnbc.com/id/10001147/device/rss/rss.html", source: "CNBC" },
      ];

      for (const feed of feeds) {
        try {
          const parsed = await parser.parseURL(feed.url);

          for (const item of parsed.items.slice(0, 10)) {
            if (!item.title) continue;

            const link = extractLink(item);
            if (!link) continue;

            const classified = classifyRSS(
              item.title,
              item.contentSnippet ?? item.content ?? ""
            );

            results.push({
              title: item.title,
              link,
              published: item.pubDate ?? new Date().toISOString(),
              source: feed.source,
              signalType: classified.signalType,
              impactScore: classified.impactScore,
            });
          }
        } catch (err) {
          console.error(`RSS feed failed: ${feed.source}`, err);
        }
      }
    }

    // Sort: market-moving first, then impact
    results.sort((a, b) => {
      if (a.signalType !== b.signalType) {
        return a.signalType === "MARKET_MOVING" ? -1 : 1;
      }
      return b.impactScore - a.impactScore;
    });

    const finalResults = results.slice(0, 6); // or 7 if you like


    return NextResponse.json({
      items: finalResults,
      count: finalResults.length,
    });
  } catch (err) {
    console.error("Tesla RSS API failed:", err);
    return NextResponse.json({ items: [], count: 0 }, { status: 500 });
  }
}
