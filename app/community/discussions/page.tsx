"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Discussion = {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorEmail?: string;
  createdAt?: any;
};

export default function DiscussionsPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const q = query(collection(db, "discussions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const discussionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Discussion[];
      setDiscussions(discussionsData);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateDiscussion = async () => {
    if (!title.trim() || !description.trim()) return;

    await addDoc(collection(db, "discussions"), {
      title,
      description,
      authorId: "user123", // replace with real Firebase Auth later
      authorEmail: "test@example.com",
      createdAt: serverTimestamp(),
    });

    setTitle("");
    setDescription("");
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-red-600">
          Community Discussions
        </h1>

        {/* Back link */}
        <Link href="/community">
          <button className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600 text-sm">
            ← Back to Community
          </button>
        </Link>
      </div>

      {/* New Discussion Form */}
      <div className="mb-6 p-4 bg-gray-900 rounded">
        <h2 className="text-lg font-semibold mb-2">Start a new discussion</h2>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Discussion title"
          className="w-full p-2 rounded bg-gray-800 text-white mb-2"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write your opening post..."
          className="w-full p-2 rounded bg-gray-800 text-white mb-2"
        />
        <button
          onClick={handleCreateDiscussion}
          className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
        >
          Create Discussion
        </button>
      </div>

      {/* Discussion List */}
      <div className="space-y-4">
        {discussions.map((d) => (
          <Link key={d.id} href={`/community/discussions/${d.id}`}>
            <div className="p-4 bg-gray-900 rounded hover:bg-gray-800 cursor-pointer">
              <h3 className="text-lg font-semibold text-red-400">{d.title}</h3>
              <p className="text-sm text-gray-300">{d.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                — {d.authorEmail || d.authorId} •{" "}
                {d.createdAt?.toDate
                  ? d.createdAt.toDate().toLocaleString()
                  : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
