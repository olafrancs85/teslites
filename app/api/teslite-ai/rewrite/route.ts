// app/api/teslite-ai/rewrite/route.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/* ---------------------------------
   ARTICLE CACHE
--------------------------------- */

type CachedArticle = {
  data: {
    title: string;
    summary: string;
    content: string;
    source: string;
    url: string;
    publishedAt: string;
  };
  expiresAt: number;
};

const articleCache = new Map<string, CachedArticle>();

const ARTICLE_CACHE_TTL =
  24 * 60 * 60 * 1000; // 24 hours

const MAX_ARTICLE_CACHE_SIZE = 100;

function getCachedArticle(
  url: string
): CachedArticle["data"] | null {
  const cached = articleCache.get(url);

  if (!cached) {
    return null;
  }

  if (Date.now() > cached.expiresAt) {
    articleCache.delete(url);
    return null;
  }

  return cached.data;
}

function setCachedArticle(
  url: string,
  data: CachedArticle["data"]
) {
  if (articleCache.size >= MAX_ARTICLE_CACHE_SIZE) {
    const oldestKey = articleCache.keys().next().value;

    if (oldestKey) {
      articleCache.delete(oldestKey);
    }
  }

  articleCache.set(url, {
    data,
    expiresAt: Date.now() + ARTICLE_CACHE_TTL,
  });
}

/* ---------------------------------
   HTML HELPERS
--------------------------------- */

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_, hex: string) =>
        String.fromCodePoint(
          parseInt(hex, 16)
        )
    )
    .replace(
      /&#([0-9]+);/g,
      (_, decimal: string) =>
        String.fromCodePoint(
          parseInt(decimal, 10)
        )
    );
}

function stripHtml(input: string): string {
  return decodeHtmlEntities(
    input
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/* =========================================================
   GOOGLE NEWS URL RESOLUTION
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

function normalizeUrl(url: string): string {
  return url
    .replace(/&amp;/g, "&")
    .replace(/\\u003d/g, "=")
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .trim();
}

function decodeGoogleNewsBase64(value: string): string {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded =
    normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

  return Buffer.from(padded, "base64").toString("latin1");
}

async function resolveGoogleNewsToken(url: string): Promise<string | null> {
  if (!url) return null;
  if (!isGoogleNewsUrl(url)) return url;

  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/");
    const articlesIndex = pathParts.lastIndexOf("articles");
    const encodedArticle =
      articlesIndex === -1 ? "" : pathParts[articlesIndex + 1];

    if (!encodedArticle) return null;

    let decoded = decodeGoogleNewsBase64(encodedArticle);
    const prefix = Buffer.from([0x08, 0x13, 0x22]).toString("latin1");
    const suffix = Buffer.from([0xd2, 0x01, 0x00]).toString("latin1");

    if (decoded.startsWith(prefix)) decoded = decoded.slice(prefix.length);
    if (decoded.endsWith(suffix)) decoded = decoded.slice(0, -suffix.length);

    const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
    if (!bytes.length) return null;

    const firstByte = bytes[0];
    const articleData = firstByte >= 0x80
      ? decoded.slice(2, firstByte + 2)
      : decoded.slice(1, firstByte + 1);

    if (!articleData.startsWith("AU_yqL")) {
      const directUrl = articleData.trim();
      return directUrl.startsWith("http://") || directUrl.startsWith("https://")
        ? directUrl
        : null;
    }

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
      ], encodedArticle,
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

    if (!response.ok) return null;

    const text = await response.text();
    const header = '[\\"garturlres\\",\\"';
    const footer = '\\",';
    const startIndex = text.indexOf(header);
    if (startIndex === -1) return null;

    const urlStart = startIndex + header.length;
    const endIndex = text.indexOf(footer, urlStart);
    if (endIndex === -1) return null;

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
      return null;
    }

    return publisherUrl;
  } catch (error) {
    console.warn(
      "⚠️ Google News URL resolution failed:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

function extractMetaUrl(
  html: string,
  attribute: "property" | "name",
  value: string
): string | null {
  const metaTags =
    html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTags) {
    const attributeMatch = tag.match(
      new RegExp(
        `${attribute}\\s*=\\s*["']${value.replace(
          /[-/\\^$*+?.()|[\]{}]/g,
          "\\$&"
        )}["']`,
        "i"
      )
    );

    if (!attributeMatch) continue;

    const contentMatch = tag.match(
      /content\s*=\s*["']([^"']+)["']/i
    );

    if (contentMatch?.[1]) {
      return normalizeUrl(contentMatch[1]);
    }
  }

  return null;
}

function extractLinkHref(
  html: string,
  relValue: string
): string | null {
  const linkTags =
    html.match(/<link\b[^>]*>/gi) ?? [];

  for (const tag of linkTags) {
    const relMatch = tag.match(
      /rel\s*=\s*["']([^"']+)["']/i
    );

    if (!relMatch) continue;

    const relValues = relMatch[1]
      .toLowerCase()
      .split(/\s+/);

    if (
      !relValues.includes(
        relValue.toLowerCase()
      )
    ) {
      continue;
    }

    const hrefMatch = tag.match(
      /href\s*=\s*["']([^"']+)["']/i
    );

    if (hrefMatch?.[1]) {
      return normalizeUrl(hrefMatch[1]);
    }
  }

  return null;
}

async function resolveArticleUrl(url: string): Promise<string | null> {
  if (!url) return null;

  if (!isGoogleNewsUrl(url)) {
    return url;
  }

  console.log("🔎 Resolving Google News URL:", url);

  try {
    // 1. Fetch Google's article page.
    const response = await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/132.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    console.log(
      "🔗 Google News page status:",
      response.status,
      "final URL:",
      response.url
    );

    if (!response.ok) {
      console.warn(
        "⚠️ Google News page request failed:",
        response.status
      );
      return null;
    }

    const html = await response.text();

    // 2. Extract Google's current data-p payload.
    const dataPMatch = html.match(
      /<c-wiz[^>]+data-p=["']([^"']+)["']/i
    );
    let dataPPayload = dataPMatch?.[1];

    if (!dataPPayload) {
      console.warn("⚠️ Google News data-p payload not found.");

      // Fallback: some versions expose the payload without c-wiz
      const fallbackMatch = html.match(
        /data-p=["']([^"']+)["']/i
      );

      if (!fallbackMatch?.[1]) {
        return null;
      }

      dataPPayload = fallbackMatch[1];
    }

    const rawData = dataPPayload
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");

    console.log("✅ Google News decoding payload found");

    // 3. Convert Google's serialized payload into the garturl request.
    let gartUrlRequest: unknown;

    try {
      gartUrlRequest = JSON.parse(
        rawData.replace(
          "%.@.",
          '["garturlreq",'
        )
      );
    } catch (error) {
      console.warn(
        "⚠️ Could not parse Google News data-p payload:",
        error instanceof Error ? error.message : String(error)
      );

      return null;
    }

    if (!Array.isArray(gartUrlRequest)) {
      console.warn(
        "⚠️ Google News payload has unexpected format."
      );

      return null;
    }

    /*
     * Google's payload contains additional parameters at the end.
     * The batchexecute request needs the garturl request with
     * those trailing parameters removed/reassembled.
     */
    const payloadArray = gartUrlRequest as unknown[];

    const requestBody = JSON.stringify([
      [
        [
          "Fbv4je",
          JSON.stringify(
            [
              ...payloadArray.slice(0, -6),
              ...payloadArray.slice(-2),
            ]
          ),
          null,
          "generic",
        ],
      ],
    ]);

    // 4. Ask Google to resolve the real publisher URL.
    const decoderResponse = await fetch(
      "https://news.google.com/_/DotsSplashUi/data/batchexecute",
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/132.0.0.0 Safari/537.36",
        },
        body: new URLSearchParams({
          "f.req": requestBody,
        }).toString(),
      }
    );

    console.log(
      "🔓 Google News decoder status:",
      decoderResponse.status
    );

    if (!decoderResponse.ok) {
      console.warn(
        "⚠️ Google News decoder failed:",
        decoderResponse.status
      );

      return null;
    }

    const decoderText = await decoderResponse.text();

    // 5. Parse Google's batchexecute response.
    const responseParts = decoderText.split("\n\n");

    if (responseParts.length < 2) {
      console.warn(
        "⚠️ Unexpected Google News decoder response."
      );

      return null;
    }

    let outerData: unknown;

    try {
      outerData = JSON.parse(responseParts[1]);
    } catch {
      console.warn(
        "⚠️ Could not parse Google News decoder response."
      );

      return null;
    }

    if (!Array.isArray(outerData)) {
      return null;
    }

    const firstResult = outerData[0];

    if (!Array.isArray(firstResult) || typeof firstResult[2] !== "string") {
      console.warn(
        "⚠️ Google News decoder returned no article result."
      );

      return null;
    }

    let articleResult: unknown;

    try {
      articleResult = JSON.parse(firstResult[2]);
    } catch {
      console.warn(
        "⚠️ Could not parse Google News article result."
      );

      return null;
    }

    if (
      !Array.isArray(articleResult) ||
      typeof articleResult[1] !== "string"
    ) {
      console.warn(
        "⚠️ Google News article URL was not returned."
      );

      return null;
    }

    const publisherUrl = articleResult[1].trim();

    if (
      !publisherUrl.startsWith("http://") &&
      !publisherUrl.startsWith("https://")
    ) {
      console.warn(
        "⚠️ Invalid publisher URL:",
        publisherUrl
      );

      return null;
    }

    if (isGoogleNewsUrl(publisherUrl)) {
      console.warn(
        "⚠️ Google returned another Google News URL."
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
      error instanceof Error ? error.message : String(error)
    );

    return null;
  }
}

function extractMetaContent(
  html: string,
  attribute: "property" | "name",
  value: string
): string | null {
  const regex = new RegExp(
    `<meta[^>]+${attribute}=["']${value}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );

  const match = html.match(regex);

  return match?.[1]?.trim() ?? null;
}

function extractTitle(html: string): string {
  const ogTitle = extractMetaContent(
    html,
    "property",
    "og:title"
  );

  if (ogTitle) return decodeHtmlEntities(ogTitle);

  const twitterTitle = extractMetaContent(
    html,
    "name",
    "twitter:title"
  );

  if (twitterTitle) return decodeHtmlEntities(twitterTitle);

  const titleMatch = html.match(
    /<title[^>]*>([\s\S]*?)<\/title>/i
  );

  if (titleMatch?.[1]) {
    return stripHtml(titleMatch[1]);
  }

  return "Tesla News";
}

function extractParagraphs(html: string): string[] {
  const paragraphs: string[] = [];

  const paragraphMatches = html.matchAll(
    /<p\b[^>]*>([\s\S]*?)<\/p>/gi
  );

  for (const match of paragraphMatches) {
    const text = stripHtml(match[1]);

    if (!text || text.length < 40) {
      continue;
    }

    const lower = text.toLowerCase();

    const blocklist = [
      "subscribe to our newsletter",
      "sign up for our newsletter",
      "subscribe now",
      "sign in to continue",
      "log in to continue",
      "all rights reserved",
      "cookie policy",
      "privacy policy",
      "terms of use",
      "advertisement",
      "leave a comment",
      "post a comment",
    ];

    const isBlocked = blocklist.some(
      phrase => lower.includes(phrase)
    );

    if (isBlocked) {
      continue;
    }

    /*
      Reject paragraphs that are obviously
      navigation/UI rather than article text.
    */
    if (
      text.length < 80 &&
      (
        text.includes("|") ||
        text.includes("›") ||
        text.includes("»")
      )
    ) {
      continue;
    }

    paragraphs.push(text);
  }

  return Array.from(
    new Set(paragraphs)
  );
}

function extractJsonLdArticleBody(
  html: string
): string[] {
  const paragraphs: string[] = [];

  const scripts = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const match of scripts) {
    try {
      const json = JSON.parse(
        decodeHtmlEntities(match[1].trim())
      );

      const objects = Array.isArray(json)
        ? json
        : [json];

      for (const item of objects) {
        if (
          item &&
          typeof item === "object" &&
          typeof item.articleBody === "string"
        ) {
          const body = stripHtml(
            item.articleBody
          );

          if (body.length >= 100) {
            paragraphs.push(body);
          }
        }

        /*
          Some websites wrap NewsArticle
          inside @graph.
        */
        if (
          item &&
          typeof item === "object" &&
          Array.isArray(item["@graph"])
        ) {
          for (const graphItem of item["@graph"]) {
            if (
              graphItem &&
              typeof graphItem === "object" &&
              typeof graphItem.articleBody === "string"
            ) {
              const body = stripHtml(
                graphItem.articleBody
              );

              if (body.length >= 100) {
                paragraphs.push(body);
              }
            }
          }
        }
      }
    } catch {
      // Ignore invalid JSON-LD blocks.
    }
  }

  return paragraphs;
}

/* ---------------------------------
   API
--------------------------------- */

export async function GET(req: NextRequest) {
  console.log("✅ TESLITE REWRITE API HIT");

  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    console.error("❌ No URL provided");

    return NextResponse.json(
      { error: "Missing article URL" },
      { status: 400 }
    );
  }

  console.log("🔗 Processing URL:", url);

  try {
    /* ---------------------------------
       FETCH ORIGINAL PAGE
    --------------------------------- */

    /*
     * Google News RSS articles use Google News URLs.
     *
     * The news list intentionally keeps those URLs unresolved
     * because resolving every article during feed loading is slow.
     *
     * When the user actually opens an article, resolve it here
     * before attempting to fetch the article content.
     */
    const articleUrl =
      await resolveArticleUrl(url);

    if (!articleUrl) {
      console.error(
        "❌ Could not resolve article URL:",
        url
      );

      return NextResponse.json(
        {
          error:
            "Could not resolve the original article source",
        },
        { status: 404 }
      );
    }

    console.log(
  "🎯 Article URL to fetch:",
  articleUrl
);

/* ---------------------------------
   CHECK ARTICLE CACHE
--------------------------------- */

const cachedArticle =
  getCachedArticle(articleUrl);

if (cachedArticle) {
  console.log(
    "⚡ Article cache HIT:",
    articleUrl
  );

  return NextResponse.json(
    cachedArticle
  );
}

console.log(
  "🆕 Article cache MISS:",
  articleUrl
);

console.log("📥 Fetching article...");

    let articleHtml = "";

    try {
      const res = await fetch(articleUrl, {
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/132.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (res.ok) {
        const fetchedHtml = await res.text();

        const directParagraphs =
          extractParagraphs(fetchedHtml);

        const directText =
          directParagraphs.join("\n\n").trim();

        const looksLikeChallenge =
          /pardon our interruption|we thought you were a bot|make sure cookies|enable javascript|checking your browser|verify you are human|access denied/i.test(
            fetchedHtml
          );

        if (
          directText.length >= 150 &&
          !looksLikeChallenge
        ) {
          articleHtml = fetchedHtml;

          console.log(
            "✅ Direct article fetch succeeded:",
            res.status
          );

          console.log(
            "📊 Direct fetch usable text:",
            directText.length,
            "chars"
          );
        } else {
          console.warn(
            "⚠️ Direct fetch returned no usable article content:",
            res.status,
            "| text:",
            directText.length,
            "chars"
          );

          if (looksLikeChallenge) {
            console.warn(
              "🛡️ Publisher response appears to be an anti-bot/challenge page"
            );
          }
        }
      } else {
        console.warn(
          "⚠️ Direct article fetch failed:",
          res.status
        );
      }
    } catch (error) {
      console.warn(
        "⚠️ Direct article fetch failed:",
        error instanceof Error ? error.message : error
      );
    }

    /*
     * Some publishers/CDNs cannot be reached directly from the
     * server. Use Jina Reader as a fallback.
     */
    if (!articleHtml) {
      console.log("🔄 Trying Jina Reader fallback...");

      try {
        const jinaUrl =
          `https://r.jina.ai/${articleUrl}`;

        const jinaResponse = await fetch(jinaUrl, {
          method: "GET",
          cache: "no-store",
          signal: AbortSignal.timeout(20000),
          headers: {
            Accept: "text/plain",
            "User-Agent":
              "Mozilla/5.0 (compatible; Teslites/1.0)",
          },
        });

        if (jinaResponse.ok) {
          articleHtml = await jinaResponse.text();

          console.log(
            "✅ Jina Reader fallback succeeded:",
            jinaResponse.status
          );
        } else {
          console.error(
            "❌ Jina Reader fallback failed:",
            jinaResponse.status
          );
        }
      } catch (error) {
        console.error(
          "❌ Jina Reader fallback error:",
          error instanceof Error ? error.message : error
        );
      }
    }

    if (!articleHtml) {
      return NextResponse.json(
        {
          error:
            "Unable to reach article URL",
        },
        { status: 400 }
      );
    }

    const html = articleHtml;

    /* ---------------------------------
       TITLE
    --------------------------------- */

    const title = extractTitle(html);

    console.log("📝 Title extracted:", title);

    /* ---------------------------------
       ARTICLE CONTENT
    --------------------------------- */

   /* ---------------------------------
   ROBUST ARTICLE CONTENT EXTRACTION
--------------------------------- */

const extractionCandidates: {
    source: string;
  paragraphs: string[];
}[] = [];

const extractionStartedAt = Date.now();

/*
  1. Try <article>
*/
const articleMatch = html.match(
  /<article[\s\S]*?<\/article>/i
);

if (articleMatch) {
  const paragraphs = extractParagraphs(
    articleMatch[0]
  );

  console.log(
    "📄 <article> paragraphs:",
    paragraphs.length,
    "chars:",
    paragraphs.join("\n\n").length
  );

  if (paragraphs.length > 0) {
    extractionCandidates.push({
      source: "<article>",
      paragraphs,
    });
  }
}

/*
  2. Try <main>
*/
const mainMatch = html.match(
  /<main[\s\S]*?<\/main>/i
);

if (mainMatch) {
  const paragraphs = extractParagraphs(
    mainMatch[0]
  );

  console.log(
    "📄 <main> paragraphs:",
    paragraphs.length,
    "chars:",
    paragraphs.join("\n\n").length
  );

  if (paragraphs.length > 0) {
    extractionCandidates.push({
      source: "<main>",
      paragraphs,
    });
  }
}

/*
  3. JSON-LD articleBody
*/
const jsonLdParagraphs =
  extractJsonLdArticleBody(html);

console.log(
  "📄 JSON-LD article paragraphs:",
  jsonLdParagraphs.length,
  "chars:",
  jsonLdParagraphs.join("\n\n").length
);

if (jsonLdParagraphs.length > 0) {
  extractionCandidates.push({
    source: "JSON-LD",
    paragraphs: jsonLdParagraphs,
  });
}

/*
  4. Full-page fallback
*/
const fullPageParagraphs =
  extractParagraphs(html);

console.log(
  "📄 Full-page paragraphs:",
  fullPageParagraphs.length,
  "chars:",
  fullPageParagraphs.join("\n\n").length
);

if (fullPageParagraphs.length > 0) {
  extractionCandidates.push({
    source: "full-page",
    paragraphs: fullPageParagraphs,
  });
}

/*
  Choose the extraction containing
  the most article text.
*/
extractionCandidates.sort(
  (a, b) => {
    const aLength =
      a.paragraphs.join("\n\n").length;

    const bLength =
      b.paragraphs.join("\n\n").length;

    return bLength - aLength;
  }
);

const bestExtraction =
  extractionCandidates[0];

let uniqueParagraphs: string[] = [];

if (bestExtraction) {
  uniqueParagraphs =
    bestExtraction.paragraphs;

  console.log(
    "🏆 Best extraction:",
    bestExtraction.source,
    "| paragraphs:",
    uniqueParagraphs.length,
    "| chars:",
    uniqueParagraphs.join("\n\n").length
  );
}

console.log(
  "📊 Final extracted paragraphs:",
  uniqueParagraphs.length
);

console.log(
  "📊 Extracted paragraphs:",
  uniqueParagraphs.length
);

    if (uniqueParagraphs.length < 1) {
      console.error("❌ No paragraphs found");

      return NextResponse.json(
        {
          error:
            "Article content too short or unavailable",
        },
        { status: 404 }
      );
    }

    const articleText =
      uniqueParagraphs.join("\n\n");

      console.log(
  "⏱️ Article extraction time:",
  Date.now() - extractionStartedAt,
  "ms"
);

    if (articleText.length < 150) {
      console.error(
        "❌ Article text too short:",
        articleText.length
      );

      return NextResponse.json(
        { error: "Insufficient article content" },
        { status: 404 }
      );
    }

    console.log(
      "✅ Article text extracted:",
      articleText.length,
      "chars"
    );

    /* ---------------------------------
       CALL TESLITE AI CENTRAL ROUTE
    --------------------------------- */

    console.log(
      "📤 Sending to AI route, article length:",
      articleText.length
    );

    const aiStartedAt = Date.now();

    const aiResponse = await fetch(
      `${req.nextUrl.origin}/api/teslite-ai`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
                    messages: [
            {
  role: "system",
  content: `You are a professional Tesla and automotive technology journalist.

You rewrite news articles completely and accurately.

CRITICAL RESPONSE RULES:

1. Return ONLY valid JSON.
2. Do not explain what you are doing.
3. Do not show your reasoning.
4. Do not write phrases such as "Let's draft" or "Wait".
5. Do not use markdown code blocks.
6. Do not stop writing before the complete article is finished.
7. The body must contain the complete rewritten article.
8. Escape all double quotes correctly inside JSON strings.

Your response must begin with { and end with }.

Use exactly this structure:

{
  "summary": "A concise summary of the article.",
  "body": "The complete rewritten article."
}`,
},
            {
  role: "user",
  content: `Rewrite the article below as a complete, original, professional Tesla and automotive news article.

STRICT REQUIREMENTS:

- Rewrite the ENTIRE article from beginning to end.
- Do not summarize the article in place of rewriting it.
- Do not expose your thinking, drafting process, notes, or instructions.
- Do not say "Wait", "Let's write", "Let's draft", or anything similar.
- Preserve all important facts, names, dates, numbers, statistics, and direct quotes.
- Do not invent information.
- Do not omit important developments or sections.
- Maintain factual accuracy.
- Write naturally like a professional automotive journalist.
- The rewritten body must be substantially complete.
- Return ONLY the JSON object requested by the system instructions.

ARTICLE:

${articleText}`,
},
          ],
        }),
      }
    );

    console.log(
      "📥 AI response status:",
      aiResponse.status
    );

    console.log(
  "⏱️ AI processing time:",
  Date.now() - aiStartedAt,
  "ms"
);

    let summary = "";
let rewrittenBody = "";

if (!aiResponse.ok) {
  const errorText = await aiResponse.text();

  console.warn(
    "⚠️ AI route failed. Using original article:",
    errorText
  );
} else {
  const aiData = await aiResponse.json();

  console.log(
    "🤖 AI response received"
  );

  try {
    const aiText: string =
      typeof aiData.assistant === "string"
        ? aiData.assistant.trim()
        : "";

    if (!aiText) {
      throw new Error("Empty AI response");
    }

    console.log(
      "📝 Raw AI text length:",
      aiText.length
    );

    console.log(
      "🧠 AI response preview:",
      aiText.substring(0, 1000)
    );

    /* ---------------------------------
       CLEAN AI RESPONSE
    --------------------------------- */

    let cleanedAiText = aiText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    /* ---------------------------------
       EXTRACT JSON
    --------------------------------- */

    let parsed: {
      summary?: string;
      body?: string;
      content?: string;
    } | null = null;

    /*
      First attempt:
      Parse the complete response directly.
    */

    try {
      parsed = JSON.parse(cleanedAiText);
    } catch {
      console.warn(
        "⚠️ Direct JSON parse failed"
      );
    }

    /*
      Second attempt:
      Extract the JSON object from surrounding text.
    */

    if (!parsed) {
      const firstBrace =
        cleanedAiText.indexOf("{");

      const lastBrace =
        cleanedAiText.lastIndexOf("}");

      if (
        firstBrace !== -1 &&
        lastBrace !== -1 &&
        lastBrace > firstBrace
      ) {
        const possibleJson =
          cleanedAiText.slice(
            firstBrace,
            lastBrace + 1
          );

        try {
          parsed =
            JSON.parse(possibleJson);

          console.log(
            "✅ JSON extracted from AI response"
          );
        } catch {
          console.warn(
            "⚠️ Extracted JSON parse failed"
          );
        }
      }
    }

    /* ---------------------------------
       USE PARSED RESPONSE
    --------------------------------- */

    if (parsed) {
      summary =
        typeof parsed.summary === "string"
          ? parsed.summary.trim()
          : "";

      rewrittenBody =
        typeof parsed.body === "string"
          ? parsed.body.trim()
          : typeof parsed.content === "string"
            ? parsed.content.trim()
            : "";

      console.log(
        "✅ Parsed AI JSON:",
        {
          summaryLength:
            summary.length,
          bodyLength:
            rewrittenBody.length,
        }
      );
    }

    /* ---------------------------------
       PROTECT AGAINST JSON LEAKS
    --------------------------------- */

    if (rewrittenBody) {
      const looksLikeJson =
        rewrittenBody.includes(
          '"summary"'
        ) ||
        rewrittenBody.includes(
          '"body"'
        ) ||
        rewrittenBody.startsWith("{") ||
        rewrittenBody.startsWith(
          '"summary":'
        );

      if (looksLikeJson) {
        console.warn(
          "⚠️ JSON detected inside article body. Rejecting rewrite."
        );

        rewrittenBody = "";
      }
    }

    /* ---------------------------------
       REWRITE COMPLETENESS CHECK
    --------------------------------- */

    if (
      rewrittenBody &&
      articleText.length > 1000
    ) {
      const rewriteRatio =
        rewrittenBody.length /
        articleText.length;

      console.log(
        "📊 Rewrite ratio:",
        rewriteRatio.toFixed(2)
      );

      /*
        A rewrite can naturally be shorter than
        the original, but it should not be
        dramatically shorter.

        Reject suspiciously incomplete rewrites.
      */

      const MIN_REWRITE_RATIO = 0.30;

      if (
        rewriteRatio <
        MIN_REWRITE_RATIO
      ) {
        console.warn(
          "⚠️ AI rewrite appears incomplete.",
          {
            originalLength:
              articleText.length,
            rewrittenLength:
              rewrittenBody.length,
            ratio:
              rewriteRatio,
          }
        );

        rewrittenBody = "";
      }
    }

    /* ---------------------------------
       CLEAN FINAL BODY
    --------------------------------- */

    if (rewrittenBody) {
      rewrittenBody =
        rewrittenBody
          .replace(
            /^["']?body["']?\s*:\s*/i,
            ""
          )
          .replace(
            /^["']?summary["']?\s*:\s*/i,
            ""
          )
          .replace(
            /^\{+|\}+$/g,
            ""
          )
          .trim();
    }

  } catch (err) {
    console.error(
      "❌ AI parsing error:",
      err
    );

    summary = "";
    rewrittenBody = "";
  }
}

    /* ---------------------------------
       FALLBACK CONTENT
    --------------------------------- */

    if (!summary || summary.length < 20) {
      console.log(
        "🔄 Using original article for summary"
      );

      summary = articleText
        .slice(0, 500)
        .trim();

      if (summary.length > 300) {
        summary =
          summary.substring(0, 300).trim() +
          "...";
      }
    }

    if (
      !rewrittenBody ||
      rewrittenBody.length < 100
    ) {
      console.log(
        "🔄 Using original article for body"
      );

      rewrittenBody = articleText;
    }

    console.log(
      "✅ Final content - summary:",
      summary.length,
      "body:",
      rewrittenBody.length
    );

    if (
      !summary.trim() ||
      !rewrittenBody.trim()
    ) {
      console.error(
        "❌ Empty summary or body after fallback"
      );

      return NextResponse.json(
        {
          error:
            "Unable to extract article content",
        },
        { status: 400 }
      );
    }

    /* ---------------------------------
       FINAL HTML
    --------------------------------- */

    const htmlContent = rewrittenBody
      .split("\n")
      .filter(line => line.trim().length > 0)
      .map(paragraph => {
        const cleaned = paragraph
          .trim()
          .replace(/\s+/g, " ")
          .replace(
            /[\x00-\x08\x0B-\x0C\x0E-\x1F]/g,
            ""
          );

        return `<p>${cleaned}</p>`;
      })
      .join("");

    console.log(
      "✅ HTML content generated:",
      htmlContent.length,
      "chars"
    );

    if (
      !htmlContent ||
      htmlContent.length < 50
    ) {
      console.warn(
        "⚠️ HTML too short, returning plain text"
      );

      const fallbackArticle = {
  title: title.trim(),
  summary: summary.trim(),
  content: `<p>${rewrittenBody}</p>`,
  source: new URL(articleUrl).hostname,
  url: articleUrl,
  publishedAt:
    new Date().toISOString(),
};

setCachedArticle(
  articleUrl,
  fallbackArticle
);

console.log(
  "💾 Fallback article cached for 24 hours:",
  articleUrl
);

return NextResponse.json(
  fallbackArticle
);
    }

    console.log(
  "✅ Article rewrite successful"
);

const finalArticle = {
  title: title.trim(),
  summary: summary.trim(),
  content: htmlContent,
  source: new URL(articleUrl).hostname,
  url: articleUrl,
  publishedAt:
    new Date().toISOString(),
};

setCachedArticle(
  articleUrl,
  finalArticle
);

console.log(
  "💾 Article cached for 24 hours:",
  articleUrl
);

return NextResponse.json(
  finalArticle
);

  } catch (error) {
    console.error(
      "❌ Rewrite error:",
      error
    );

    const errorMsg =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        error: `Article processing failed: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}