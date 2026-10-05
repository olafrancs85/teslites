import { NextResponse } from "next/server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    // 1️⃣ Fetch Tesla news
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const res = await fetch(
      `${baseUrl}/api/teslite-ai/live/tesla-news`,
      {
        cache: "no-store",
      }
    );

    const data = await res.json();
    const news = data.news || [];

    if (!news.length) {
      return NextResponse.json({
        summary: "No significant Tesla news at the moment.",
        confidence: "Medium",
      });
    }

    // 2️⃣ Take latest 3 Tesla news articles
    const latestNews = news.slice(0, 3);

    // 3️⃣ Confidence based on number of articles
    let confidence: "Low" | "Medium" | "High" = "Medium";

    if (latestNews.length >= 3) {
      confidence = "High";
    } else if (latestNews.length === 2) {
      confidence = "Medium";
    } else {
      confidence = "Low";
    }

    // 4️⃣ Fallback summary
    const fallbackSummary =
      "Tesla's latest news flow is being monitored for potential market impact.";

    // 5️⃣ Try OpenAI only if an API key exists
    let summary = "";

    if (process.env.OPENAI_API_KEY) {
      try {
        const prompt = `
You are a Tesla financial analyst.

Summarize the following Tesla news in 2–3 sentences.

${latestNews
  .map(
    (n: any) =>
      `Title: ${n.title}
Description: ${n.description ?? "No description"}`
  )
  .join("\n\n")}

Explain the overall market outlook in plain English.
`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.5,
        });

        summary =
          completion.choices?.[0]?.message?.content?.trim() ?? "";
      } catch (error: any) {
        if (
          error?.code === "insufficient_quota" ||
          error?.status === 429
        ) {
          console.warn(
            "OpenAI quota unavailable. Using fallback Tesla summary."
          );
        } else {
          console.error(
            "OpenAI summary generation failed:",
            error
          );
        }
      }
    }

    // 6️⃣ Fallback if OpenAI fails
    if (!summary) {
      summary = fallbackSummary;
    }

    // 7️⃣ Return
    return NextResponse.json({
      summary,
      confidence,
    });
  } catch (err) {
    console.error("Tesla AI summary error:", err);

    return NextResponse.json({
      summary:
        "Unable to generate Tesla AI summary at the moment.",
      confidence: "Medium",
    });
  }
}