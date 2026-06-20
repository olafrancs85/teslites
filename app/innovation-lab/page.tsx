"use client";
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { Heart, MessageCircle, Trash2, Edit2, X, ThumbsUp } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

interface Comment {
  id: string;
  text: string;
  author: string;
  authorId: string;
  createdAt?: any;
}

interface Innovation {
  id: string;
  title: string;
  description: string;
  category: string;
  author: string;
  authorId?: string;
  createdAt?: any;
  upvotes?: number;
  upvotedByUser?: boolean;
  comments?: Comment[];
  images?: string[]; // local data URLs
}

export default function InnovationLabPage() {
  const [innovations, setInnovations] = useState<Innovation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", category: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const auth = getAuth();

  // NEW: highlighted card id (for red glow) and auto-open state control
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [autoSelected, setAutoSelected] = useState(false);

  // search params & router
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedIdFromQuery = searchParams.get("id");
  // allow alternate query param "highlight" (some pages might send highlight=)
  const selectedHighlightFromQuery = searchParams.get("highlight");
  // prefer id, fallback to highlight
  const queryId = selectedIdFromQuery || selectedHighlightFromQuery || null;

  // ---------- Helper: resize image to dataURL ----------
  async function fileToDataUrlResized(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Image load error"));
      image.src = dataUrl;
    });

    const width = img.width;
    const height = img.height;

    if (width <= maxWidth) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL("image/jpeg", quality);
    }

    const scale = maxWidth / width;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  }

  // ---------- Load innovations ----------
  async function loadInnovations() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "innovations"), orderBy("createdAt", "desc")));
      const user = auth.currentUser;
      const list: Innovation[] = [];

      for (const docSnap of snap.docs) {
        const rawData = docSnap.data() as Record<string, any>;
        const idea: Innovation = {
          id: docSnap.id,
          title: rawData.title ?? "",
          description: rawData.description ?? "",
          category: rawData.category ?? "",
          author: rawData.author ?? "",
          authorId: rawData.authorId ?? "",
          createdAt: rawData.createdAt,
          upvotes: 0,
          upvotedByUser: false,
          comments: [],
        };

        // upvotes subcollection
        const upvoteSnap = await getDocs(collection(db, `innovations/${docSnap.id}/upvotes`));
        idea.upvotes = upvoteSnap.size;

        if (user) {
          const userUp = await getDoc(doc(db, `innovations/${docSnap.id}/upvotes/${user.uid}`));
          idea.upvotedByUser = userUp.exists();
        }

        // comments
        const commentsSnap = await getDocs(
          query(collection(db, `innovations/${docSnap.id}/comments`), orderBy("createdAt", "desc"))
        );
        idea.comments = commentsSnap.docs.map((c) => {
          const { id: _ignored, ...rest } = c.data() as Comment;
          return { id: c.id, ...rest };
        });

        list.push(idea);
      }

      // attach images from localStorage (data URLs)
      const localData = JSON.parse(localStorage.getItem("innovationImages") || "{}");
      const merged = list.map((idea) => ({
        ...idea,
        images: Array.isArray(localData[idea.id]) ? localData[idea.id] : [],
      }));

      setInnovations(merged);
    } catch (err) {
      console.error("Error loading innovations:", err);
      toast.error("Failed to load ideas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInnovations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- NEW: Auto-scroll + highlight when ?id= or ?highlight= present ----------
  useEffect(() => {
    if (!queryId || loading || autoSelected) return;

    // Wait a tiny bit to allow render
    const timer = window.setTimeout(() => {
      const el = document.querySelector(`[data-idea-id="${queryId}"]`);
      if (el) {
        // Scroll to element
        el.scrollIntoView({ behavior: "smooth", block: "center" });

        // set highlighted id so the card gets ring classes
        setHighlightedId(queryId);
        setAutoSelected(true);

        // also add classes directly (defensive)
        el.classList.add("ring-2", "ring-red-600", "ring-offset-2", "ring-offset-gray-900");

        // remove highlight after 3s
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-red-600", "ring-offset-2", "ring-offset-gray-900");
          setHighlightedId(null);
        }, 3000);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [queryId, innovations, loading, autoSelected]);

  // ---------- Helper: navigate to an idea (used by clicks inside the lab and Top 5) ----------
  function gotoIdea(ideaId: string) {
    try {
      // update URL so it's shareable/bookmarkable
      router.push(`/innovation-lab?id=${ideaId}`);
    } catch (e) {
      // fallback: perform local scroll/highlight if router push fails
      const el = document.querySelector(`[data-idea-id="${ideaId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-red-600", "ring-offset-2", "ring-offset-gray-900");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-red-600", "ring-offset-2", "ring-offset-gray-900");
        }, 3000);
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ---------- Submit or update idea ----------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return toast.error("You must be logged in to share an idea.");
    if (!form.title || !form.description) return toast.error("Please fill required fields.");

    setSubmitting(true);
    try {
      let docRefId: string;

      if (editingId) {
        // update
        const docRef = doc(db, "innovations", editingId);
        await updateDoc(docRef, {
          title: form.title,
          description: form.description,
          category: form.category,
          updatedAt: serverTimestamp(),
        });
        docRefId = editingId;
        toast.success("Idea updated!");
      } else {
        // create
        const newDoc = await addDoc(collection(db, "innovations"), {
          ...form,
          author: user.email || "Anonymous",
          authorId: user.uid,
          createdAt: serverTimestamp(),
        });
        docRefId = newDoc.id;
        toast.success("Innovation idea submitted!");
      }

      // handle images: convert to dataURL and store in localStorage
      if (selectedImages.length > 0) {
        const dataUrls: string[] = [];
        for (const file of selectedImages) {
          try {
            const dataUrl = await fileToDataUrlResized(file, 1200, 0.8);
            dataUrls.push(dataUrl);
          } catch (err) {
            console.warn("Failed to process image file:", err);
          }
        }

        try {
          const storedImages = JSON.parse(localStorage.getItem("innovationImages") || "{}");
          storedImages[docRefId] = dataUrls;
          localStorage.setItem("innovationImages", JSON.stringify(storedImages));
        } catch (err: any) {
          console.error("Saving images to localStorage failed:", err);
          toast.error("Images couldn't be saved locally (browser storage full). Idea text was saved.");
        }
      }

      // reset
      setForm({ title: "", description: "", category: "" });
      setSelectedImages([]);
      setEditingId(null);

      await loadInnovations();
    } catch (err) {
      console.error("Error saving idea:", err);
      toast.error("Failed to save idea.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Delete idea ----------
  async function deleteIdea(ideaId: string) {
    if (!confirm("Delete this idea?")) return;
    try {
      await deleteDoc(doc(db, "innovations", ideaId));
      const stored = JSON.parse(localStorage.getItem("innovationImages") || "{}");
      delete stored[ideaId];
      try {
        localStorage.setItem("innovationImages", JSON.stringify(stored));
      } catch (err) {
        // ignore
      }
      toast.success("Idea deleted");
      await loadInnovations();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete");
    }
  }

  // ---------- Upvote toggle (optimistic & safe) ----------
  async function toggleUpvote(ideaId: string) {
    const user = auth.currentUser;
    if (!user) {
      toast.error("Login to upvote ideas.");
      return;
    }

    // find existing idea locally
    const localIdea = innovations.find((i) => i.id === ideaId);
    if (!localIdea) return;

    // optimistic update: flip locally
    setInnovations((prev) =>
      prev.map((it) => {
        if (it.id !== ideaId) return it;
        const upvoted = !!it.upvotedByUser;
        const newCount = (it.upvotes ?? 0) + (upvoted ? -1 : 1);
        return { ...it, upvotes: newCount, upvotedByUser: !upvoted };
      })
    );

    const upvoteRef = doc(db, `innovations/${ideaId}/upvotes/${user.uid}`);

    try {
      const existing = await getDoc(upvoteRef);
      if (existing.exists()) {
        // remove upvote
        await deleteDoc(upvoteRef);
      } else {
        // add upvote
        await setDoc(upvoteRef, {
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      // reload to keep consistent with server
      await loadInnovations();
    } catch (err) {
      console.error("Upvote error:", err);
      toast.error("Upvote failed. Reverting...");

      // revert local optimistic update
      setInnovations((prev) =>
        prev.map((it) => {
          if (it.id !== ideaId) return it;
          const upvoted = !!it.upvotedByUser;
          const newCount = (it.upvotes ?? 0) + (upvoted ? -1 : 1);
          return { ...it, upvotes: newCount, upvotedByUser: !upvoted };
        })
      );
    }
  }

  // ---------- Comments ----------
  async function addComment(ideaId: string) {
    const user = auth.currentUser;
    if (!user) return toast.error("Login to comment.");
    if (!commentText[ideaId]) return toast.error("Comment empty.");

    try {
      await addDoc(collection(db, `innovations/${ideaId}/comments`), {
        text: commentText[ideaId],
        author: user.email || "Anonymous",
        authorId: user.uid,
        createdAt: serverTimestamp(),
      });
      setCommentText((p) => ({ ...p, [ideaId]: "" }));
      await loadInnovations();
      // no modal: nothing to refresh there; inline comments update via loadInnovations
    } catch (err) {
      console.error(err);
      toast.error("Comment failed");
    }
  }

  async function deleteComment(ideaId: string, commentId: string) {
    try {
      await deleteDoc(doc(db, `innovations/${ideaId}/comments/${commentId}`));
      await loadInnovations();
    } catch (err) {
      toast.error("Delete comment failed");
    }
  }

  // ---------- Preview helpers ----------
  function removeSelectedImage(idx: number) {
    setSelectedImages((prev) => prev.filter((_, i) => i !== idx));
  }

  // derived top 5 ideas by upvotes
  const topFive = [...innovations].sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0)).slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto p-6 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">🚀 Innovation Lab</h1>
      <p className="text-gray-400 mb-8 text-center">
        Share your creative Tesla ideas. Upload sketches, discuss, and get inspired.
      </p>

      <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-lg mb-10">
        <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Idea" : "Submit a New Idea"}</h2>

        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title"
          className="w-full p-2 rounded bg-black border border-gray-700 mb-3"
        />

        <input
          type="text"
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="Category (Design, AI, etc.)"
          className="w-full p-2 rounded bg-black border border-gray-700 mb-3"
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe your idea..."
          rows={5}
          className="w-full p-2 rounded bg-black border border-gray-700 mb-4"
        />

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setSelectedImages(Array.from(e.target.files || []))}
          className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-2 mb-4"
        />

        {/* selected image previews (removable) */}
        {selectedImages.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
            {selectedImages.map((f, i) => (
              <div key={i} className="relative group">
                <img
                  src={URL.createObjectURL(f)}
                  alt="preview"
                  className="rounded-xl w-full h-28 sm:h-32 object-cover border border-gray-700 transition-transform group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => removeSelectedImage(i)}
                  className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-semibold"
        >
          {submitting ? "Posting..." : editingId ? "Update Idea" : "Submit Idea"}
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main list */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Community Innovations</h2>

          {loading ? (
            <p>Loading innovations...</p>
          ) : innovations.length === 0 ? (
            <p>No ideas shared yet.</p>
          ) : (
            <div className="grid gap-4">
              {innovations.map((idea) => (
                <div
                  key={idea.id}
                  data-idea-id={idea.id}
                  onClick={() => {}}
                  className={`bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-red-600 transition ${highlightedId === idea.id ? "ring-2 ring-red-600" : ""
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">{idea.title}</h3>

                    {(auth.currentUser?.uid === idea.authorId || auth.currentUser?.email === idea.author) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setForm({
                              title: idea.title,
                              description: idea.description,
                              category: idea.category,
                            });
                            setEditingId(idea.id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="text-blue-400 hover:text-blue-500"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          onClick={() => deleteIdea(idea.id)}
                          className="text-red-500 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-300 mb-2">{idea.description}</p>

                  {/* Local images (data URLs) */}
                  {idea.images && idea.images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                      {idea.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="uploaded idea"
                          className="rounded-xl w-full h-28 sm:h-32 object-cover border border-gray-700 hover:scale-105 transition-transform"
                          onClick={() => gotoIdea(idea.id)}
                        />
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mb-3">
                    <strong>Category:</strong> {idea.category || "General"} | <strong>By:</strong> {idea.author || "Anonymous"}
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleUpvote(idea.id)}
                      className={`flex items-center gap-2 transition-all duration-200 px-2 py-1 rounded-full ${idea.upvotedByUser ? "bg-blue-600/20 text-blue-400 scale-105" : "text-gray-400 hover:text-blue-300"
                        }`}
                      title={idea.upvotedByUser ? "Remove upvote" : "Click to upvote"}
                    >
                      <span className="flex items-center gap-1">
                        <span className={`transition-transform duration-200 ${idea.upvotedByUser ? "rotate-12" : "rotate-0"}`}>👍</span>
                        <span className="font-medium">{idea.upvotes || 0}</span>
                      </span>
                    </button>

                    <button
                      onClick={() => gotoIdea(idea.id)}
                      className="flex items-center gap-2 text-gray-300 hover:text-white px-2 py-1 rounded"
                      title="Jump to this idea (update URL)"
                    >
                      <MessageCircle className="w-4 h-4" /> <span className="text-sm">Jump</span>
                    </button>
                  </div>

                  {/* comments */}
                  <div className="mt-4 border-t border-gray-700 pt-3">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" /> Comments
                    </h4>

                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText[idea.id] || ""}
                        onChange={(e) => setCommentText((prev) => ({ ...prev, [idea.id]: e.target.value }))}
                        className="flex-1 p-2 rounded bg-black border border-gray-700"
                      />
                      <button onClick={() => addComment(idea.id)} className="bg-red-600 px-3 py-1 rounded hover:bg-red-700">
                        Post
                      </button>
                    </div>

                    {idea.comments && idea.comments.length > 0 ? (
                      <div className="space-y-2">
                        {idea.comments.map((c) => (
                          <div key={c.id} className="flex justify-between bg-gray-900 p-2 rounded">
                            <p className="text-gray-300 text-sm">
                              <strong>{c.author}: </strong>
                              {c.text}
                            </p>
                            {auth.currentUser?.uid === c.authorId && (
                              <button onClick={() => deleteComment(idea.id, c.id)} className="text-gray-500 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No comments yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar: Top 5 leaderboard */}
        <aside className="lg:col-span-1 sticky top-6">
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-3">🏆 Top 5 Innovations</h3>
            <ol className="space-y-2">
              {topFive.map((t, idx) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 p-2 rounded hover:bg-gray-800 cursor-pointer"
                  onClick={() => {
                    // scroll to the idea in the list and update URL
                    gotoIdea(t.id);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-sm font-semibold">#{idx + 1}</div>
                    <div className="text-sm truncate max-w-[180px]">{t.title}</div>
                  </div>
                  <div className="text-sm font-medium">👍 {t.upvotes || 0}</div>
                </li>
              ))}

              {topFive.length === 0 && <li className="text-sm text-gray-500">No ranked ideas yet.</li>}
            </ol>
            <div className="mt-3 text-xs text-gray-500">Sorted by upvotes — click to jump to an idea.</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
