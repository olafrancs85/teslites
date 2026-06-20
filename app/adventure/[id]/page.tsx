"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { addPointsToUser } from "../../../lib/rewards";

export default function AdventureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [adventure, setAdventure] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, "adventures", id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          setAdventure(null);
          return;
        }
        setAdventure({ id: snap.id, ...(snap.data() as any) });
      } catch (err) {
        console.error("Error loading adventure:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSubmitProof = async () => {
    if (!currentUser) {
      setMessage("You must be signed in to submit proof.");
      return;
    }
    if (!adventure) return;
    setUploading(true);
    try {
      let proofURL = "";
      if (proofFile) {
        const storageRef = ref(storage, `adventureProof/${adventure.id}/${currentUser.uid}/${Date.now()}-${proofFile.name}`);
        await uploadBytes(storageRef, proofFile);
        proofURL = await getDownloadURL(storageRef);
      }

      // Save completed adventure record
      const subcol = collection(db, "users", currentUser.uid, "completedAdventures");
      await addDoc(subcol, {
        adventureId: adventure.id,
        proofURL,
        message,
        submittedAt: serverTimestamp(),
        approved: true, // you can set to false and implement an approval flow
        rewardPoints: adventure.rewardPoints || 0,
      });

      // Add points (stub) - improves user profile
      await addPointsToUser(currentUser.uid, adventure.rewardPoints || 0);

      setMessage("Adventure submitted! Points awarded.");
      // optionally redirect to profile or adventure listing
      setTimeout(() => router.push(`/profiles/${currentUser.uid}`), 1400);
    } catch (err) {
      console.error("Submit proof error:", err);
      setMessage("Failed to submit proof. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-white min-h-screen">
      {loading ? (
        <div className="text-slate-400">Loading adventure...</div>
      ) : !adventure ? (
        <div className="text-slate-400">Adventure not found.</div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{adventure.title}</h1>
            <p className="text-slate-400 mt-1">{adventure.description}</p>
            <div className="mt-3 text-sm text-slate-400">
              Category: {adventure.category} • Difficulty: {adventure.difficulty || "easy"} •{" "}
              {adventure.rewardPoints || 0} pts
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Prove your Adventure</h3>
            <p className="text-sm text-slate-400 mb-3">
              Upload a photo or short video (or leave a short message) as proof of completion.
            </p>

            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) setProofFile(e.target.files[0]);
              }}
              className="mb-2"
            />

            <textarea
              placeholder="Write a short note about your adventure (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-800 p-2 rounded text-white mb-3"
            />

            <div className="flex gap-2">
              <button
                onClick={handleSubmitProof}
                disabled={uploading}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
              >
                {uploading ? "Submitting..." : "Submit Proof & Claim Points"}
              </button>

              <button onClick={() => router.push("/adventure")} className="bg-gray-700 px-3 py-2 rounded">
                Back
              </button>
            </div>

            {message && <div className="mt-3 text-sm text-slate-300">{message}</div>}
          </div>
        </>
      )}
    </div>
  );
}
