"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import UserAvatar from "../Components/UserAvatar";

interface UserProfile {
  uid: string;
  username?: string;
  email?: string;
  photoURL?: string;
  bio?: string;
  createdAt?: any;
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [innovationCounts, setInnovationCounts] = useState<Record<string, number>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Get current user
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  // Load users + innovation counts
  useEffect(() => {
    async function loadProfiles() {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const users: UserProfile[] = [];
        usersSnap.forEach((docSnap) => {
          const data = docSnap.data() as Record<string, any>;
          users.push({ ...data, uid: docSnap.id });
        });

        const others = users.filter((u) => u.uid !== currentUserId);
        setProfiles(others);

        // Count innovations per user
        const innovationSnap = await getDocs(collection(db, "innovations"));
        const counts: Record<string, number> = {};
        innovationSnap.forEach((docSnap) => {
          const data = docSnap.data() as Record<string, any>;
          const key = data.authorId || data.author;
          if (key) counts[key] = (counts[key] || 0) + 1;
        });

        // Map authorId/email → uid
        const mappedCounts: Record<string, number> = {};
        others.forEach((u) => {
          const idCount = counts[u.uid] || 0;
          const emailCount = counts[u.email || ""] || 0;
          mappedCounts[u.uid] = idCount + emailCount;
        });

        setInnovationCounts(mappedCounts);
      } catch (err) {
        console.error("Error loading profiles:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfiles();
  }, [currentUserId]);

  function formatJoinDate(createdAt: any) {
    if (!createdAt) return "recently";
    if (typeof createdAt === "object" && "seconds" in createdAt) {
      return new Date(createdAt.seconds * 1000).toLocaleDateString();
    }
    const parsed = Date.parse(createdAt);
    if (!isNaN(parsed)) return new Date(parsed).toLocaleDateString();
    return "recently";
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400 animate-pulse">
        Loading profiles...
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        No other profiles found.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">Discover Innovators</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {profiles.map((user) => (
          <div
            key={user.uid}
            className="group bg-gray-900 rounded-2xl p-5 shadow-lg border border-gray-800 
                       hover:border-red-500/40 hover:shadow-[0_0_25px_rgba(255,0,0,0.3)] 
                       transition duration-300 ease-out transform hover:-translate-y-1"
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <UserAvatar
                  photoURL={user.photoURL}
                  username={user.username}
                  size={90}
                />
                <div className="absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-60 bg-red-500 transition duration-500" />
              </div>

              <h2 className="mt-3 font-semibold text-lg">
                {user.username || user.email?.split("@")[0] || "Anonymous"}
              </h2>

              <p className="text-gray-400 text-sm mb-2">
                Joined {formatJoinDate(user.createdAt)}
              </p>

              {user.bio && (
                <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                  {user.bio}
                </p>
              )}

              {/* Innovations count now clickable */}
              <button
                onClick={() =>
                  router.push(`/innovation-lab?highlightUser=${user.uid}`)
                }
                className="text-sm text-red-400 mb-3 font-medium hover:text-red-300 transition"
              >
                {innovationCounts[user.uid] || 0} Innovations →
              </button>

              <button
                onClick={() => router.push(`/profiles/${user.uid}`)}
                className="mt-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                View Profile →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
