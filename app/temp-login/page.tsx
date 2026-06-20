"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TempLoginPage() {
  const [email, setEmail] = useState("");
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("teslites_userEmail");
    if (saved) setCurrentEmail(saved);
  }, []);

  const handleLogin = () => {
    if (!email.trim()) return alert("Enter your email");
    localStorage.setItem("teslites_userEmail", email.trim());
    setCurrentEmail(email.trim());
    setEmail("");
    alert("Logged in as " + email);
    router.push("/marketplace");
  };

  const handleLogout = () => {
    localStorage.removeItem("teslites_userEmail");
    setCurrentEmail(null);
    alert("Logged out");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Temporary Login</h1>

        {currentEmail ? (
          <div>
            <p className="mb-4">
              Currently logged in as:{" "}
              <span className="text-green-400">{currentEmail}</span>
            </p>
            <button
              onClick={handleLogout}
              className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        ) : (
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-2 mb-3 rounded bg-gray-800 text-white"
            />
            <button
              onClick={handleLogin}
              className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 w-full"
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
