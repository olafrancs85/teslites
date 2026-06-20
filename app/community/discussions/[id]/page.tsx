"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";

type Discussion = {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorEmail?: string;
  createdAt?: any;
};

type Reply = {
  id: string;
  content: string;
  parentId?: string;
  authorId: string;
  authorEmail?: string;
  createdAt?: any;
  upvotes: number;
};

export default function DiscussionPage() {
  const { id } = useParams();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState("");

  // Fetch discussion
  useEffect(() => {
    const fetchDiscussion = async () => {
      if (!id) return;
      const docRef = doc(db, "discussions", id as string);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setDiscussion({ id: snapshot.id, ...snapshot.data() } as Discussion);
      }
    };
    fetchDiscussion();
  }, [id]);

  // Fetch replies
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "discussions", id as string, "replies"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reply[];
      setReplies(data);
    });
    return () => unsubscribe();
  }, [id]);

  // Add reply
  const handleReply = async (parentId?: string) => {
    if (!newReply.trim()) return;

    await addDoc(collection(db, "discussions", id as string, "replies"), {
      content: newReply,
      parentId: parentId || null,
      authorId: "user123", // replace with Firebase Auth later
      authorEmail: "test@example.com",
      createdAt: serverTimestamp(),
      upvotes: 0,
    });

    setNewReply("");
  };

  // Upvote reply
  const handleUpvote = async (replyId: string) => {
    const replyRef = doc(db, "discussions", id as string, "replies", replyId);
    await updateDoc(replyRef, { upvotes: increment(1) });
  };

  // Recursive render of replies
  const renderReplies = (parentId: string | null = null, depth = 0) => {
    return replies
      .filter((r) => (parentId ? r.parentId === parentId : !r.parentId))
      .map((r) => (
        <div
          key={r.id}
          className="mt-3 p-2 bg-gray-800 rounded"
          style={{ marginLeft: depth * 20 }}
        >
          <p>{r.content}</p>
          <p className="text-xs text-gray-400 mt-1">
            — {r.authorEmail || r.authorId} •{" "}
            {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : ""}
          </p>

          <button
            onClick={() => handleUpvote(r.id)}
            className="text-sm text-yellow-400 mt-1"
          >
            👍 {r.upvotes}
          </button>

          {/* Inline nested reply */}
          <div className="mt-2">
            <input
              type="text"
              placeholder="Write a reply..."
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white mb-1"
            />
            <button
              onClick={() => handleReply(r.id)}
              className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 text-sm"
            >
              Reply
            </button>
          </div>

          {/* Nested replies */}
          {renderReplies(r.id, depth + 1)}
        </div>
      ));
  };

  if (!discussion) return <p className="text-white p-6">Loading...</p>;

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      {/* Header with Back link */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-red-600">Discussion</h1>
        <Link href="/community/discussions">
          <button className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600 text-sm">
            ← Back to Discussions
          </button>
        </Link>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold text-red-400 mb-2">
        {discussion.title}
      </h2>

      {/* Description */}
      <p className="text-gray-200 mb-2">{discussion.description}</p>

      {/* Meta */}
      <p className="text-xs text-gray-400 mb-6">
        — {discussion.authorEmail || discussion.authorId} •{" "}
        {discussion.createdAt?.toDate
          ? discussion.createdAt.toDate().toLocaleString()
          : ""}
      </p>

      {/* Top-level reply box */}
      <div className="mb-6">
        <input
          type="text"
          value={newReply}
          onChange={(e) => setNewReply(e.target.value)}
          placeholder="Add a reply..."
          className="w-full p-2 rounded bg-gray-800 text-white mb-2"
        />
        <button
          onClick={() => handleReply()}
          className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
        >
          Reply
        </button>
      </div>

      {/* Replies */}
      <div>{renderReplies()}</div>
    </div>
  );
}
