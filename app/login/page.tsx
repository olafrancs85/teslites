"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function LoginSignupPage() {
  const router = useRouter();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupUsername, setSignupUsername] = useState("");

  // UI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Helpers
  const saveLocalUser = (uid?: string | null, email?: string | null, username?: string | null) => {
    if (uid) localStorage.setItem("teslites_uid", uid);
    else localStorage.removeItem("teslites_uid");

    if (email) localStorage.setItem("teslites_userEmail", email);
    else localStorage.removeItem("teslites_userEmail");

    if (username) localStorage.setItem("teslites_username", username);
    else localStorage.removeItem("teslites_username");
  };

  // Login
  const handleLogin = async () => {
    setMessage(null);
    if (!loginEmail || !loginPassword) {
      setMessage("Please provide email and password.");
      return;
    }
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const uid = userCred.user.uid;

      // fetch username from Firestore
      const userDoc = await getDoc(doc(db, "users", uid));
      const username = userDoc.exists() ? userDoc.data().username : null;

      saveLocalUser(uid, loginEmail, username);
      setMessage("✅ Login successful — redirecting...");
      router.push("/");

    } catch (err: any) {
      console.error("Login error:", err);
      setMessage("❌ " + (err?.message || "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  // Signup
  const handleSignup = async () => {
    setMessage(null);
    if (!signupEmail || !signupPassword || !signupUsername) {
      setMessage("Please provide email, username and password for signup.");
      return;
    }
    if (signupPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (signupPassword !== signupConfirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      const uid = userCred.user.uid;

      // Save username in Firestore
      await setDoc(doc(db, "users", uid), {
        email: signupEmail,
        username: signupUsername,
        createdAt: new Date(),
      });

      saveLocalUser(uid, signupEmail, signupUsername);
setMessage("✅ Signup successful — redirecting...");
router.push("/"); // redirect to Homepage

    } catch (err: any) {
      console.error("Signup error:", err);
      setMessage("❌ " + (err?.message || "Signup failed"));
    } finally {
      setLoading(false);
    }
  };

  // Google login
  const handleGoogleLogin = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user?.email || null;
      const uid = result.user?.uid;

      let username: string | null = null;

      if (uid) {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          username = userDoc.data().username;
        } else if (email) {
          // fallback: create one based on email prefix
          username = email.split("@")[0];
          await setDoc(doc(db, "users", uid), {
            email,
            username,
            createdAt: new Date(),
          });
        }
      }

      saveLocalUser(uid, email, username);
      setMessage("✅ Google login successful — redirecting...");
      router.push("/marketplace");
    } catch (err: any) {
      console.error("Google login error:", err);
      setMessage("❌ " + (err?.message || "Google login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-3xl grid md:grid-cols-2 gap-8">
        {/* Login Column */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Login</h2>

          <input
            className="w-full p-2 mb-3 rounded bg-gray-800 text-white"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />
          <input
            className="w-full p-2 mb-4 rounded bg-gray-800 text-white"
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />

          <div className="flex gap-3">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              {loading ? "Working..." : "Login"}
            </button>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
            >
              {loading ? "Working..." : "Login with Google"}
            </button>
          </div>

          <p className="text-sm text-gray-400 mt-3">
            New user? Use the Signup form on the right to create an account.
          </p>
        </div>

        {/* Signup Column */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Signup</h2>

          <input
            className="w-full p-2 mb-3 rounded bg-gray-800 text-white"
            placeholder="Username"
            value={signupUsername}
            onChange={(e) => setSignupUsername(e.target.value)}
          />
          <input
            className="w-full p-2 mb-3 rounded bg-gray-800 text-white"
            placeholder="Email"
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
          />
          <input
            className="w-full p-2 mb-3 rounded bg-gray-800 text-white"
            type="password"
            placeholder="Password (min 6 chars)"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
          />
          <input
            className="w-full p-2 mb-4 rounded bg-gray-800 text-white"
            type="password"
            placeholder="Confirm Password"
            value={signupConfirm}
            onChange={(e) => setSignupConfirm(e.target.value)}
          />

          <button
            onClick={handleSignup}
            disabled={loading}
            className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
          >
            {loading ? "Working..." : "Signup"}
          </button>

          <p className="text-sm text-gray-400 mt-3">
            By signing up you create an account that can list and manage items.
          </p>
        </div>

        {/* Global message row */}
        <div className="md:col-span-2">
          {message && (
            <div className="mt-4 p-3 rounded bg-gray-800 text-white">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
