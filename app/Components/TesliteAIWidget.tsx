// components/TesliteAIWidget.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  createdAt?: number;
};

type Props = {
  initialContext?: string; // pass innovation text when opening from a context button
  defaultModel?: string; // allow specifying default model
};

export default function TesliteAIWidget({ initialContext, defaultModel = "gpt-4o-mini" }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() =>
    initialContext
      ? [
          {
            id: "system-ctx",
            role: "system",
            text: "Context: " + initialContext,
            createdAt: Date.now(),
          },
        ]
      : []
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUserId(u ? u.uid : null));
    return () => unsub();
  }, []);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, open]);

  useEffect(() => {
    if (!initialContext) return;
    setMessages((m) => {
      const has = m.find((x) => x.id === "system-ctx");
      if (has) {
        return m.map((x) => (x.id === "system-ctx" ? { ...x, text: "Context: " + initialContext } : x));
      }
      return [
        {
          id: "system-ctx",
          role: "system",
          text: "Context: " + initialContext,
          createdAt: Date.now(),
        },
        ...m,
      ];
    });
    setOpen(true);
  }, [initialContext]);

  const sendMessage = async (text: string, model: string = defaultModel) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: "u-" + Date.now(), role: "user", text, createdAt: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken(false) : null;

      const res = await fetch("/api/teslite-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          messages: [...messages.filter((m) => m.role !== "assistant"), userMsg].map((m) => ({
            role: m.role,
            content: m.text,
          })),
          model,
          meta: { userId },
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "AI API error");
      }

      const data = await res.json();
      const assistantText = data.assistant ?? "Sorry — I couldn't process that.";

      setMessages((m) => [...m, { id: "a-" + Date.now(), role: "assistant", text: assistantText, createdAt: Date.now() }]);
    } catch (err: any) {
      console.error("Teslite AI error:", err);
      setMessages((m) => [
        ...m,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          text: err?.message || "There was an error contacting the AI service. Try again later.",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            aria-label="Open Teslite AI"
            className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-2 shadow-2xl ring-1 ring-slate-700"
            title="Ask Teslite AI"
          >
            <div className="flex flex-col items-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:scale-105">
                <path d="M12 2C7.03 2 3 6.03 3 11c0 3.6 2.16 6.69 5.25 8.05L8.5 22l3.07-1.61C12.86 20.52 12.93 20.5 13 20.5c4.97 0 9-4.03 9-9s-4.03-9-9-9z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="11" r="2" fill="white" />
              </svg>
              <span className="text-xs text-slate-300 mt-1">AI</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} className="w-[380px] max-w-[92vw]">
            <div className="flex h-[520px] flex-col overflow-hidden rounded-2xl bg-slate-900/95 ring-1 ring-slate-700 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-white">Teslite AI</div>
                  <div className="text-xs text-slate-400">Your innovation copilot</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setMessages([])} className="text-xs text-slate-400 hover:text-white" title="Clear chat">Clear</button>
                  <button onClick={() => setOpen(false)} className="rounded-full p-1 text-slate-300 hover:bg-slate-800" title="Close">✕</button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-auto px-4 py-2">
                <div className="flex flex-col gap-3">
                  {messages.length === 0 && (
                    <div className="mt-6 text-center text-sm text-slate-400">
                      Hello 👋 I’m Teslite AI — ask me to refine ideas, suggest next steps, or estimate impact.
                    </div>
                  )}

                  {messages.map((m) => (
                    <div key={m.id} className={`max-w-full ${m.role === "user" ? "self-end" : "self-start"}`}>
                      <div className={`rounded-2xl px-3 py-2 text-sm leading-6 ${m.role === "user" ? "bg-slate-800 text-white" : "bg-white/5 text-slate-200"}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="self-start">
                      <div className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-slate-400">Teslite AI is typing...</div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="border-t border-slate-800 px-3 py-3">
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask the AI (e.g. Improve my idea summary)..."
                    className="flex-1 rounded-full bg-slate-800/80 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    aria-label="Enter message to Teslite AI"
                  />
                  <button type="submit" disabled={loading} className="rounded-full bg-slate-700/80 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                    {loading ? "..." : "Send"}
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <div>Signed in: {userId ?? "guest"}</div>
                  <div>Model: {defaultModel}</div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
