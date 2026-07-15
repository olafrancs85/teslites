// app/api/teslite-ai/rewrite/route.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/* ---------------------------------
   HTML HELPERS
--------------------------------- */

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
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
    /<p[^>]*>([\s\S]*?)<\/p>/gi
  );

  for (const match of paragraphMatches) {
    const text = stripHtml(match[1]);

    if (!text || text.length < 30) {
      continue;
    }

    const lower = text.toLowerCase();

    const blocklist = [
      "subscribe",
      "newsletter",
      "sign in",
      "sign up",
      "log in",
      "editor",
      "copyright",
      "all rights reserved",
      "cookie",
      "advertisement",
      "comments",
      "discussion",
    ];

    const isBlocked = blocklist.some(word =>
      lower.includes(word)
    );

    if (!isBlocked) {
      paragraphs.push(text);
    }
  }

  return Array.from(new Set(paragraphs));
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

    let html: string;

    try {
      console.log("📥 Fetching article...");

      const res = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      console.log("📊 Fetch status:", res.status);

      if (!res.ok) {
        console.error(`❌ Fetch failed: ${res.status}`);

        return NextResponse.json(
          {
            error: `Failed to fetch article (${res.status})`,
          },
          { status: res.status }
        );
      }

      html = await res.text();

      console.log(
        "✅ HTML fetched:",
        html.length,
        "chars"
      );
    } catch (fetchErr) {
      console.error("❌ Fetch error:", fetchErr);

      return NextResponse.json(
        { error: "Unable to reach article URL" },
        { status: 400 }
      );
    }

    /* ---------------------------------
       TITLE
    --------------------------------- */

    const title = extractTitle(html);

    console.log("📝 Title extracted:", title);

    /* ---------------------------------
       ARTICLE CONTENT
    --------------------------------- */

    const articleMatch =
      html.match(/<article[\s\S]*?<\/article>/i) ||
      html.match(/<main[\s\S]*?<\/main>/i);

    const articleHtml = articleMatch?.[0] ?? html;

    const uniqueParagraphs =
      extractParagraphs(articleHtml);

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

    const aiResponse = await fetch(
      `${req.nextUrl.origin}/api/teslite-ai`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a Tesla and automotive technology journalist.

IMPORTANT: You MUST respond ONLY with valid JSON in this exact format:
{"summary": "brief summary here", "body": "full article here"}

Do not include any markdown, code blocks, or extra text.`,
            },
            {
              role: "user",
              content:
                `Rewrite this article as a professional news piece:\n\n${articleText}`,
            },
          ],
        }),
      }
    );

    console.log(
      "📥 AI response status:",
      aiResponse.status
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
        "🤖 AI response received, key:",
        Object.keys(aiData)[0]
      );

      try {
        const aiText: string =
          typeof aiData.assistant === "string"
            ? aiData.assistant
            : "";

        if (!aiText.trim()) {
          throw new Error("Empty AI response");
        }

        console.log(
          "📝 Raw AI text length:",
          aiText.length
        );

        let parsed: {
          summary?: string;
          body?: string;
          content?: string;
        } | null = null;

        try {
          const jsonMatch =
            aiText.match(/\{[\s\S]*\}/);

          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          }
        } catch {
          console.warn(
            "⚠️ JSON parse failed, trying text fallback"
          );
        }

        if (parsed) {
          summary =
            parsed.summary?.trim() ?? "";

          rewrittenBody =
            (
              parsed.body ??
              parsed.content ??
              ""
            ).trim();

          console.log(
            "✅ Parsed JSON - summary:",
            summary.length,
            "body:",
            rewrittenBody.length
          );
        }

        if (
          !rewrittenBody ||
          rewrittenBody.length < 100
        ) {
          console.log(
            "📌 Using text fallback"
          );

          const blocks = aiText
            .split("\n")
            .map(block => block.trim())
            .filter(block => block.length > 20);

          if (blocks.length > 1) {
            summary = blocks[0];
            rewrittenBody =
              blocks.slice(1).join("\n\n");
          } else if (blocks.length > 0) {
            rewrittenBody = blocks.join("\n\n");
          }
        }
      } catch (err) {
        console.error(
          "❌ AI parsing error:",
          err
        );
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

      return NextResponse.json({
        title: title.trim(),
        summary: summary.trim(),
        content: `<p>${rewrittenBody}</p>`,
        source: new URL(url).hostname,
        url,
        publishedAt:
          new Date().toISOString(),
      });
    }

    console.log(
      "✅ Article rewrite successful"
    );

    return NextResponse.json({
      title: title.trim(),
      summary: summary.trim(),
      content: htmlContent,
      source: new URL(url).hostname,
      url,
      publishedAt:
        new Date().toISOString(),
    });
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