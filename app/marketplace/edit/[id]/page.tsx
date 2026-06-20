"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: string;
  contactEmail: string;
  country: string;
  state: string;
  city: string;
  images: string[];
  video?: string | null;
  userId: string;
}

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [product, setProduct] = useState<Listing | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [country, setCountry] = useState("");
  const [stateName, setStateName] = useState("");
  const [city, setCity] = useState("");
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  // Load product from localStorage
  useEffect(() => {
    try {
      const storedListings = localStorage.getItem("marketplaceListings");
      if (storedListings) {
        const parsed: Listing[] = JSON.parse(storedListings);
        const found = parsed.find((p) => p.id === productId);
        if (found) {
          setProduct(found);
          setTitle(found.title);
          setDescription(found.description);
          setPrice(found.price);
          setContactEmail(found.contactEmail);
          setCountry(found.country);
          setStateName(found.state);
          setCity(found.city);
          setPreviewImages(found.images || []);
          setPreviewVideo(found.video || null);
        }
      }
    } catch (err) {
      console.error("Error loading product:", err);
    }
    setLoading(false);
  }, [productId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSaving(true);

    try {
      const storedListings = localStorage.getItem("marketplaceListings");
      if (!storedListings) return;

      let parsed: Listing[] = JSON.parse(storedListings);

      const updated: Listing = {
        ...product,
        title,
        description,
        price,
        contactEmail,
        country,
        state: stateName,
        city,
        images: previewImages,
        video: previewVideo,
      };

      parsed = parsed.map((p) => (p.id === productId ? updated : p));
      localStorage.setItem("marketplaceListings", JSON.stringify(parsed));

      alert("Listing updated successfully!");
      router.push("/marketplace");
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!product) return;
    const confirmDelete = confirm("Are you sure you want to delete this listing?");
    if (!confirmDelete) return;

    setDeleting(true);

    try {
      const storedListings = localStorage.getItem("marketplaceListings");
      if (storedListings) {
        let parsed: Listing[] = JSON.parse(storedListings);
        parsed = parsed.filter((p) => p.id !== productId);
        localStorage.setItem("marketplaceListings", JSON.stringify(parsed));
      }

      alert("Listing deleted successfully!");
      router.push("/marketplace");
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete listing. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-white">Loading product...</div>;
  }

  if (!product) {
    return <div className="p-6 text-white">Product not found.</div>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 bg-black min-h-screen text-white"
    >
      <h1 className="text-xl font-bold mb-4">Edit Listing</h1>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full p-2 rounded bg-gray-900 text-white"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        className="w-full p-2 rounded bg-gray-900 text-white"
      />
      <input
        type="text"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
        className="w-full p-2 rounded bg-gray-900 text-white"
      />
      <input
        type="email"
        placeholder="Contact Email"
        value={contactEmail}
        onChange={(e) => setContactEmail(e.target.value)}
        required
        className="w-full p-2 rounded bg-gray-900 text-white"
      />
      <input
        type="text"
        placeholder="Country"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="w-full p-2 rounded bg-gray-900 text-white"
      />
      <input
        type="text"
        placeholder="State"
        value={stateName}
        onChange={(e) => setStateName(e.target.value)}
        className="w-full p-2 rounded bg-gray-900 text-white"
      />
      <input
        type="text"
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-full p-2 rounded bg-gray-900 text-white"
      />

      {/* Images Preview */}
      {previewImages.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {previewImages.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Preview ${idx + 1}`}
              className="rounded"
            />
          ))}
        </div>
      )}

      {/* Video Preview */}
      {previewVideo && (
        <video controls src={previewVideo} className="mt-2 w-full rounded" />
      )}

      <div className="flex gap-4 mt-6">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          {deleting ? "Deleting..." : "Delete Listing"}
        </button>
      </div>
    </form>
  );
}
