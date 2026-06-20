"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import getUsername from "@/lib/getUsername";

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  contactEmail: string;
  country?: string;
  state?: string;
  city?: string;
  images?: string[];
  video?: string;
  createdAt: string;
};

export default function FavoritesPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: string]: number }>({});
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("teslites_listings");
    const favRaw = localStorage.getItem("teslites_favorites");

    if (raw) {
      try {
        setListings(JSON.parse(raw));
      } catch {
        setListings([]);
      }
    }

    if (favRaw) {
      try {
        setFavorites(JSON.parse(favRaw));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  const favoriteListings = listings.filter((l) => favorites.includes(l.id));

  const showPrevImage = (id: string, length: number) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [id]: prev[id] > 0 ? prev[id] - 1 : length - 1,
    }));
  };

  const showNextImage = (id: string, length: number) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [id]: prev[id] < length - 1 ? prev[id] + 1 : 0,
    }));
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold text-yellow-400 mb-4">⭐ Favorites</h1>
      <p className="mb-4">Your bookmarked Tesla listings.</p>

      <Link
        href="/marketplace"
        className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
      >
        ← Back to Marketplace
      </Link>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {favoriteListings.length === 0 && (
          <p className="text-gray-400">
            No favorites yet. Bookmark some items in the marketplace!
          </p>
        )}

        {favoriteListings.map((item) => {
          const activeIndex = currentImageIndex[item.id] || 0;

          return (
            <div
              key={item.id}
              onClick={() => router.push(`/marketplace/${item.id}`)}
              className="bg-gray-900 p-4 rounded-lg shadow-lg cursor-pointer hover:bg-gray-800 transition"
            >
              <h2 className="text-xl font-semibold text-red-500 mb-2">{item.title}</h2>
              <p className="mb-2">{item.description}</p>
              <p className="mb-1 font-bold">${item.price}</p>
              <p className="mb-2 text-sm text-gray-400">
                Contact: <span className="text-red-400">{getUsername(item.contactEmail)}</span>
              </p>
              {item.country && (
                <p className="mb-2 text-sm text-gray-400">
                  Location: {item.city}, {item.state}, {item.country}
                </p>
              )}

              {/* Sliding images */}
              {item.images && item.images.length > 0 && (
                <div className="mb-3 relative">
                  <img
                    src={item.images[activeIndex]}
                    alt={`Product ${activeIndex + 1}`}
                    className="w-full rounded"
                  />
                  {item.images.length > 1 && (
                    <div className="absolute inset-0 flex justify-between items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showPrevImage(item.id, item.images!.length);
                        }}
                        className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-l"
                      >
                        ◀
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showNextImage(item.id, item.images!.length);
                        }}
                        className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-r"
                      >
                        ▶
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Video */}
              {item.video && (
                <div className="mb-3">
                  <video
                    controls
                    src={item.video}
                    className="w-full rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
