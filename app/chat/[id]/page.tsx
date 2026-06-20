"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Message = {
  sender: string;
  text: string;
  time: string;
};

export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Load chat history
  useEffect(() => {
    if (!id) return;

    const stored = localStorage.getItem(`chat_${id}`);
    if (stored) {
      setMessages(JSON.parse(stored));
    }

    const email = localStorage.getItem("teslites_userEmail");
    setUserEmail(email);
  }, [id]);

  const sendMessage = () => {
    if (!input.trim() || !userEmail) return;

    const newMsg: Message = {
      sender: userEmail,
      text: input.trim(),
      time: new Date().toLocaleTimeString(),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    localStorage.setItem(`chat_${id}`, JSON.stringify(updated));
    setInput("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <button
          onClick={() => router.back()}
          className="text-red-500 hover:underline"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold">Chat Room</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-400">No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg max-w-xs ${
              msg.sender === userEmail
                ? "ml-auto bg-green-600 text-white"
                : "mr-auto bg-gray-700 text-gray-100"
            }`}
          >
            <p className="text-sm">{msg.text}</p>
            <span className="block text-xs text-gray-300 mt-1">
              {msg.sender} • {msg.time}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-800 text-white"
        />
        <button
          onClick={sendMessage}
          className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
