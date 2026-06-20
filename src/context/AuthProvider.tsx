// context/AuthProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

type AuthContextType = {
  user: User | null;
  claims: Record<string, any> | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // fetch claims (admin, etc.)
        const tokenResult = await u.getIdTokenResult(true);
        setUser(u);
        setClaims(tokenResult.claims);

        // keep localStorage in sync for components that still rely on it
        localStorage.setItem("teslites_uid", u.uid);
        if (u.email) localStorage.setItem("teslites_userEmail", u.email);
      } else {
        setUser(null);
        setClaims(null);

        localStorage.removeItem("teslites_uid");
        localStorage.removeItem("teslites_userEmail");
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("teslites_uid");
      localStorage.removeItem("teslites_userEmail");
      localStorage.removeItem("teslites_username");
      setUser(null);
      setClaims(null);
    } catch (err) {
      console.error("Logout failed", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, claims, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
