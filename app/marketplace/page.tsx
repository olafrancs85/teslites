"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  contactEmail: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  images?: string[];
  video?: string | null;
  ownerEmail?: string;
  ownerName?: string;
  createdAt: string;
};

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("marketplaceListings");
      const items: Listing[] = raw ? JSON.parse(raw) : [];
      setListings(items);
    } catch (err) {
      console.error("Error loading listings:", err);
      setListings([]);
    }

    const favRaw = localStorage.getItem("teslites_favorites");
    if (favRaw) {
      try {
        setFavorites(JSON.parse(favRaw));
      } catch {
        setFavorites([]);
      }
    }

    const userEmail = localStorage.getItem("teslites_userEmail");
    if (userEmail) {
      setCurrentUser(userEmail);
    }
  }, []);

  const toggleFavorite = (id: string) => {
    let updated: string[];
    if (favorites.includes(id)) {
      updated = favorites.filter((fid) => fid !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem("teslites_favorites", JSON.stringify(updated));
  };

  const handleDelete = (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    const updated = listings.filter((item) => item.id !== id);
    setListings(updated);
    localStorage.setItem("marketplaceListings", JSON.stringify(updated));
  };

  const filteredListings = listings.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Marketplace</h1>
      <p className="mb-4">
        Browse pre-owned Tesla products or list your own to sell.
      </p>

      <div className="flex gap-4 mb-4 flex-wrap">
        <Link
          href="/marketplace/upload"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Upload Product
        </Link>
        <Link
          href="/marketplace/favorites"
          className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600"
        >
          ⭐ Favorites
        </Link>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-800 text-white"
        />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {filteredListings.length === 0 && (
          <p className="text-gray-400">
            No products match your search. Try a different keyword.
          </p>
        )}

        {filteredListings.map((item) => (
          <div
            key={item.id}
            onClick={() => router.push(`/marketplace/${item.id}`)}
            className="cursor-pointer bg-gray-900 p-4 rounded-lg shadow-lg hover:bg-gray-800 transition"
          >
            <h2 className="text-xl font-semibold text-red-500 mb-2">
              {item.title}
            </h2>
            <p className="mb-1 font-bold">${item.price}</p>

            {/* Thumbnail Image */}
            {item.images && item.images.length > 0 && (
              <img
                src={item.images[0]}
                alt={item.title}
                className="w-full rounded mb-2"
              />
            )}

            <div className="flex justify-between items-center mt-2">
              {/* Favorite button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item.id);
                }}
                className="text-yellow-400 hover:text-yellow-500"
              >
                {favorites.includes(item.id)
                  ? "★ Unfavorite"
                  : "☆ Favorite"}
              </button>

              {/* Owner actions (Edit + Delete) */}
              {currentUser === item.ownerEmail && (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/marketplace/upload?id=${item.id}`);
                    }}
                    className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
