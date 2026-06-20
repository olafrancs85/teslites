// app/api/teslite-ai/rewrite/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import jsdom from "jsdom";

const { JSDOM } = jsdom;

export async function GET(req: NextRequest) {
  console.log("✅ TESLITE REWRITE API HIT");

  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    console.error("❌ No URL provided");
    return NextResponse.json({ error: "Missing article URL" }, { status: 400 });
  }

  console.log("🔗 Processing URL:", url);

  try {
    /* ---------------------------------
       FETCH ORIGINAL PAGE
    --------------------------------- */
    let html: string;
    try {
      console.log("📥 Fetching article...");
      const res = await fetch(url, { redirect: "follow" });
      console.log("📊 Fetch status:", res.status);
      
      if (!res.ok) {
        console.error(`❌ Fetch failed: ${res.status}`);
        return NextResponse.json(
          { error: `Failed to fetch article (${res.status})` },
          { status: res.status }
        );
      }
      html = await res.text();
      console.log("✅ HTML fetched:", html.length, "chars");
    } catch (fetchErr) {
      console.error("❌ Fetch error:", fetchErr);
      return NextResponse.json(
        { error: "Unable to reach article URL" },
        { status: 400 }
      );
    }

    const dom = new JSDOM(html);
    const document = dom.window.document;

    /* ---------------------------------
       TITLE
    --------------------------------- */
    const title =
      document.querySelector("meta[property='og:title']")?.getAttribute("content") ||
      document.querySelector("meta[name='twitter:title']")?.getAttribute("content") ||
      document.querySelector("title")?.textContent?.trim() ||
      "Tesla News";

    console.log("📝 Title extracted:", title);

    /* ---------------------------------
       EXTRACT CONTENT CLEANLY
    --------------------------------- */
    document
      .querySelectorAll(
        "nav, header, footer, aside, form, button, input, script, style, noscript, .ads, .advertisement, .sidebar"
      )
      .forEach(el => el.remove());

    const articleRoot =
      document.querySelector("article") ||
      document.querySelector("[role='main']") ||
      document.querySelector("main") ||
      document.body;

    const paragraphs = Array.from(articleRoot.querySelectorAll("p"))
      .map(p => {
        const text = p.textContent?.trim() ?? "";
        return text.replace(/\s+/g, " ");
      })
      .filter((p): p is string => {
        if (!p || p.length < 30) return false; // Lowered from 40 to 30
        const lower = p.toLowerCase();
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
        return !blocklist.some(word => lower.includes(word));
      });

    const uniqueParagraphs = Array.from(new Set(paragraphs));
    
    console.log("📊 Extracted paragraphs:", uniqueParagraphs.length);
    
    if (uniqueParagraphs.length < 1) {
      console.error("❌ No paragraphs found");
      return NextResponse.json(
        { error: "Article content too short or unavailable" },
        { status: 404 }
      );
    }

    const articleText = uniqueParagraphs.join("\n\n");

    if (articleText.length < 150) { // Lowered from 200
      console.error("❌ Article text too short:", articleText.length);
      return NextResponse.json(
        { error: "Insufficient article content" },
        { status: 404 }
      );
    }

    console.log("✅ Article text extracted:", articleText.length, "chars");

    /* ---------------------------------
       CALL TESLITE AI CENTRAL ROUTE
    --------------------------------- */
    console.log("📤 Sending to AI route, article length:", articleText.length);
    
    const aiResponse = await fetch(`${req.nextUrl.origin}/api/teslite-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a Tesla and automotive technology journalist.

IMPORTANT: You MUST respond ONLY with valid JSON in this exact format:
{"summary": "brief summary here", "body": "full article here"}

Do not include any markdown, code blocks, or extra text.`
          },
          { role: "user", content: `Rewrite this article as a professional news piece:\n\n${articleText}` }
        ]
      }),
    });

    console.log("📥 AI response status:", aiResponse.status);
    
    let summary = "";
    let rewrittenBody = "";
    
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.warn("⚠️ AI route failed (status", aiResponse.status + "), using original article:", errorText);
      // Gracefully fallback to original article instead of failing
    } else {
      const aiData = await aiResponse.json();
      console.log("🤖 AI response received, key:", Object.keys(aiData)[0]);

      /* ---------------------------------
         PARSE AI RESPONSE
      --------------------------------- */
      try {
        let aiText: string = aiData.assistant ?? "";
        
        if (!aiText || aiText.trim().length === 0) {
          console.warn("⚠️ Empty AI response, using fallback");
          throw new Error("Empty AI response");
        }

        console.log("📝 Raw AI text length:", aiText.length);

        // Attempt to parse JSON
        let parsed: any = null;
        try {
          const jsonMatch = aiText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            console.log("✅ Found JSON in response");
            parsed = JSON.parse(jsonMatch[0]);
          }
        } catch (jsonErr) {
          console.warn("⚠️ JSON parse failed, trying text fallback");
        }

        if (parsed && typeof parsed === "object") {
          summary = (parsed.summary ?? parsed.Summary ?? "").toString().trim();
          rewrittenBody = (parsed.body ?? parsed.Body ?? parsed.content ?? "").toString().trim();
          console.log("✅ Parsed JSON - summary:", summary.length, "body:", rewrittenBody.length);
        }

        // Text fallback
        if (!rewrittenBody || rewrittenBody.length < 100) {
          console.log("📌 Using text fallback");
          const blocks = aiText
            .split("\n")
            .filter(b => b.trim().length > 20)
            .map(b => b.trim());
          
          if (blocks.length > 1) {
            summary = blocks[0];
            rewrittenBody = blocks.slice(1).join("\n\n");
          } else if (blocks.length > 0) {
            rewrittenBody = blocks.join("\n\n");
          }
        }
      } catch (err) {
        console.error("❌ AI parsing error:", err);
      }
    }

    // Always ensure we have content
    if (!summary || summary.length < 20) {
      console.log("🔄 Using original article for summary");
      summary = articleText.slice(0, 500).trim();
      if (summary.length > 300) {
        summary = summary.substring(0, 300).trim() + "...";
      }
    }
    if (!rewrittenBody || rewrittenBody.length < 100) {
      console.log("🔄 Using original article for body");
      rewrittenBody = articleText;
    }

    console.log("✅ Final content - summary:", summary.length, "body:", rewrittenBody.length);

    // Final validation
    if (!summary.trim() || !rewrittenBody.trim()) {
      console.error("❌ Empty summary or body after fallback");
      return NextResponse.json(
        { error: "Unable to extract article content" },
        { status: 400 }
      );
    }

    /* ---------------------------------
       FINAL HTML - Clean & Format
    --------------------------------- */
    const htmlContent = rewrittenBody
      .split("\n")
      .filter(line => line.trim().length > 0)
      .map(paragraph => {
        const cleaned = paragraph
          .trim()
          .replace(/\s+/g, " ")
          .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, "");
        return `<p>${cleaned}</p>`;
      })
      .join("");

    console.log("✅ HTML content generated:", htmlContent.length, "chars");

    if (!htmlContent || htmlContent.length < 50) {
      console.warn("⚠️ HTML too short, returning plain text");
      return NextResponse.json({
        title: title.trim(),
        summary: summary.trim(),
        content: `<p>${rewrittenBody}</p>`,
        source: new URL(url).hostname,
        url,
        publishedAt: new Date().toISOString(),
      });
    }

    console.log("✅ Article rewrite successful");
    
    return NextResponse.json({
      title: title.trim(),
      summary: summary.trim(),
      content: htmlContent,
      source: new URL(url).hostname,
      url,
      publishedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Rewrite error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Article processing failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
