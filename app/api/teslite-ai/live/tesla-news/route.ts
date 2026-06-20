import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

/* -----------------------------
   RSS fallback
------------------------------ */
async function fetchFromRSS() {
  const feeds = [
    {
      url: "https://news.google.com/rss/search?q=Tesla&hl=en-US&gl=US&ceid=US:en",
      source: "Google News · Tesla",
    },
    {
      url: "https://news.google.com/rss/search?q=Elon+Musk&hl=en-US&gl=US&ceid=US:en",
      source: "Google News · Elon Musk",
    },
    {
      url: "https://www.reuters.com/rssFeed/tesla",
      source: "Reuters",
    },
    {
      url: "https://www.cnbc.com/id/10001147/device/rss/rss.html",
      source: "CNBC",
    },
  ];

  const items: any[] = [];

  for (const feed of feeds) {
    try {
      const parsed = await parser.parseURL(feed.url);

      parsed.items.slice(0, 10).forEach(item => {
        if (!item.title || !item.link) return;

        items.push({
          title: item.title,
          description: item.contentSnippet ?? item.content ?? "",
          url: item.link,
          image: null,
          source: feed.source,
          publishedAt: item.pubDate
            ? new Date(item.pubDate).toISOString()
            : new Date().toISOString(),
        });
      });
    } catch (err) {
      console.warn(`RSS failed: ${feed.source}`, err);
    }
  }

  return items;
}

/* -----------------------------
   API handler
------------------------------ */
export async function GET() {
  try {
    const apiKey = process.env.GNEWS_API_KEY;
    let news: any[] = [];

    /* ---------- Primary: GNews ---------- */
    if (apiKey) {
      const url =
        `https://gnews.io/api/v4/search?q=tesla&lang=en&max=15&sortby=publishedAt&token=${apiKey}`;

      const res = await fetch(url, { cache: "no-store" });

      if (res.ok) {
        const data = await res.json();

        news =
          data?.articles?.map((article: any) => ({
            title: article.title,
            description: article.description,
            url: article.url,
            image: article.image,
            source: article.source?.name ?? "Unknown",
            publishedAt: article.publishedAt,
          })) ?? [];
      } else {
        console.warn("GNews failed, switching to RSS");
      }
    }

    /* ---------- Fallback: RSS ---------- */
    if (!news.length) {
      news = await fetchFromRSS();
    }

    /* ---------- Hard guarantee: latest-first ---------- */
    news.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime()
    );

    /* ---------- Final safety ---------- */
    if (!news.length) {
      return NextResponse.json(
        { error: "No Tesla news available" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      news,
      count: news.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Tesla News API error:", error);

    return NextResponse.json(
      { error: "Server error fetching Tesla news" },
      { status: 500 }
    );
  }
}
