"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthProvider";

type Comment = {
  id: string;
  content: string;
  authorId: string;
  authorEmail?: string;
  createdAt?: any;
};

export default function PostDetailPage() {
  const { user } = useAuth();
  const { postId } = useParams() as { postId: string };
  const { slug } = useParams() as { slug: string };

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!postId) return;

    const postRef = doc(db, "posts", postId);
    getDoc(postRef).then((snap) => {
      if (snap.exists()) {
        setPost({ id: snap.id, ...snap.data() });
      }
    });

    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Comment[];
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    await addDoc(collection(db, "posts", postId, "comments"), {
      content: newComment,
      authorId: user.uid,
      authorEmail: user.email,
      createdAt: serverTimestamp(),
    });

    setNewComment("");
  };

  if (!post) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <h1 className="text-xl font-bold text-red-600 mb-4">Post Detail</h1>
      <div className="mb-6 p-4 bg-gray-900 rounded">
        <p>{post.content}</p>
        <p className="text-xs text-gray-400 mt-1">
          — {post.authorEmail || post.authorId} •{" "}
          {post.createdAt?.toDate
            ? post.createdAt.toDate().toLocaleString()
            : ""}
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Comments</h2>
        {comments.map((c) => (
          <div key={c.id} className="mb-2 p-2 bg-gray-800 rounded">
            <p>{c.content}</p>
            <p className="text-xs text-gray-400 mt-1">
              — {c.authorEmail || c.authorId} •{" "}
              {c.createdAt?.toDate
                ? c.createdAt.toDate().toLocaleString()
                : ""}
            </p>
          </div>
        ))}
      </div>

      {user ? (
        <div className="mt-4">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-2 rounded bg-gray-800 text-white mb-2"
          />
          <button
            onClick={handleAddComment}
            className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
          >
            Comment
          </button>
        </div>
      ) : (
        <p className="mt-4 text-gray-400">Please log in to comment.</p>
      )}
    </div>
  );
}
