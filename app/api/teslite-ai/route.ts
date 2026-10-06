// app/api/teslite-ai/route.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

type Incoming = {
  messages?: {
    role: string;
    content: string;
  }[];
  meta?: any;
  model?: string;
};

async function verifyFirebaseToken(authHeader?: string) {
  return null;
}

/* =========================================================
   GEMINI
========================================================= */

async function callGemini(
  messages: {
    role: string;
    content: string;
  }[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  /*
   * Convert our internal messages into Gemini's format.
   *
   * Gemini does not use the OpenAI-style "system" message
   * in the same way, so we keep the system instruction
   * separately and send the conversation as contents.
   */

  const systemMessages = messages
  .filter((m) => m.role === "system")
  .map((m) => m.content.trim())
  .filter(Boolean);

const systemMessage =
  systemMessages.join("\n\n") ||
  "You are Teslite AI, an innovation assistant for an app called Teslites. Follow the user's instructions carefully.";

  const conversationMessages = messages.filter(
    (m) => m.role !== "system"
  );

  const contents = conversationMessages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [
      {
        text: String(message.content).trim(),
      },
    ],
  }));

  console.log(
    "📤 Sending to Gemini:",
    contents.length,
    "messages"
  );

  /*
   * Gemini 3.5 Flash is a good default for Teslites:
   * fast, inexpensive, and strong enough for rewriting,
   * summarization and general AI assistance.
   */

  const response = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",

  contents,

  config: {
    systemInstruction: systemMessage,

    temperature: 0.4,

    maxOutputTokens: 6000,

    responseMimeType: "application/json",
  },
});

  const text = response.text ?? "";

  if (!text.trim()) {
    throw new Error("Gemini returned an empty response");
  }

  console.log(
    "✅ Gemini response received:",
    text.length,
    "chars"
  );

  return text.trim();
}

/* =========================================================
   API
========================================================= */

export async function POST(req: NextRequest) {
  try {
    const body: Incoming = await req.json();

    const messages = body.messages ?? [];

    console.log(
      "📨 Received request - messages:",
      messages.length,
      "requested model:",
      body.model ?? "default"
    );

    /* ---------------------------------------------
       OPTIONAL FIREBASE VERIFICATION
    --------------------------------------------- */

    const authHeader =
      req.headers.get("authorization") ?? undefined;

    try {
      await verifyFirebaseToken(authHeader);
    } catch {
      // Authentication is optional for now.
    }

    /* ---------------------------------------------
       VALIDATE MESSAGES
    --------------------------------------------- */

    const validMessages = messages.filter((message) => {
      if (!message || !message.content) {
        console.warn(
          "⚠️ Skipping invalid message"
        );

        return false;
      }

      return true;
    });

    if (validMessages.length === 0) {
      console.error(
        "❌ No valid messages provided"
      );

      return NextResponse.json(
        {
          error:
            "No valid messages to process",
        },
        {
          status: 400,
        }
      );
    }

    /* ---------------------------------------------
       NORMALIZE MESSAGES
    --------------------------------------------- */

    const normalizedMessages = validMessages.map(
      (message) => ({
        role:
          message.role === "assistant"
            ? "assistant"
            : message.role === "system"
            ? "system"
            : "user",

        content: String(message.content).trim(),
      })
    );

    /* =====================================================
       PRIMARY PROVIDER — GEMINI
    ===================================================== */

    try {
      console.log(
        "🤖 Attempting Gemini..."
      );

      const assistant =
        await callGemini(
          normalizedMessages
        );

      console.log(
        "✅ Gemini succeeded"
      );

      /*
       * IMPORTANT:
       * Keep the exact response contract
       * expected by rewrite/route.ts and
       * other Teslite components.
       */

      return NextResponse.json({
        assistant,
        provider: "gemini",
      });
    } catch (geminiError: any) {
      console.error(
        "❌ Gemini failed:",
        geminiError?.message ||
          geminiError
      );
    }

    /* =====================================================
       SECONDARY PROVIDER
       
       We will add Groq here next.
       ===================================================== */

    console.warn(
      "⚠️ Gemini failed. No secondary provider configured yet."
    );

    /*
     * If Gemini fails and OpenAI still has credits,
     * we can temporarily use OpenAI as a final provider.
     *
     * This keeps the existing system functional while
     * we add Groq.
     */

    if (process.env.OPENAI_API_KEY) {
      try {
        console.log(
          "🔄 Attempting OpenAI fallback..."
        );

        const OpenAI =
          (await import("openai")).default;

        const openai = new OpenAI({
          apiKey:
            process.env.OPENAI_API_KEY,
        });

        const completion =
          await openai.chat.completions.create(
            {
              model: "gpt-4o-mini",

              messages:
                normalizedMessages as any,

              max_tokens: 2000,

              temperature: 0.5,
            }
          );

        const assistant =
          completion.choices?.[0]
            ?.message?.content ?? "";

        if (!assistant.trim()) {
          throw new Error(
            "OpenAI returned an empty response"
          );
        }

        console.log(
          "✅ OpenAI fallback succeeded"
        );

        return NextResponse.json({
          assistant: assistant.trim(),
          provider: "openai",
        });
      } catch (openaiError: any) {
        console.error(
          "❌ OpenAI fallback failed:",
          openaiError?.message ||
            openaiError
        );
      }
    }

    /* ---------------------------------------------
       ALL PROVIDERS FAILED
    --------------------------------------------- */

    return NextResponse.json(
      {
        error:
          "All AI providers are currently unavailable.",
      },
      {
        status: 503,
      }
    );
  } catch (err: any) {
    console.error(
      "❌ Teslite AI route error:",
      err?.message || err
    );

    return NextResponse.json(
      {
        error:
          err?.message ||
          "Server error on Teslite AI route",
      },
      {
        status: 500,
      }
    );
  }
}