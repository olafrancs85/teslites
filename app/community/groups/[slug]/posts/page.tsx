"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Post = {
  id: string;
  content: string;
  authorId: string;
  authorEmail?: string;
  createdAt?: any;
  likes: number;
  group: string;
};

type Comment = {
  id: string;
  content: string;
  authorId: string;
  authorEmail?: string;
  createdAt?: any;
};

export default function PostPage() {
  const { slug, postId } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  // Fetch post data
  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      const docRef = doc(db, "posts", postId as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() } as Post);
      }
    };

    fetchPost();
  }, [postId]);

  // Listen for comments
  useEffect(() => {
    if (!postId) return;

    const q = query(
      collection(db, "posts", postId as string, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Comment)
      );
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !postId) return;

    await addDoc(collection(db, "posts", postId as string, "comments"), {
      content: newComment,
      authorId: "user123",
      authorEmail: "test@example.com",
      createdAt: serverTimestamp(),
    });

    setNewComment("");
  };

  if (!post) {
    return (
      <div className="p-6 bg-black min-h-screen text-white">
        <p>Loading post...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-red-600">
          {typeof slug === "string" ? slug.replace(/-/g, " ") : ""} Post
        </h1>

        <Link href={`/community/groups/${slug}`}>
          <span className="text-sm text-gray-400 hover:underline cursor-pointer">
            ← Back to Group
          </span>
        </Link>
      </div>

      {/* Post Content */}
      <div className="p-4 bg-gray-900 rounded mb-6">
        <p className="text-lg">{post.content}</p>
        <p className="text-xs text-gray-400 mt-1">
          — {post.authorEmail || post.authorId} •{" "}
          {post.createdAt?.toDate
            ? post.createdAt.toDate().toLocaleString()
            : ""}
        </p>
      </div>

      {/* Add Comment */}
      <div className="mb-6">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full p-2 rounded bg-gray-800 text-white mb-2"
        />
        <button
          onClick={handleAddComment}
          className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 text-sm"
        >
          Comment
        </button>
      </div>

      {/* Comments List */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Comments</h2>
        {comments.map((comment) => (
          <div key={comment.id} className="mb-2 p-2 bg-gray-800 rounded">
            <p>{comment.content}</p>
            <p className="text-xs text-gray-400 mt-1">
              — {comment.authorEmail || comment.authorId} •{" "}
              {comment.createdAt?.toDate
                ? comment.createdAt.toDate().toLocaleString()
                : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
