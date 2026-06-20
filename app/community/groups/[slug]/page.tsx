"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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

export default function GroupPage() {
  const { slug } = useParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>(
    {}
  );
  const [commentCounts, setCommentCounts] = useState<{ [key: string]: number }>(
    {}
  );

  useEffect(() => {
    if (!slug) return;

    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Filter posts by group client-side
      const postsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Post[];
      const filteredPosts = postsData.filter((post) => post.group === slug);
      setPosts(filteredPosts);

      // Fetch comment counts
      for (const post of snapshot.docs) {
        const postData = post.data() as Post;
        if (postData.group !== slug) continue;
        const commentsSnap = await getDocs(collection(db, "posts", post.id, "comments"));
        setCommentCounts((prev) => ({ ...prev, [post.id]: commentsSnap.size }));
      }
    });

    return () => unsubscribe();
  }, [slug]);

  const handlePost = async () => {
    if (!newPost.trim() || !slug) return;

    await addDoc(collection(db, "posts"), {
      content: newPost,
      authorId: "user123",
      authorEmail: "test@example.com",
      createdAt: serverTimestamp(),
      likes: 0,
      group: slug,
    });

    setNewPost("");
  };

  const handleLike = async (postId: string) => {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, { likes: increment(1) });
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;

    await addDoc(collection(db, "posts", postId, "comments"), {
      content,
      authorId: "user123",
      authorEmail: "test@example.com",
      createdAt: serverTimestamp(),
    });

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  const handleShare = (postId: string) => {
    const postUrl = `${window.location.origin}/community/groups/${slug}/posts/${postId}`;
    navigator.clipboard.writeText(postUrl);
    alert("Post link copied to clipboard!");
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-red-600">
          {typeof slug === "string" ? slug.replace(/-/g, " ") : ""} Group
        </h1>

        <Link href="/community">
          <span className="text-sm text-gray-400 hover:underline cursor-pointer">
            ← Back to Community
          </span>
        </Link>
      </div>

      {/* New Post */}
      <div className="mb-6">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder={`Share something with ${
            typeof slug === "string" ? slug.replace(/-/g, " ") : ""
          }...`}
          className="w-full p-2 rounded bg-gray-800 text-white mb-2"
        />
        <button
          onClick={handlePost}
          className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
        >
          Post
        </button>
      </div>

      {/* Posts */}
      {posts.map((post) => (
        <div key={post.id} className="mb-6 p-4 bg-gray-900 rounded">
          {/* Clickable post content */}
          <Link href={`/community/groups/${slug}/posts/${post.id}`}>
            <p className="cursor-pointer hover:underline">{post.content}</p>
          </Link>

          <p className="text-xs text-gray-400 mt-1">
            — {post.authorEmail || post.authorId} •{" "}
            {post.createdAt?.toDate
              ? post.createdAt.toDate().toLocaleString()
              : ""}
          </p>

          <div className="flex items-center gap-4 mt-2 text-sm">
            <button
              onClick={() => handleLike(post.id)}
              className="text-yellow-400 hover:text-yellow-500"
            >
              👍 Like ({post.likes})
            </button>
            <button
              className="text-blue-400 hover:text-blue-500"
              onClick={() =>
                document.getElementById(`comments-${post.id}`)?.scrollIntoView({
                  behavior: "smooth",
                })
              }
            >
              💬 Comment ({commentCounts[post.id] || 0})
            </button>
            <button
              onClick={() => handleShare(post.id)}
              className="text-green-400 hover:text-green-500"
            >
              🔗 Share
            </button>
          </div>

          <div id={`comments-${post.id}`} className="mt-4">
            <input
              type="text"
              value={commentInputs[post.id] || ""}
              onChange={(e) =>
                setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
              }
              placeholder="Write a comment..."
              className="w-full p-2 rounded bg-gray-800 text-white mb-2"
            />
            <button
              onClick={() => handleComment(post.id)}
              className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 text-sm"
            >
              Comment
            </button>

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
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Comment[];
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [postId]);

  return (
    <div>
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
  );
}
