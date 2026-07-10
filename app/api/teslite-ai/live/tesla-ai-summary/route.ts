import { NextResponse } from "next/server";

// Optional: install openai package first: npm i openai
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // required if using OpenAI
});

export async function GET() {
  try {
    // 1️⃣ Fetch top market-moving Tesla news
    const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const res = await fetch(`${baseUrl}/api/teslite-ai/live/tesla-news`, {
  cache: "no-store",
});

const data = await res.json();
const news = data.news || [];

    if (!news.length) {
      return NextResponse.json({
        summary: "No significant Tesla news at the moment.",
        confidence: "Medium",
      });
    }

        // 2️⃣ Take the latest 3 Tesla news articles
    const latestNews = news.slice(0, 3);

    // 3️⃣ Confidence based on number of articles
    let confidence: "Low" | "Medium" | "High" = "Medium";

    if (latestNews.length >= 3) confidence = "High";
    else if (latestNews.length === 2) confidence = "Medium";
    else confidence = "Low";

    // 4️⃣ Compose OpenAI prompt
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

    // 5️⃣ Generate AI summary
    let summary = "";

    if (process.env.OPENAI_API_KEY) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      });

      summary =
        completion.choices?.[0]?.message?.content?.trim() ?? "";
    }

    // 6️⃣ Fallback summary
    if (!summary) {
      summary = latestNews
        .map((n: any) => `• ${n.title}`)
        .join("\n");
    }

    // 7️⃣ Return
    return NextResponse.json({
      summary,
      confidence,
    });
  } catch (err) {
    console.error("Tesla AI summary error:", err);

    return NextResponse.json({
      summary: "Unable to fetch Tesla news at the moment.",
      confidence: "Medium",
    });
  }
}
