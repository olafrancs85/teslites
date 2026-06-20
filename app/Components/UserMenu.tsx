"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchUser = async () => {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setUsername(snap.data().username);
        }
      };
      fetchUser();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex gap-4">
        <Link href="/login">Login</Link>
        <Link href="/signup">Signup</Link>
      </div>
    );
  }

  return (
    <div className="flex gap-4 items-center">
      <span className="text-sm font-semibold">@{username || "user"}</span>
      <button
        onClick={logout}
        className="text-red-500 hover:underline text-sm"
      >
        Logout
      </button>
    </div>
  );
}
