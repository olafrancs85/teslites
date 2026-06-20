"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";
import UserAvatar from "../Components/UserAvatar";

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
  title?: string;
  description?: string;
  authorId?: string;
  author?: string; // for older records that used email
  createdAt?: any;
  upvotes?: number;
}

interface Listing {
  id?: string;
  title?: string;
  description?: string;
  ownerId?: string;
  price?: number;
  createdAt?: any;
  images?: string[];
}

export default function MyProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhotoURL, setEditPhotoURL] = useState("");

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        await loadProfile(user.uid, user.email);
      } else {
        setAuthUser(null);
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  async function loadProfile(uid: string, email?: string | null) {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        setProfile({ ...userData, uid });

        // ✅ Fetch all innovations belonging to the user
        const ideasSnap = await getDocs(collection(db, "innovations"));
        const userIdeas = ideasSnap.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Idea))
          .filter(
            (idea) =>
              idea.authorId === uid ||
              (email && idea.author && idea.author.toLowerCase() === email.toLowerCase())
          );

        setIdeas(userIdeas);

        // ✅ Fetch user's marketplace listings
        let userListings: Listing[] = [];
        try {
          const listingsSnap = await getDocs(collection(db, "listings"));
          userListings = listingsSnap.docs
            .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Listing))
            .filter((item) => item.ownerId === uid);
        } catch (err) {
          console.warn("Error fetching listings, will try local fallback");
        }

        if (userListings.length === 0) {
          try {
            const stored = localStorage.getItem("teslites_marketplace");
            if (stored) {
              const allListings = JSON.parse(stored) as Listing[];
              userListings = allListings.filter((item) => item.ownerId === uid);
            }
          } catch {}
        }

        setListings(userListings.slice(0, 2));
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  }

  function createdAtToDate(value: any) {
    if (!value) return "";
    if (typeof value === "object" && "seconds" in value)
      return new Date(value.seconds * 1000).toLocaleDateString();
    return new Date(value).toLocaleDateString();
  }

  const openModal = () => {
    if (!profile) return;
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

  // ✅ Click innovation → open in Innovation Lab + highlight
  const handleInnovationClick = (ideaId: string) => {
    router.push(`/innovation-lab?highlight=${ideaId}`);
  };

  if (!authUser)
    return (
      <div className="p-6 text-center text-white">
        <h2>Please log in to view your profile.</h2>
      </div>
    );

  if (loading)
    return (
      <div className="p-6 text-white text-center">
        <p>Loading your profile...</p>
      </div>
    );

  if (!profile)
    return (
      <div className="p-6 text-white text-center">
        <h2>Profile not found.</h2>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-6 text-white min-h-screen">
      {/* Profile Info */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <UserAvatar photoURL={profile.photoURL} username={profile.username} size={120} />
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold">
            {profile.username || profile.email?.split("@")[0] || "Anonymous"}
          </h1>
          <p className="text-gray-400 text-sm">Joined {createdAtToDate(profile.createdAt)}</p>
          {profile.bio && <p className="mt-2 text-gray-300">{profile.bio}</p>}

          <div className="mt-4 flex gap-2">
            <Link
              href="/profile/edit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition"
            >
              Edit Profile
            </Link>

            <button
              onClick={openModal}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
            >
              Edit (inline)
            </button>
          </div>
        </div>
      </div>

      {/* ✅ My Innovations (up to 5 visible) */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3 border-b border-gray-700 pb-2">
          My Innovations
        </h2>
        {ideas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ideas
              .sort((a, b) => {
                if (!a.createdAt || !b.createdAt) return 0;
                const aTime =
                  typeof a.createdAt === "object" && "seconds" in a.createdAt
                    ? a.createdAt.seconds
                    : new Date(a.createdAt).getTime() / 1000;
                const bTime =
                  typeof b.createdAt === "object" && "seconds" in b.createdAt
                    ? b.createdAt.seconds
                    : new Date(b.createdAt).getTime() / 1000;
                return bTime - aTime;
              })
              .slice(0, 5)
              .map((idea) => (
                <div
                  key={idea.id}
                  onClick={() => handleInnovationClick(idea.id)}
                  className="cursor-pointer bg-gray-900 p-4 rounded-lg shadow hover:shadow-red-500/20 transition hover:bg-gray-800"
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
      </section>

      {/* Marketplace Listings */}
      <section>
        <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
          <h2 className="text-2xl font-semibold">My Marketplace Listings</h2>
          <button
            onClick={() => router.push("/marketplace")}
            className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition"
          >
            View All →
          </button>
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
                {item.price && (
                  <p className="text-sm text-gray-300 mt-1">Price: ₦{item.price}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No listings yet.</p>
        )}
      </section>

      {/* Inline Edit Profile Modal */}
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
