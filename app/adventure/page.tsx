"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import AdventureCard from "@/app/Components/AdventureCard";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

type Adventure = {
  id: string;
  title: string;
  description: string;
  location?: string;
  category: string;
  difficulty?: string;
  rewardPoints?: number;
  images?: string[];
  videoURL?: string;
  createdAt?: any;
};

type AdventureCache = {
  [tab in "all" | "innovation" | "tesla"]?: Adventure[];
};

const ADMIN_EMAIL = "myefritin@gmail.com";

export default function AdventureIndexPage() {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "innovation" | "tesla">("all");
  const [cache, setCache] = useState<AdventureCache>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Admin panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<"innovation" | "tesla" | "space" | "travel" | "ev" | "tech">("innovation");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [rewardPoints, setRewardPoints] = useState<number>(50);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoURL, setVideoURL] = useState("");
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState("");

  // Toast + highlight
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Track auth user
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  // Firestore loader
  const loadAdventures = async (selectedTab: "all" | "innovation" | "tesla") => {
    // use cache if present
    if (cache[selectedTab]) {
      if (selectedTab === tab) setAdventures(cache[selectedTab]!);
      return;
    }

    try {
      const col = collection(db, "adventures");
      const q =
        selectedTab === "all"
          ? query(col, orderBy("createdAt", "desc"))
          : query(col, orderBy("createdAt", "desc"), where("category", "==", selectedTab));

      const snap = await getDocs(q);
      const items: Adventure[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setCache((prev) => ({ ...prev, [selectedTab]: items }));
      if (selectedTab === tab) setAdventures(items);
    } catch (err) {
      console.error("Error loading adventures:", err);
      if (selectedTab === tab) setAdventures([]);
    }
  };

  // Initial preload
  useEffect(() => {
    const tabs: ("all" | "innovation" | "tesla")[] = ["all", "innovation", "tesla"];
    Promise.all(tabs.map((t) => loadAdventures(t))).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When tab changes display from cache or load
  useEffect(() => {
    if (cache[tab]) setAdventures(cache[tab]!);
    else setAdventures([]);
    loadAdventures(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, cache]);

  // Clear highlight after a while
  useEffect(() => {
    if (!lastCreatedId) return;
    const t = setTimeout(() => setLastCreatedId(null), 3500);
    return () => clearTimeout(t);
  }, [lastCreatedId]);

  // Panel animation variants (full-height right drawer)
  const panelVariants = {
    hidden: { x: "100%" },
    visible: { x: 0 },
    exit: { x: "100%" },
  };

  // Helper: upload multiple images and return urls
  const uploadImagesAndGetUrls = async (files: File[]) => {
    const urls: string[] = [];
    for (let i = 0; i < files.length && i < 3; i++) {
      const f = files[i];
      const fileRef = ref(storage, `adventures/${Date.now()}_${f.name}`);
      await uploadBytes(fileRef, f);
      const url = await getDownloadURL(fileRef);
      urls.push(url);
    }
    return urls;
  };

  // Admin create
  const handleCreateAdventure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) return;

    setCreating(true);
    setStatus("");

    try {
      // upload images
      const images = imageFiles.length ? await uploadImagesAndGetUrls(imageFiles) : [];

      const docRef = await addDoc(collection(db, "adventures"), {
        title,
        description,
        location: location || "",
        category,
        difficulty,
        rewardPoints,
        images,
        videoURL: videoURL || "",
        createdAt: serverTimestamp(),
      });

      // Success UX
      setStatus("Adventure created successfully!");
      triggerToast("Adventure created successfully! 🎉");
      setLastCreatedId(docRef.id);

      // reset form
      setTitle("");
      setDescription("");
      setLocation("");
      setCategory("innovation");
      setDifficulty("easy");
      setRewardPoints(50);
      setImageFiles([]);
      setVideoURL("");

      // refresh list: clear cache and reload current tab
      setCache({});
      await loadAdventures(tab);

      // close panel a short time after success
      setTimeout(() => setPanelOpen(false), 600);
    } catch (err) {
      console.error("Create adventure error:", err);
      setStatus("Failed to create adventure.");
      triggerToast("Failed to create adventure.");
    } finally {
      setCreating(false);
    }
  };

  // File input handler (max 3 files)
  const handleFilesChange = (filesList: FileList | null) => {
    if (!filesList) return;
    const arr = Array.from(filesList).slice(0, 3);
    setImageFiles(arr);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Toast (Tailwind-native animate-slide-in expected in tailwind.config.js) */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50">
          <div className="bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-slide-in">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Adventure — Innovate. Explore. Inspire.</h1>
          <p className="text-slate-400 mt-1">Complete challenges to earn Teslites points and badges.</p>
        </div>

        {/* Admin Add button */}
        {currentUser?.email === ADMIN_EMAIL && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPanelOpen(true)}
              className="bg-transparent border border-red-600 text-red-600 hover:bg-red-600 hover:text-black transition px-4 py-2 rounded-md font-semibold"
            >
              Add Adventure
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto flex gap-2 mb-6">
        {(["all", "innovation", "tesla"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded ${tab === t ? "bg-red-600" : "bg-gray-800"}`}
          >
            {t === "all" ? "All" : t === "innovation" ? "Innovation Quests" : "Tesla Adventures"}
          </button>
        ))}
      </div>

      {/* Content grid */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-slate-400">Loading adventures...</div>
        ) : adventures.length === 0 ? (
          <div className="text-slate-400">No adventures found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {adventures.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={a.id === lastCreatedId ? "animate-fade-in-pop" : ""}
              >
                <AdventureCard {...a} difficulty={a.difficulty as "easy" | "medium" | "hard" | undefined} />
              </motion.div>
            ))}
          </div> 
        )}
      </div>

      {/* Slide-in full-height panel (Framer Motion) */}
      <AnimatePresence>
        {panelOpen && (
          <>
            {/* backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setPanelOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* panel */}
            <motion.aside
              key="panel"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={panelVariants}
              transition={{ type: "tween", duration: 0.28 }}
              className="fixed right-0 top-0 h-full w-full md:w-2/5 bg-[#0b0b0b] z-50 shadow-lg border-l border-gray-800 overflow-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Create Adventure</h2>
                  <button
                    onClick={() => setPanelOpen(false)}
                    aria-label="Close"
                    className="text-slate-400 hover:text-white"
                  >
                    {/* X icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleCreateAdventure} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Title</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full p-3 rounded bg-gray-900 text-white border border-gray-800"
                      placeholder="Short, punchy title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      className="w-full p-3 rounded bg-gray-900 text-white border border-gray-800 h-28"
                      placeholder="Describe the challenge, expectations and how to prove completion"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Location (optional)</label>
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full p-3 rounded bg-gray-900 text-white border border-gray-800"
                        placeholder="e.g. Lagos, Space, Remote"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Video URL (optional)</label>
                      <input
                        value={videoURL}
                        onChange={(e) => setVideoURL(e.target.value)}
                        className="w-full p-3 rounded bg-gray-900 text-white border border-gray-800"
                        placeholder="YouTube or other video link"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full p-3 rounded bg-gray-900 text-white border border-gray-800"
                      >
                        <option value="innovation">Innovation</option>
                        <option value="tesla">Tesla</option>
                        <option value="space">Space</option>
                        <option value="travel">Travel</option>
                        <option value="ev">EV</option>
                        <option value="tech">Tech</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Difficulty</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full p-3 rounded bg-gray-900 text-white border border-gray-800"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Reward Points</label>
                      <input
                        type="number"
                        value={rewardPoints}
                        onChange={(e) => setRewardPoints(Number(e.target.value))}
                        className="w-full p-3 rounded bg-gray-900 text-white border border-gray-800"
                        min={0}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Images (up to 3)</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFilesChange(e.target.files)}
                      className="w-full text-sm text-slate-300"
                    />
                    <p className="text-xs text-slate-500 mt-1">Tip: use high-quality images (landscape works best).</p>

                    {/* preview small thumbnails */}
                    {imageFiles.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {imageFiles.map((f, idx) => (
                          <div key={idx} className="w-20 h-14 rounded overflow-hidden bg-gray-800 flex items-center justify-center text-xs">
                            <img src={URL.createObjectURL(f)} alt={f.name} className="object-cover w-full h-full" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      type="submit"
                      disabled={creating}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold"
                    >
                      {creating ? "Creating..." : "Create Adventure"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // reset and close
                        setTitle("");
                        setDescription("");
                        setLocation("");
                        setCategory("innovation");
                        setDifficulty("easy");
                        setRewardPoints(50);
                        setImageFiles([]);
                        setVideoURL("");
                        setStatus("");
                        setPanelOpen(false);
                      }}
                      className="bg-transparent border border-gray-700 px-4 py-2 rounded text-slate-300 hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                  </div>

                  {status && <div className="mt-2 text-sm text-green-400">{status}</div>}
                </form>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
