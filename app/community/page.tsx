// app/community/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  getDocs,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthProvider";
import getUsername from "@/lib/getUsername";

type Post = {
  id: string;
  content: string;
  authorId: string;
  authorEmail?: string;
  authorName?: string;
  createdAt?: any;
  likes: number;
};

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>(
    {}
  );
  const [commentCounts, setCommentCounts] = useState<{ [key: string]: number }>(
    {}
  );
  const [message, setMessage] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const postsData = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Post[];
        setPosts(postsData);

        // fetch comment counts for each post
        for (const postDoc of snapshot.docs) {
          const commentsSnap = await getDocs(collection(db, "posts", postDoc.id, "comments"));
          setCommentCounts((prev) => ({
            ...prev,
            [postDoc.id]: commentsSnap.size,
          }));
        }
      },
      (err) => {
        console.error("Posts listener error:", err);
        setMessage("Unable to load posts: " + (err?.message || "network error"));
      }
    );

    return () => unsubscribe();
  }, []);

  const handlePost = async () => {
    setMessage(null);
    if (!newPost.trim()) return;

    if (!user) {
      setMessage("You must be logged in to create a post.");
      return;
    }

    try {
      // derive username
      const storedUsername = localStorage.getItem("teslites_username");
      let authorName = storedUsername || (user.email ? getUsername(user.email) : "user");

      // try to fetch user doc username if available
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const ud = userDoc.data();
          if (ud?.username) authorName = ud.username;
          // keep localStorage in sync
          if (authorName) localStorage.setItem("teslites_username", authorName);
        }
      } catch {}

      await addDoc(collection(db, "posts"), {
        content: newPost.trim(),
        authorId: user.uid,
        authorEmail: user.email || null,
        authorName,
        createdAt: serverTimestamp(),
        likes: 0,
      });
      setNewPost("");
      setMessage("Posted ✅");
    } catch (err: any) {
      console.error("Post failed:", err);
      setMessage("Failed to post: " + (err?.message || "permission/network error"));
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      setMessage("Login to like posts.");
      return;
    }
    try {
      const likeRef = doc(db, "posts", postId, "likes", user.uid);
      const likeSnap = await getDoc(likeRef);
      if (likeSnap.exists()) {
        setMessage("You already liked this post.");
        return;
      }

      // create like doc with userId
      await setDoc(likeRef, { createdAt: serverTimestamp() });

      // increment counter
      await updateDoc(doc(db, "posts", postId), { likes: increment(1) });
    } catch (err: any) {
      console.error("Like failed:", err);
      setMessage("Failed to like: " + (err?.message || "permission error"));
    }
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;
    if (!user) {
      setMessage("Login to comment.");
      return;
    }

    try {
      const authorName = localStorage.getItem("teslites_username") || (user.email ? getUsername(user.email) : "user");
      await addDoc(collection(db, "posts", postId, "comments"), {
        content: content.trim(),
        authorId: user.uid,
        authorEmail: user.email || null,
        authorName,
        createdAt: serverTimestamp(),
      });
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (err: any) {
      console.error("Comment failed:", err);
      setMessage("Failed to comment: " + (err?.message || "permission error"));
    }
  };

  const handleShare = (postId: string) => {
    const postUrl = `${window.location.origin}/community/${postId}`;
    navigator.clipboard.writeText(postUrl);
    alert("Post link copied to clipboard!");
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Community</h1>

      <Link href="/community/discussions">
        <button className="mb-6 bg-purple-600 px-4 py-2 rounded hover:bg-purple-700">
          💬 Go to Discussions
        </button>
      </Link>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Groups</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { name: "Tesla Owners", slug: "tesla-owners" },
            { name: "EV Charging", slug: "ev-charging" },
            { name: "Innovations & Tech", slug: "innovations-tech" },
            { name: "Sustainability", slug: "sustainability" },
          ].map((group) => (
            <Link key={group.slug} href={`/community/groups/${group.slug}`}>
              <div className="p-4 bg-gray-900 rounded hover:bg-gray-800 cursor-pointer">
                <h3 className="font-semibold text-red-500">{group.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* New Post */}
      <div className="mb-6">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Share something with the community..."
          className="w-full p-2 rounded bg-gray-800 text-white mb-2"
        />
        <button onClick={handlePost} className="bg-green-600 px-4 py-2 rounded hover:bg-green-700">
          Post
        </button>
        {message && <div className="mt-2 text-sm text-yellow-300">{message}</div>}
      </div>

      {/* Posts */}
      {posts.map((post) => (
        <div key={post.id} className="mb-6 p-4 bg-gray-900 rounded">
          <p>{post.content}</p>
          <p className="text-xs text-gray-400 mt-1">
            — {post.authorName || post.authorEmail || post.authorId} •{" "}
            {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ""}
          </p>

          <div className="flex items-center gap-4 mt-2 text-sm">
            <button onClick={() => handleLike(post.id)} className="text-yellow-400 hover:text-yellow-500">
              👍 Like ({post.likes ?? 0})
            </button>

            <button
              className="text-blue-400 hover:text-blue-500"
              onClick={() => document.getElementById(`comments-${post.id}`)?.scrollIntoView({ behavior: "smooth" })}
            >
              💬 Comment ({commentCounts[post.id] || 0})
            </button>

            <button onClick={() => handleShare(post.id)} className="text-green-400 hover:text-green-500">
              🔗 Share
            </button>
          </div>

          {/* Comment Section */}
          <div id={`comments-${post.id}`} className="mt-4">
            <input
              type="text"
              value={commentInputs[post.id] || ""}
              onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
              placeholder="Write a comment..."
              className="w-full p-2 rounded bg-gray-800 text-white mb-2"
            />
            <button onClick={() => handleComment(post.id)} className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 text-sm">
              Comment
            </button>

            {/* Comments rendered by nested component */}
            <div className="mt-3 space-y-2">
              <CommentList postId={post.id} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommentList({ postId }: { postId: string }) {
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsData = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setComments(commentsData);
      },
      (err) => {
        console.error("Comments listener error:", err);
      }
    );
    return () => unsubscribe();
  }, [postId]);

  return (
    <div>
      {comments.map((comment) => (
        <div key={comment.id} className="mb-2 p-2 bg-gray-800 rounded">
          <p>{comment.content}</p>
          <p className="text-xs text-gray-400 mt-1">
            — {comment.authorName || comment.authorEmail || comment.authorId} •{" "}
            {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString() : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
