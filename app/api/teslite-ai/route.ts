// app/api/teslite-ai/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import OpenAI from "openai";

type Incoming = {
  messages?: { role: string; content: string }[];
  meta?: any;
  model?: string;
};

async function verifyFirebaseToken(authHeader?: string) {
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body: Incoming = await req.json();
    const messages = body.messages ?? [];
    const requestedModel = body.model || "gpt-4o-mini";

    console.log("📨 Received request - messages:", messages.length, "model:", requestedModel);

    // Optional Firebase verification
    const authHeader = req.headers.get("authorization") ?? undefined;
    try {
      await verifyFirebaseToken(authHeader);
    } catch {}

    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OpenAI API key not configured");
      return NextResponse.json(
        { error: "OpenAI API key is not configured on the server." },
        { status: 500 }
      );
    }

    // Filter and validate messages
    const validMessages = messages.filter(m => {
      if (!m || !m.content) {
        console.warn("⚠️ Skipping invalid message");
        return false;
      }
      return true;
    });

    if (validMessages.length === 0) {
      console.error("❌ No valid messages provided");
      return NextResponse.json(
        { error: "No valid messages to process" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build chat messages with strict validation
    const chatMessages: any[] = [
      {
        role: "system",
        content:
          "You are Teslite AI, an innovation assistant for an app called Teslites. You help users brainstorm ideas, design features, and build tech products practically. Always reply concisely and suggest clear next steps.",
      },
      ...validMessages.map((m) => {
        const role = m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user";
        return {
          role,
          content: String(m.content).trim(),
        };
      }),
    ];

    console.log("📤 Sending to OpenAI:", chatMessages.length, "messages");

    const completion = await openai.chat.completions.create({
      model: requestedModel,
      messages: chatMessages,
      max_tokens: 700,
      temperature: 0.5,
    });

    const assistant = completion.choices?.[0]?.message?.content ?? "";
    
    console.log("✅ OpenAI response received:", assistant.length, "chars");

    return NextResponse.json({ assistant });
  } catch (err: any) {
    console.error("❌ Teslite AI route error:", err?.message || err);
    if (err?.error) console.error("OpenAI error details:", err.error);
    return NextResponse.json(
      { error: err?.message || "Server error on Teslite AI route" },
      { status: 500 }
    );
  }
}
