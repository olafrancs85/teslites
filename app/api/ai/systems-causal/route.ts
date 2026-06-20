// app/api/ai/systems-causal/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = completion.choices[0].message?.content;

    // Expecting AI to return JSON with summary & drivers
    let parsed;
    try {
      parsed = JSON.parse(content || "{}");
    } catch {
      parsed = { summary: content || "", drivers: [] };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ summary: "", drivers: [] }, { status: 500 });
  }
}
