"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

export default function ListingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);

  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem("marketplaceListings");
      const items: Listing[] = raw ? JSON.parse(raw) : [];
      const found = items.find((l) => l.id === id);
      if (found) {
        setListing(found);
      }
    } catch (err) {
      console.error("Error loading listing details:", err);
    }
  }, [id]);

  if (!listing) {
    return (
      <div className="p-6 bg-black min-h-screen text-white">
        <p>Product not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <button
        onClick={() => router.back()}
        className="mb-4 text-red-500 hover:underline"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-red-600 mb-2">
        {listing.title}
      </h1>
      <p className="text-xl font-semibold mb-2">${listing.price}</p>
      <p className="mb-4">{listing.description}</p>

      {/* Location */}
      {(listing.country || listing.state || listing.city) && (
        <p className="mb-4 text-gray-400">
          Location: {listing.city}, {listing.state}, {listing.country}
        </p>
      )}

      {/* Images */}
      {listing.images && listing.images.length > 0 && (
        <div className="mb-4 grid gap-2 md:grid-cols-2">
          {listing.images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${listing.title} ${i + 1}`}
              className="w-full rounded"
            />
          ))}
        </div>
      )}

      {/* Video */}
      {listing.video && (
        <video
          src={listing.video}
          controls
          className="w-full rounded mb-4"
        />
      )}

      {/* Seller Info */}
      <div className="mb-6">
        <p className="font-bold">Seller: {listing.ownerName || "Unknown"}</p>
        <p className="text-gray-400">📧 {listing.ownerEmail || listing.contactEmail}</p>
      </div>

      {/* Chat Button */}
      <button
        onClick={() => router.push(`/chat/${listing.id}`)}
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
      >
        💬 Chat with Seller
      </button>
    </div>
  );
}
