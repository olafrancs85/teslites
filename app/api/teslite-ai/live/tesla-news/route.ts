import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
    ],
  },
});

/* =========================================================
   CONFIG
========================================================= */

const PAGE_SIZE = 10;

/* =========================================================
   TYPES
========================================================= */

type NewsItem = {
  title: string;
  description: string;
  url: string;
  image: string | null;
  source: string;
  publishedAt: string;
};

type RSSFeed = {
  url: string;
  source: string;
};

/* =========================================================
   HELPERS
========================================================= */

function isGoogleNewsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    return (
      parsed.hostname === "news.google.com" ||
      parsed.hostname.endsWith(".news.google.com")
    );
  } catch {
    return false;
  }
}

function decodeGoogleNewsBase64(value: string): string {
  // Google News uses URL-safe Base64.
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded =
    normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

  return Buffer.from(padded, "base64").toString("latin1");
}

function normalizeUrl(url: string): string {
  return url
    .replace(/&amp;/g, "&")
    .replace(/\\u003d/g, "=")
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .trim();
}

/* =========================================================
   RSS IMAGE EXTRACTION
========================================================= */

export function extractImageFromHtml(html: string | null | undefined): string | null {
  if (!html || typeof html !== "string") {
    return null;
  }

  const candidates: string[] = [];

  const metaPatterns = [
    /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/i,
    /<meta[^>]+(?:itemprop)=["']image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  ];

  for (const pattern of metaPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      candidates.push(match[1]);
    }
  }

  const imgMatch = html.match(
    /<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/i
  );

  if (imgMatch?.[1]) {
    candidates.push(imgMatch[1]);
  }

  for (const candidate of candidates) {
    const normalized = candidate
      .replace(/&amp;/g, "&")
      .replace(/\\u003d/g, "=")
      .replace(/\\u0026/g, "&")
      .trim();

    if (/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(normalized)) {
      return normalized;
    }
  }

  return null;
}

function extractImageFromRSS(item: any): string | null {
  try {
    // Standard RSS enclosure
    if (
      item.enclosure?.url &&
      typeof item.enclosure.url === "string"
    ) {
      return item.enclosure.url;
    }

    // media:content
    if (Array.isArray(item.mediaContent)) {
      for (const media of item.mediaContent) {
        const url =
          media?.$?.url ||
          media?.url;

        if (
          url &&
          typeof url === "string" &&
          /\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(url)
        ) {
          return url;
        }
      }
    }

    // media:thumbnail
    if (Array.isArray(item.mediaThumbnail)) {
      for (const media of item.mediaThumbnail) {
        const url =
          media?.$?.url ||
          media?.url;

        if (
          url &&
          typeof url === "string"
        ) {
          return url;
        }
      }
    }

    const html =
      item.content ||
      item.contentEncoded ||
      item.summary ||
      "";

    if (typeof html === "string") {
      const imageFromHtml = extractImageFromHtml(html);
      if (imageFromHtml) {
        return imageFromHtml;
      }
    }

    return null;
  } catch (error) {
    console.warn(
      "⚠️ Could not extract RSS image:",
      error
    );

    return null;
  }
}

/* =========================================================
   ARTICLE URL NORMALIZATION
========================================================= */

function normalizeArticleUrl(url: string): string {
  try {
    const parsed = new URL(url);

    const removableParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "utm_id",
      "gclid",
      "fbclid",
      "mc_cid",
      "mc_eid",
      "ref",
      "referrer",
    ];

    for (const param of removableParams) {
      parsed.searchParams.delete(param);
    }

    parsed.hostname = parsed.hostname.toLowerCase();

    parsed.pathname = parsed.pathname
      .replace(/\/+/g, "/")
      .replace(/\/$/, "");

    return parsed.toString().toLowerCase();
  } catch {
    return url
      .trim()
      .toLowerCase()
      .replace(/\/$/, "");
  }
}

function normalizeArticleTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function enrichNewsImages(news: NewsItem[]): Promise<NewsItem[]> {
  const itemsNeedingImage = news.filter((item) => !item.image);

  if (itemsNeedingImage.length === 0) {
    return news;
  }

  const results = await Promise.allSettled(
    itemsNeedingImage.map(async (item) => {
      try {
        const resolvedUrl =
          isGoogleNewsUrl(item.url)
            ? await resolveArticleUrl(item.url)
            : item.url;

        const targetUrl = resolvedUrl || item.url;

        const response = await fetch(targetUrl, {
          cache: "no-store",
          redirect: "follow",
          headers: {
            "User-Agent": "Mozilla/5.0",
            Accept: "text/html,application/xhtml+xml",
          },
        });

        if (!response.ok) {
          return item;
        }

        const html = await response.text();
        const imageFromHtml = extractImageFromHtml(html);

        if (!imageFromHtml) {
          return item;
        }

        return {
          ...item,
          url: targetUrl,
          image: imageFromHtml,
        };
      } catch {
        return item;
      }
    })
  );

  const imageResults = new Map<string, NewsItem>();

  for (const result of results) {
    if (result.status === "fulfilled") {
      imageResults.set(result.value.url, result.value);
    }
  }

  return news.map((item) => imageResults.get(item.url) ?? item);
}

/**
 * Google News now uses an intermediate signed page for
 * /rss/articles/... URLs.
 *
 * The real publisher URL is obtained by:
 * 1. Fetching the Google News article page.
 * 2. Extracting data-n-a-id, data-n-a-ts and data-n-a-sg.
 * 3. Calling Google's internal Fbv4je endpoint.
 */
async function resolveArticleUrl(
  url: string
): Promise<string | null> {
  if (!url) return null;

  if (!isGoogleNewsUrl(url)) {
    return url;
  }

  console.log("🔎 Resolving Google News URL:", url);

  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/");
    const articlesIndex = pathParts.lastIndexOf("articles");
    const encodedArticle =
      articlesIndex === -1 ? "" : pathParts[articlesIndex + 1];

    if (!encodedArticle) {
      console.warn("⚠️ Invalid Google News article URL:", url);
      return null;
    }

    let decoded = decodeGoogleNewsBase64(encodedArticle);
    const prefix = Buffer.from([0x08, 0x13, 0x22]).toString("latin1");
    const suffix = Buffer.from([0xd2, 0x01, 0x00]).toString("latin1");

    if (decoded.startsWith(prefix)) decoded = decoded.slice(prefix.length);
    if (decoded.endsWith(suffix)) decoded = decoded.slice(0, -suffix.length);

    const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));

    if (!bytes.length) {
      console.warn("⚠️ Empty Google News token.");
      return null;
    }

    const firstByte = bytes[0];
    const articleData = firstByte >= 0x80
      ? decoded.slice(2, firstByte + 2)
      : decoded.slice(1, firstByte + 1);

    if (!articleData.startsWith("AU_yqL")) {
      const directUrl = articleData.trim();

      if (directUrl.startsWith("http://") || directUrl.startsWith("https://")) {
        console.log("✅ Publisher URL decoded directly:", directUrl);
        return directUrl;
      }

      console.warn("⚠️ Google News token did not contain a direct publisher URL.");
      return null;
    }

    console.log("🔐 New Google News encoding detected. Using batchexecute.");

    const gartUrlRequest = JSON.stringify([
        "garturlreq",
        [
          [
            "en-US", "US",
            ["FINANCE_TOP_INDICES", "WEB_TEST_1_0_0"],
            null, null, 1, 1, "US:en", null, 180, null, null, null, null,
            null, 0, null, null, [1608992183, 723341000],
          ],
          "en-US", "US", 1, [2, 3, 4, 8], 1, 0, "655000234", 0, 0, null, 0,
        ],
        encodedArticle,
      ]);

    const rpcPayload = JSON.stringify([
      [["Fbv4je", gartUrlRequest, null, "generic"]],
    ]);

    const response = await fetch(
      "https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je",
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Referer: "https://news.google.com/",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/132.0.0.0 Safari/537.36",
        },
        body: new URLSearchParams({ "f.req": rpcPayload }).toString(),
      }
    );

    console.log("🔓 Google News decoder status:", response.status);

    if (!response.ok) {
      console.warn("⚠️ Google News decoder failed:", response.status);
      return null;
    }

    const text = await response.text();
    const header = '[\\"garturlres\\",\\"';
    const footer = '\\",';
    const startIndex = text.indexOf(header);

    if (startIndex === -1) {
      console.warn("⚠️ Google News decoder response did not contain garturlres.");
      console.log("🧪 Decoder response preview:", text.slice(0, 500));
      return null;
    }

    const urlStart = startIndex + header.length;
    const endIndex = text.indexOf(footer, urlStart);

    if (endIndex === -1) {
      console.warn("⚠️ Google News decoder response had no URL terminator.");
      return null;
    }

    const publisherUrl = text
      .slice(urlStart, endIndex)
      .replace(/\\"/g, '"')
      .replace(/\\u003d/g, "=")
      .replace(/\\u0026/g, "&")
      .replace(/\\\//g, "/");

    if (
      (!publisherUrl.startsWith("http://") && !publisherUrl.startsWith("https://")) ||
      isGoogleNewsUrl(publisherUrl)
    ) {
      console.warn("⚠️ Decoder returned invalid publisher URL:", publisherUrl);
      return null;
    }

    console.log("✅ Publisher URL resolved:", publisherUrl);
    return publisherUrl;
  } catch (error) {
    console.warn(
      "⚠️ Google News URL resolution failed:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/* Legacy resolver retained below only as a disabled reference. */
async function resolveArticleUrlLegacy(
  url: string
): Promise<string | null> {
  if (!url) return null;

  if (!isGoogleNewsUrl(url)) {
    return url;
  }

  try {
    /*
     * ---------------------------------------------------------
     * STEP 1: Fetch the Google News intermediate page
     * ---------------------------------------------------------
     */
    const response = await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Referer: "https://news.google.com/",
      },
    });

    console.log(
      "🔗 Google News intermediate page:",
      response.status,
      response.url
    );

    if (!response.ok) {
      console.warn(
        "⚠️ Google News intermediate page failed:",
        response.status
      );

      return null;
    }

    /*
     * ---------------------------------------------------------
     * STEP 2: Extract Google's article parameters
     * ---------------------------------------------------------
     *
     * Current Google News pages expose:
     *
     * data-n-a-id
     * data-n-a-ts
     * data-n-a-sg
     *
     * These are required by the Fbv4je RPC.
     */
    const html = await response.text();

    const idMatch = html.match(/data-n-a-id=["']([^"']+)["']/i);
    const timestampMatch = html.match(
      /data-n-a-ts=["']([^"']+)["']/i
    );
    const signatureMatch = html.match(
      /data-n-a-sg=["']([^"']+)["']/i
    );

    const articleId = idMatch?.[1]?.trim();
    const timestamp = timestampMatch?.[1]?.trim();
    const signature = signatureMatch?.[1]?.trim();

    console.log("🆔 Google News article ID:", articleId);
    console.log("⏱️ Google News timestamp:", timestamp);
    console.log(
      "🔐 Google News signature:",
      signature ? "FOUND" : "MISSING"
    );

    if (!articleId || !timestamp || !signature) {
      console.warn(
        "⚠️ Google News article parameters were not found."
      );

      return null;
    }

    /*
     * ---------------------------------------------------------
     * STEP 3: Build Google's Fbv4je request
     * ---------------------------------------------------------
     */
    const gartUrlRequest = JSON.stringify([
      "garturlreq",
      [
        [
          "en-US",
          "US",
          ["FINANCE_TOP_INDICES", "WEB_TEST_1_0_0"],
          null,
          null,
          1,
          1,
          "US:en",
          null,
          1,
          null,
          null,
          null,
          null,
          null,
          0,
          1,
        ],
        "en-US",
        "US",
        1,
        [2, 4, 8],
        1,
        1,
        null,
        0,
        0,
        null,
        0,
      ],
      articleId,
      Number(timestamp),
      signature,
    ]);

    const rpcPayload = JSON.stringify([
      [
        [
          "Fbv4je",
          gartUrlRequest,
          null,
          "generic",
        ],
      ],
    ]);

    /*
     * ---------------------------------------------------------
     * STEP 4: Ask Google for the publisher URL
     * ---------------------------------------------------------
     */
    const decoderResponse = await fetch(
      "https://news.google.com/_/DotsSplashUi/data/batchexecute",
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
          Referer: "https://news.google.com/",
        },
        body: new URLSearchParams({
          "f.req": rpcPayload,
        }).toString(),
      }
    );

    console.log(
      "🔓 Google News decoder status:",
      decoderResponse.status
    );

    if (!decoderResponse.ok) {
      console.warn(
        "⚠️ Google News decoder request failed:",
        decoderResponse.status
      );

      return null;
    }

    /*
     * ---------------------------------------------------------
     * STEP 5: Extract garturlres from Google's response
     * ---------------------------------------------------------
     *
     * Expected response contains something similar to:
     *
     * ["garturlres","https://publisher.com/article/..."]
     */
    const decoderText = await decoderResponse.text();
    const resultMatch = decoderText.match(
      /\["garturlres","((?:\\.|[^"])*)"/
    );

    if (!resultMatch?.[1]) {
      console.warn(
        "⚠️ Google News decoder returned no publisher URL."
      );

      console.log(
        "🧪 Decoder response preview:",
        decoderText.slice(0, 500)
      );

      return null;
    }

    let publisherUrl: string;

    try {
      /*
       * Google's response contains escaped JSON characters,
       * so decode the captured string as a JSON string.
       */
      publisherUrl = JSON.parse(`"${resultMatch[1]}"`);
    } catch {
      /*
       * Fallback in case Google's response format changes slightly.
       */
      publisherUrl = resultMatch[1]
        .replace(/\\"/g, '"')
        .replace(/\\u003d/g, "=")
        .replace(/\\u0026/g, "&")
        .replace(/\\\//g, "/");
    }

    publisherUrl = normalizeUrl(publisherUrl);

    /*
     * ---------------------------------------------------------
     * STEP 6: Validate the result
     * ---------------------------------------------------------
     */
    if (
      !publisherUrl ||
      !publisherUrl.startsWith("http") ||
      isGoogleNewsUrl(publisherUrl)
    ) {
      console.warn(
        "⚠️ Google News decoder returned an invalid publisher URL:",
        publisherUrl
      );

      return null;
    }

    console.log(
      "✅ Publisher URL resolved:",
      publisherUrl
    );

    return publisherUrl;
  } catch (error) {
    console.warn(
      "⚠️ Google News URL resolution failed:",
      error instanceof Error ? error.message : error
    );

    return null;
  }
}

void resolveArticleUrlLegacy;

/* =========================================================
   RSS FEEDS
========================================================= */

const RSS_FEEDS: RSSFeed[] = [
  {
    url:
      "https://news.google.com/rss/search?q=Tesla&hl=en-US&gl=US&ceid=US:en",
    source: "Google News · Tesla",
  },
  
  {
    url:
      "https://www.cnbc.com/id/10001147/device/rss/rss.html",
    source: "CNBC",
  },
];

/* =========================================================
   RSS FETCH
========================================================= */

async function fetchFromRSS(): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  console.log("📡 Collecting RSS news in parallel...");

  const feedResults = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      try {
        console.log(`📰 Reading RSS feed: ${feed.source}`);
        
const parsed = await parser.parseURL(feed.url);

        console.log(
          `📰 ${feed.source} returned ${parsed.items.length} RSS items`
        );

        return {
          feed,
          items: parsed.items,
        };
      } catch (error) {
        console.warn(
          `⚠️ RSS failed: ${feed.source}`,
          error instanceof Error ? error.message : error
        );

        return {
          feed,
          items: [],
        };
      }
    })
  );

  for (const result of feedResults) {
    if (result.status !== "fulfilled") {
      continue;
    }

    const { feed, items } = result.value;

    for (const item of items) {
      const title = item.title?.trim();

      if (!title) {
        continue;
      }

      const url = item.link?.trim() || "";

      if (!url) {
        continue;
      }

      const description =
        item.contentSnippet?.trim() ||
        item.content?.trim() ||
        item.summary?.trim() ||
        "";

      const publishedAt =
  item.isoDate ||
  item.pubDate ||
  new Date().toISOString();

const image =
  extractImageFromRSS(item);

 allNews.push({
  title,
  description,
  url,
  image,
  source: feed.source,
  publishedAt,
});
    }
  }

  console.log("📡 RSS raw articles:", allNews.length);

  return allNews;
}

/* =========================================================
   DEDUPLICATION
========================================================= */

function deduplicateNews(
  news: NewsItem[]
): NewsItem[] {
  const seenUrls =
    new Set<string>();

  const seenTitles =
    new Set<string>();

  return news.filter(
    (item) => {
      const normalizedUrl =
        normalizeArticleUrl(
          item.url
        );

      const normalizedTitle =
        normalizeArticleTitle(
          item.title
        );

      /*
       * Same canonical URL.
       */
      if (
        seenUrls.has(
          normalizedUrl
        )
      ) {
        console.log(
          "🗑️ Duplicate article removed by URL:",
          item.title
        );

        return false;
      }

      /*
       * Same title from another source.
       */
      if (
        normalizedTitle &&
        seenTitles.has(
          normalizedTitle
        )
      ) {
        console.log(
          "🗑️ Duplicate article removed by title:",
          item.title
        );

        return false;
      }

      seenUrls.add(
        normalizedUrl
      );

      if (normalizedTitle) {
        seenTitles.add(
          normalizedTitle
        );
      }

      return true;
    }
  );
}

async function resolveNewsPageUrls(
  news: NewsItem[]
): Promise<NewsItem[]> {
  /*
   * Only resolve URLs for the articles that are
   * actually going to be displayed.
   *
   * This prevents hundreds of sequential HTTP
   * requests to Google News.
   */
  const resolved = await Promise.all(
    news.map(async (item) => {
      if (!isGoogleNewsUrl(item.url)) {
        return item;
      }

      const resolvedUrl =
        await resolveArticleUrl(item.url);

      if (!resolvedUrl) {
        /*
         * Keep the Google News URL rather than
         * completely losing the article.
         */
        return item;
      }

      return {
        ...item,
        url: resolvedUrl,
      };
    })
  );

  return resolved;
}

/* =========================================================
   SORT
========================================================= */

function sortNews(
  news: NewsItem[]
): NewsItem[] {
  return [...news].sort(
    (a, b) =>
      new Date(
        b.publishedAt
      ).getTime() -
      new Date(
        a.publishedAt
      ).getTime()
  );
}

/* =========================================================
   API HANDLER
========================================================= */

export async function GET(
  req: Request
) {
  try {
    const { searchParams } =
      new URL(req.url);

    /*
     * -------------------------------------------------------
     * SAFE PAGE
     * -------------------------------------------------------
     */

    const rawPage =
      Number(
        searchParams.get("page") ||
          "1"
      );

    const page =
      Number.isFinite(rawPage)
        ? Math.max(
            1,
            Math.floor(rawPage)
          )
        : 1;

    console.log(
      "📰 Tesla News API page:",
      page
    );

    const apiKey =
      process.env.GNEWS_API_KEY;

    /* =====================================================
       COLLECT NEWS FROM ALL SOURCES
    ===================================================== */

    let gnewsNews: NewsItem[] = [];
    let gnewsTotalArticles = 0;
    let gnewsAvailable = false;

    /* =====================================================
       PRIMARY DISCOVERY: GNEWS
    ===================================================== */

    if (apiKey) {
      try {
        const params = new URLSearchParams({
          q: '"Tesla" OR TSLA',
          lang: "en",
          max: String(PAGE_SIZE),
          page: String(page),
          sortby: "publishedAt",
          token: apiKey,
        });

        const url =
          `https://gnews.io/api/v4/search?${params.toString()}`;

        console.log(
          "🌐 Requesting GNews:",
          `page=${page}`
        );

        const res =
          await fetch(url, {
            cache: "no-store",
          });

        if (res.ok) {
          const data =
            await res.json();

          gnewsTotalArticles =
            Number(
              data?.totalArticles ?? 0
            );

          gnewsNews =
            data?.articles?.map(
              (
                article: any
              ): NewsItem => ({
                title:
                  article.title ??
                  "Tesla News",

                description:
                  article.description ??
                  "",

                url:
                  article.url,

                image:
                  article.image ??
                  null,

                source:
                  article.source
                    ?.name ??
                  "Unknown",

                publishedAt:
                  article.publishedAt ??
                  new Date().toISOString(),
              })
            ) ?? [];

          /*
           * Remove invalid URLs.
           */
          gnewsNews =
            gnewsNews.filter(
              (item) => {
                if (!item.url) {
                  return false;
                }

                try {
                  new URL(
                    item.url
                  );

                  return true;
                } catch {
                  return false;
                }
              }
            );

          /*
           * Deduplicate GNews results.
           */
          gnewsNews =
            deduplicateNews(
              gnewsNews
            );

          /*
           * Sort newest first.
           */
          gnewsNews =
            sortNews(
              gnewsNews
            );

          gnewsAvailable = true;

          console.log(
            "🗓️ GNews articles:",
            gnewsNews.map(
              (item) => ({
                title:
                  item.title,
                publishedAt:
                  item.publishedAt,
                source:
                  item.source,
              })
            )
          );

          console.log(
            "✅ GNews returned:",
            gnewsNews.length,
            "usable articles"
          );

          console.log(
            "📊 GNews totalArticles:",
            gnewsTotalArticles
          );
        } else if (
          res.status === 429
        ) {
          /*
           * IMPORTANT:
           *
           * A 429 does NOT mean RSS should be skipped.
           *
           * We simply mark GNews as unavailable and allow
           * the RSS sources to provide the feed.
           */
          console.warn(
            "⚠️ GNews rate limit reached (429). Using RSS sources."
          );
        } else {
          console.warn(
            "⚠️ GNews failed:",
            res.status,
            "Using RSS sources."
          );
        }
      } catch (error) {
        console.warn(
          "⚠️ GNews request failed:",
          error instanceof Error
            ? error.message
            : error
        );
      }
    }

    /* =====================================================
       SECONDARY DISCOVERY: RSS
    ===================================================== */

    console.log(
      "📡 Collecting RSS news..."
    );

    let rssNews: NewsItem[] = [];

    try {
      rssNews =
        await fetchFromRSS();
    } catch (error) {
      console.warn(
        "⚠️ RSS collection failed:",
        error instanceof Error
          ? error.message
          : error
      );
    }

    console.log(
      "📡 RSS raw articles:",
      rssNews.length
    );

    /*
     * Remove invalid URLs.
     */
    rssNews =
      rssNews.filter(
        (item) => {
          if (!item.url) {
            return false;
          }

          try {
            new URL(
              item.url
            );

            return true;
          } catch {
            return false;
          }
        }
      );

    /* =====================================================
       COMBINE ALL DISCOVERY SOURCES
    ===================================================== */

    let combinedNews: NewsItem[] = [
      ...gnewsNews,
      ...rssNews,
    ];

    console.log(
      "🔗 Combined raw news:",
      combinedNews.length
    );

    /* =========================================================
       TESLA-ONLY RELEVANCE FILTER
    ========================================================= */

    const TESLA_RELEVANCE_KEYWORDS = [
      // Tesla company
      "tesla",
      "tsla",

      // Tesla vehicles
      "model 3",
      "model y",
      "model s",
      "model x",
      "cybertruck",
      "cybercab",
      "tesla semi",
      "tesla roadster",

      // Autonomous driving
      "tesla fsd",
      "tesla autopilot",
      "full self-driving",
      "tesla autonomous",
      "tesla autonomy",
      "tesla robotaxi",

      // Tesla AI / robotics
      "tesla optimus",
      "optimus robot",
      "tesla bot",

      // Tesla Energy
      "tesla energy",
      "powerwall",
      "megapack",
      "solar roof",
      "tesla solar",

      // Tesla charging
      "tesla supercharger",
      "tesla charging",
      "supercharger network",

      // Tesla business / financials
      "tesla stock",
      "tesla shares",
      "tesla earnings",
      "tesla revenue",
      "tesla profit",
      "tesla deliveries",
      "tesla sales",
      "tesla factory",
      "tesla gigafactory",
      "tesla production",

      // Tesla regulatory / safety
      "tesla recall",
      "tesla safety",
      "tesla investigation",
      "tesla regulator",
      "tesla nhtsa",
      "nhtsa tesla",

      // Tesla software / app
      "tesla app",
      "tesla software",
      "tesla update",
    ];

    function calculateTeslaRelevance(article: NewsItem): number {
      const title = article.title.toLowerCase();
      const description = article.description.toLowerCase();

      let score = 0;

      for (const keyword of TESLA_RELEVANCE_KEYWORDS) {
        if (title.includes(keyword)) {
          score += 10;
        }

        if (description.includes(keyword)) {
          score += 5;
        }
      }

      /*
       * A Tesla-focused source gets a small additional boost.
       * This does NOT make an article relevant by itself.
       */
      const source = article.source.toLowerCase();

      if (
        source.includes("google news · tesla") ||
        source.includes("cnbc") ||
        source.includes("tesla")
      ) {
        score += 2;
      }

      return score;
    }

    const beforeRelevanceFilter = combinedNews.length;

    const scoredNews = combinedNews.map((article) => ({
      article,
      relevanceScore: calculateTeslaRelevance(article),
    }));

    /*
     * Minimum score required to enter the Tesla News feed.
     *
     * Direct Tesla stories normally score 10+.
     * Strong Tesla/Musk stories normally score 7+.
     * General Musk stories usually score 1 and are rejected.
     */
    const MIN_TESLA_RELEVANCE_SCORE = 5;

    combinedNews = scoredNews
      .filter(({ relevanceScore }) => relevanceScore >= MIN_TESLA_RELEVANCE_SCORE)
      .sort((a, b) => {
        /*
         * Relevance is the first priority.
         * Freshness will still be handled by the existing
         * sortNews() function later in the pipeline.
         */
        return b.relevanceScore - a.relevanceScore;
      })
      .map(({ article }) => article);

    console.log(
      `🎯 Tesla relevance scoring: ${beforeRelevanceFilter} → ${combinedNews.length}`
    );

    /*
     * Show the strongest articles for debugging.
     * This lets us verify that the scoring system is behaving
     * correctly before we make further changes.
     */
    console.log(
      "🏆 Top Tesla relevance scores:",
      scoredNews
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 15)
        .map(({ article, relevanceScore }) => ({
          score: relevanceScore,
          title: article.title,
          source: article.source,
        }))
    );

    /*
     * -------------------------------------------------------
     * DEDUPLICATION
     * -------------------------------------------------------
     *
     * This is extremely important.
     *
     * The same Tesla story can appear:
     *
     *   - in GNews
     *   - Google News Tesla RSS
     *   - Google News Elon Musk RSS
     *   - CNBC RSS
     *
     * We want one story, not four copies.
     */

    combinedNews = deduplicateNews(combinedNews);

    /*
     * -------------------------------------------------------
     * SORT EVERYTHING BY PUBLICATION TIME
     * -------------------------------------------------------
     */

    combinedNews =
      sortNews(
        combinedNews
      );

    console.log(
      "🧹 Combined unique news:",
      combinedNews.length
    );

    console.log(
      "🗓️ Newest combined articles:",
      combinedNews
        .slice(0, 15)
        .map(
          (item) => ({
            title:
              item.title,
            publishedAt:
              item.publishedAt,
            source:
              item.source,
          })
        )
    );

    /* =====================================================
       PAGINATION
    ===================================================== */

    const startIndex =
      (page - 1) *
      PAGE_SIZE;

    const endIndex =
      startIndex +
      PAGE_SIZE;

    const paginatedNews =
      combinedNews.slice(
        startIndex,
        endIndex
      );

    /*
     * There may be additional GNews articles beyond the
     * locally collected RSS + current GNews page.
     *
     * Therefore GNews's totalArticles still helps indicate
     * that more news exists.
     */
    const hasMoreFromGNews =
      gnewsAvailable &&
      gnewsTotalArticles >
        endIndex;

    const hasMore =
      endIndex <
        combinedNews.length ||
      hasMoreFromGNews;

    /* =====================================================
       RESOLVE ONLY DISPLAYED GOOGLE NEWS URLS
    ===================================================== */

    // Google News URLs are kept as-is during feed loading.
// Resolving them here was adding significant latency while frequently
// failing to produce a publisher URL. Article URL resolution can happen
// when the user actually opens an article.
    const resolvedPageNews =
      await enrichNewsImages(
        await resolveNewsPageUrls(
          paginatedNews
        )
      );

    console.log(
      "📄 Final Tesla News page:",
      {
        page,
        startIndex,
        endIndex,
        combinedTotal:
          combinedNews.length,
        returned:
          resolvedPageNews.length,
        hasMore,
      }
    );

    /* =====================================================
       NO NEWS
    ===================================================== */

    if (
      page === 1 &&
      resolvedPageNews.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No Tesla news available",
        },
        {
          status: 503,
        }
      );
    }

    /* =====================================================
       PAGE BEYOND AVAILABLE NEWS
    ===================================================== */

    if (
      page > 1 &&
      resolvedPageNews.length === 0
    ) {
      return NextResponse.json({
        news: [],
        count: 0,
        page,
        pageSize:
          PAGE_SIZE,
        totalArticles:
          combinedNews.length,
        hasMore: false,
        source:
          "gnews+rss",
        updatedAt:
          new Date().toISOString(),
      });
    }

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      news:
        resolvedPageNews,

      count:
        resolvedPageNews.length,

      page,

      pageSize:
        PAGE_SIZE,

      /*
       * This represents the locally collected unique
       * candidate pool, rather than pretending that all
       * 57,000+ GNews results have been loaded into memory.
       */
      totalArticles:
        combinedNews.length,

      hasMore,

      source:
        gnewsAvailable
          ? "gnews+rss"
          : "rss",

      updatedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ Tesla News API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Server error fetching Tesla news",
      },
      {
        status: 500,
      }
    );
  }
}