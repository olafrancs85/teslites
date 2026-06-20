import { NextResponse } from "next/server";

// Optional: install openai package first: npm i openai
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // required if using OpenAI
});

export async function GET() {
  try {
    // 1️⃣ Fetch top market-moving Tesla news
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/tesla/live`);
    const data = await res.json();
    const news = data.marketMoving || [];

    if (!news.length) {
      return NextResponse.json({
        summary: "No significant Tesla news at the moment.",
        confidence: "Medium",
      });
    }

    // 2️⃣ Sort news by impact descending and take top 3
    const sortedNews = [...news]
      .sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))
      .slice(0, 3);

    // 3️⃣ Compute dynamic confidence
    const maxImpact = Math.max(...sortedNews.map(n => n.impactScore || 0));
    let confidence: "Low" | "Medium" | "High" = "Medium";
    if (maxImpact > 70) confidence = "High";
    else if (maxImpact > 40) confidence = "Medium";
    else confidence = "Low";

    // 4️⃣ Compose OpenAI prompt
    const prompt = `
You are a financial AI analyst. Summarize Tesla news concisely in 2–3 sentences.
Use this information:
${sortedNews.map(
  n => `- ${n.title} (Impact: ${n.impactScore}, Sentiment: ${n.sentiment})`
).join("\n")}

Output a short market summary in plain English, highlighting key headlines and sentiment.
`;

    // 5️⃣ Generate AI summary via OpenAI (if key is set)
    let summary = "";
    if (process.env.OPENAI_API_KEY) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      // ✅ TypeScript-safe access to content
      summary =
        completion.choices?.[0]?.message?.content?.trim() || "";
    }

    // 6️⃣ Fallback to rule-based summary if OpenAI fails or not configured
    if (!summary) {
      const bullish = sortedNews.filter(n => n.sentiment === "BULLISH").length;
      const bearish = sortedNews.filter(n => n.sentiment === "BEARISH").length;

      summary =
        `Top news: ${sortedNews[0].title}. ` +
        `Signals: ${bullish} bullish, ${bearish} bearish. ` +
        "Monitor closely for market impact.";
    }

    // 7️⃣ Return JSON
    return NextResponse.json({ summary, confidence });
  } catch (err) {
    console.error("Tesla AI summary error:", err);

    return NextResponse.json({
      summary: "Unable to fetch Tesla news at the moment.",
      confidence: "Medium",
    });
  }
}
