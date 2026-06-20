"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function EditProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setUsername(data.username || "");
          setBio(data.bio || "");
          setPhotoURL(data.photoURL || "");
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleImageUpload = async (file: File) => {
    if (!userId || !file) return;
    try {
      setUploading(true);
      const storageRef = ref(storage, `profilePictures/${userId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setPhotoURL(downloadURL);
      showToast("✅ Photo uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      showToast("❌ Failed to upload image. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { username, bio, photoURL });
      showToast("✅ Profile updated successfully!");
      setTimeout(() => router.push("/profile"), 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("❌ Failed to update profile. Please try again.");
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  };

  if (loading) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 text-white min-h-screen relative">
      <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>

      <div className="space-y-4">
        <div className="flex flex-col items-center">
          {photoURL ? (
            <img
              src={photoURL}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover mb-3 border-4 border-red-600"
            />
          ) : (
            <div className="w-32 h-32 mb-3 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
              No Photo
            </div>
          )}

          <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md text-sm">
            {uploading ? "Uploading..." : "Upload New Photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
              }}
            />
          </label>
        </div>

        <div>
          <label className="block mb-1">Username</label>
          <input
            type="text"
            className="w-full p-2 rounded bg-gray-800 text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">Bio</label>
          <textarea
            className="w-full p-2 rounded bg-gray-800 text-white"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-md font-semibold mt-4 transition"
        >
          Save Changes
        </button>

        <button
          onClick={() => router.push("/profile")}
          className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-md font-semibold mt-2 transition"
        >
          Cancel
        </button>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-red-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeIn">
          {toastMessage}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
