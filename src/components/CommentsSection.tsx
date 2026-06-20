"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";

interface Comment {
  id: string;
  name: string;
  text: string;
  createdAt: string;
}

interface PostCommentResponse {
  id: string;
  createdAt: string;
}

interface CommentsSectionProps {
  articleId: string;
}

export default function CommentsSection({ articleId }: CommentsSectionProps) {

  const [comments, setComments] = useState<Comment[]>([]); // always an array
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  // Ref for auto-scrolling to top of comments
  const commentsTopRef = useRef<HTMLDivElement | null>(null);

  /* =========================
     Fetch Comments
  ========================= */
  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/comments?articleId=${encodeURIComponent(articleId)}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch comments");
        }

        const json = (await res.json()) as Comment[];

        // Sort newest first
        const sortedComments = Array.isArray(json)
          ? json.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          : [];

        setComments(sortedComments);
      } catch (err) {
        console.error("Failed to fetch comments:", err);
        setError("Unable to load comments");
        setComments([]); // fallback
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
  }, [articleId]);

  /* =========================
     Post Comment
  ========================= */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    try {
      setPosting(true);
      setError("");

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ articleId, name, text }),
      });

      if (!res.ok) {
        throw new Error("Failed to post comment");
      }

      const json = (await res.json()) as PostCommentResponse;

      const newComment: Comment = {
        id: json.id,
        name,
        text,
        createdAt: json.createdAt,
      };

      // Add newest comment at the top
      setComments(prev => [newComment, ...prev]);
commentsTopRef.current?.scrollIntoView({ behavior: "smooth" });

      setName("");
      setText("");

      // Auto-scroll to top
      setTimeout(() => {
        commentsTopRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Failed to post comment:", err);
      setError("Failed to post comment");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div ref={commentsTopRef} className="mt-10">

      <h2 className="text-2xl font-semibold mb-4">Comments</h2>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <textarea
          placeholder="Write a comment..."
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          rows={4}
        />
        <button
          type="submit"
          disabled={posting}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {posting ? "Posting..." : "Post Comment"}
        </button>
      </form>

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Auto-scroll anchor */}
      <div ref={commentsTopRef}></div>

      {/* Comments List */}
      {loading ? (
        <p className="text-gray-500">Loading comments...</p>
      ) : (comments || []).length === 0 ? (
        <p className="text-gray-500">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <div
              key={comment.id}
              className="p-4 bg-gray-900 bg-opacity-50 rounded-lg shadow-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-white">{comment.name}</span>
                <span className="text-xs text-gray-300">
                  {format(new Date(comment.createdAt), "PPpp")}
                </span>
              </div>
              <p className="text-white">{comment.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
