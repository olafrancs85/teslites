"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";
import Image from "next/image";
import UserAvatar from "../../Components/UserAvatar";

interface UserProfile {
  uid: string;
  username?: string;
  email?: string;
  photoURL?: string;
  bio?: string;
  createdAt?: any;
}

interface Idea {
  id: string;
  title: string;
  description: string;
  authorId?: string;
  author?: string;
  createdAt?: any;
  upvotes?: number;
}

interface Listing {
  id?: string;
  title?: string;
  description?: string;
  ownerId?: string;
  userId?: string;
  author?: string;
  ownerEmail?: string;
  price?: number;
  createdAt?: any;
  images?: string[];
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const uid = params?.uid as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhotoURL, setEditPhotoURL] = useState("");

  // get current user id
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  // helper to convert createdAt to ms for sorting
  function createdAtToMillis(value: any) {
    if (!value) return 0;
    if (typeof value === "object" && "seconds" in value) {
      return (value.seconds as number) * 1000 + (value.nanoseconds ? value.nanoseconds / 1e6 : 0);
    }
    const parsed = Date.parse(String(value));
    return isNaN(parsed) ? 0 : parsed;
  }

  useEffect(() => {
    async function loadUserProfile() {
      if (!uid) return;
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (!userDoc.exists()) {
          setProfile(null);
          return;
        }

        const userData = userDoc.data() as Record<string, any>;

        // ✅ Fallback defaults
        const safeProfile: UserProfile = {
          uid,
          username: userData.username || userData.email?.split("@")[0] || "Anonymous",
          email: userData.email || "unknown",
          photoURL: userData.photoURL || "",
          bio: userData.bio || "",
          createdAt: userData.createdAt || null,
        };
        setProfile(safeProfile);

        // Fetch innovations
        const ideasSnap = await getDocs(collection(db, "innovations"));
        const userIdeas: Idea[] = [];
        ideasSnap.forEach((docSnap) => {
          const data = docSnap.data() as Record<string, any>;
          if (data.authorId === uid || data.author === userData.email) {
            userIdeas.push({ id: docSnap.id, ...(data as Omit<Idea, "id">) });
          }
        });
        setIdeas(userIdeas);

        // Fetch marketplace listings (Firestore or fallback to localStorage)
        let userListings: Listing[] = [];
        try {
          const listingsSnap = await getDocs(collection(db, "listings"));
          listingsSnap.forEach((docSnap) => {
            const data = docSnap.data() as Record<string, any>;
            if (
              data.ownerId === uid ||
              data.userId === uid ||
              data.ownerEmail === userData.email ||
              data.author === userData.email
            ) {
              userListings.push({ id: docSnap.id, ...(data as Omit<Listing, "id">) });
            }
          });
        } catch {
          console.warn("Firestore listings unavailable, fallback to localStorage");
        }

        if (userListings.length === 0) {
          try {
            const stored = localStorage.getItem("teslites_marketplace");
            if (stored) {
              const allListings = JSON.parse(stored) as Listing[];
              userListings = allListings.filter(
                (item) =>
                  item.ownerId === uid ||
                  item.userId === uid ||
                  item.ownerEmail === userData.email ||
                  item.author === userData.email
              );
            }
          } catch (e) {
            console.error("Error loading local listings:", e);
          }
        }

        userListings.sort((a, b) => createdAtToMillis(b.createdAt) - createdAtToMillis(a.createdAt));
        setListings(userListings.slice(0, 2));
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [uid]);

  if (loading) return <div className="p-6 text-white">Loading profile...</div>;
  if (!profile) return <div className="p-6 text-white">User not found.</div>;

  const joinDate =
    profile.createdAt && typeof profile.createdAt === "object" && "seconds" in profile.createdAt
      ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString()
      : profile.createdAt
      ? new Date(profile.createdAt).toLocaleDateString()
      : "recently";

  const openModal = () => {
    setEditUsername(profile.username || "");
    setEditBio(profile.bio || "");
    setEditPhotoURL(profile.photoURL || "");
    setIsModalOpen(true);
  };

  const saveProfile = async () => {
    if (!profile) return;
    const userRef = doc(db, "users", profile.uid);
    await updateDoc(userRef, {
      username: editUsername,
      bio: editBio,
      photoURL: editPhotoURL,
    });
    setProfile({ ...profile, username: editUsername, bio: editBio, photoURL: editPhotoURL });
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 text-white min-h-screen">
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <UserAvatar photoURL={profile.photoURL} username={profile.username} size={120} className="mb-4" />

        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold">
            {profile.username || profile.email?.split("@")[0] || "Anonymous"}
          </h1>
          <p className="text-gray-400 text-sm">Joined {joinDate}</p>

          {profile.bio ? (
            <p className="mt-2 text-gray-300">{profile.bio}</p>
          ) : (
            <p className="mt-2 text-gray-500 italic">User hasn’t set up their bio yet.</p>
          )}

          {currentUserId === uid && (
            <button
              onClick={openModal}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Innovations */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-3 border-b border-gray-700 pb-2">
          {profile.username || "User"}’s Innovations
        </h2>
        {ideas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                onClick={() => router.push(`/innovation-lab?highlight=${idea.id}`)}
                role="button"
                className="cursor-pointer bg-gray-900 p-4 rounded-lg shadow hover:shadow-red-500/20 transition"
              >
                <h3 className="font-bold text-lg">{idea.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-3">{idea.description}</p>
                <p className="text-xs text-gray-500 mt-2">Upvotes: {idea.upvotes || 0}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No innovations yet.</p>
        )}
      </div>

      {/* Marketplace Listings */}
      <div>
        <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
          <h2 className="text-2xl font-semibold">
            {profile.username || "User"}’s Marketplace Listings
          </h2>
          {currentUserId === uid && (
            <button
              onClick={() => router.push("/marketplace")}
              className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition"
            >
              View All My Listings →
            </button>
          )}
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((item) => (
              <div
                key={item.id || `${item.title}-${Math.random()}`}
                className="bg-gray-900 p-4 rounded-lg shadow hover:shadow-red-500/20 transition"
              >
                {item.images && item.images.length > 0 && (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="rounded-lg object-cover w-full h-40 mb-2"
                  />
                )}
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-3">{item.description}</p>
                {item.price && <p className="text-sm text-gray-300 mt-1">Price: ₦{item.price}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No listings yet.</p>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <label className="block mb-2">
              Username
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="mt-1 w-full p-2 rounded bg-gray-800 text-white"
              />
            </label>
            <label className="block mb-2">
              Bio
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="mt-1 w-full p-2 rounded bg-gray-800 text-white"
              />
            </label>
            <label className="block mb-4">
              Photo URL
              <input
                type="text"
                value={editPhotoURL}
                onChange={(e) => setEditPhotoURL(e.target.value)}
                className="mt-1 w-full p-2 rounded bg-gray-800 text-white"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
