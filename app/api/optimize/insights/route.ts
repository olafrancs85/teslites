import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import OpenAI from "openai";

type Insight = {
  title: string;
  action: string;
  confidence: "low" | "medium" | "high";
  reason: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { marketSummary, signals } = body;

    if (!signals) {
      return NextResponse.json(
        { error: "Missing signals data" },
        { status: 400 }
      );
    }

    /* -------------------------------
       TRY AI FIRST
    -------------------------------- */
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.4,
          max_tokens: 400,
          messages: [
            {
              role: "system",
              content: `
You are a Tesla market intelligence analyst.

TASK:
- Generate 1–3 actionable insights
- Each insight must include:
  title, action, confidence (low|medium|high), reason
- Base insights ONLY on provided signals and summary
- Be concise and practical
- Output VALID JSON array only
`
            },
            {
              role: "user",
              content: JSON.stringify({ marketSummary, signals })
            }
          ]
        });

        const raw = completion.choices[0]?.message?.content ?? "";
        const jsonMatch = raw.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
          const insights: Insight[] = JSON.parse(jsonMatch[0]);
          return NextResponse.json({ insights, source: "ai" });
        }
      } catch (err) {
        console.warn("⚠️ AI insights failed, using fallback");
      }
    }

    /* -------------------------------
       FALLBACK (DETERMINISTIC)
    -------------------------------- */
    const fallbackInsights: Insight[] = [];

    if (signals.trend === "bullish") {
      fallbackInsights.push({
        title: "Bullish Trend Identified",
        action: "Monitor Tesla for potential short-term entry",
        confidence: "medium",
        reason: "Overall trend signal indicates upward movement"
      });
    }

    if (signals.rsi && signals.rsi > 60) {
      fallbackInsights.push({
        title: "Strong Momentum Signal",
        action: "Avoid late entry; wait for pullbacks",
        confidence: "medium",
        reason: "RSI above 60 suggests strong but potentially stretched momentum"
      });
    }

    if (!fallbackInsights.length) {
      fallbackInsights.push({
        title: "Neutral Market Conditions",
        action: "Hold position and wait for clearer signals",
        confidence: "low",
        reason: "No strong indicators detected at this time"
      });
    }

    return NextResponse.json({
      insights: fallbackInsights,
      source: "fallback"
    });

  } catch (err: any) {
    console.error("Optimus insights error:", err);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
