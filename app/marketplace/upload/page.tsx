"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import getUsername from "@/lib/getUsername";

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id"); // if present => edit mode

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [country, setCountry] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [city, setCity] = useState("");

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // load existing listing if edit mode
  useEffect(() => {
    if (!editId) return;
    const raw = localStorage.getItem("marketplaceListings");
    if (!raw) return;
    try {
      const items = JSON.parse(raw);
      const found = items.find((item: any) => item.id === editId);
      if (found) {
        setTitle(found.title || "");
        setDescription(found.description || "");
        setPrice(found.price?.toString() || "");
        setContactEmail(found.contactEmail || "");
        setCountry(found.country || "");
        setStateVal(found.state || "");
        setCity(found.city || "");
        setPreviewImages(found.images || []);
        setPreviewVideo(found.video || null);
      }
    } catch (err) {
      console.error("Failed to load listing:", err);
    }
  }, [editId]);

  // cleanup previews
  useEffect(() => {
    return () => {
      previewImages.forEach((u) => URL.revokeObjectURL(u));
      if (previewVideo) URL.revokeObjectURL(previewVideo);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    previewImages.forEach((u) => URL.revokeObjectURL(u));

    const files = Array.from(e.target.files);
    setImageFiles(files);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewImages(urls);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setVideoFile(null);
      if (previewVideo) {
        URL.revokeObjectURL(previewVideo);
        setPreviewVideo(null);
      }
      return;
    }
    if (previewVideo) URL.revokeObjectURL(previewVideo);
    const file = e.target.files[0];
    setVideoFile(file);
    setPreviewVideo(URL.createObjectURL(file));
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!title.trim() || !description.trim() || !price.trim() || !contactEmail.trim()) {
      setMessage("Please fill required fields (title, description, price, contact email).");
      return;
    }

    setLoading(true);

    try {
      const imageDataUrls: string[] = [];
      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          try {
            const dataUrl = await fileToDataUrl(imageFiles[i]);
            imageDataUrls.push(dataUrl);
          } catch (err) {
            console.error("Failed to convert image:", err);
          }
        }
      }

      let videoDataUrl: string | null = null;
      if (videoFile) {
        try {
          videoDataUrl = await fileToDataUrl(videoFile);
        } catch (err) {
          console.error("Failed to convert video:", err);
        }
      }

      const savedEmail = localStorage.getItem("teslites_userEmail") || contactEmail;
      const ownerName = localStorage.getItem("teslites_username") || getUsername(savedEmail);

      const raw = localStorage.getItem("marketplaceListings");
      const existing = raw ? JSON.parse(raw) : [];

      if (editId) {
        // --- UPDATE EXISTING ---
        const idx = existing.findIndex((item: any) => item.id === editId);
        if (idx !== -1) {
          existing[idx] = {
            ...existing[idx],
            title: title.trim(),
            description: description.trim(),
            price: Number(price),
            contactEmail: contactEmail.trim(),
            country: country.trim() || null,
            state: stateVal.trim() || null,
            city: city.trim() || null,
            images: imageDataUrls.length > 0 ? imageDataUrls : existing[idx].images,
            video: videoDataUrl !== null ? videoDataUrl : existing[idx].video,
            ownerEmail: savedEmail,
            ownerName,
          };
        }
        localStorage.setItem("marketplaceListings", JSON.stringify(existing));
        setMessage("Listing updated ✅");
      } else {
        // --- CREATE NEW ---
        const newListing = {
          id: Date.now().toString(),
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          contactEmail: contactEmail.trim(),
          country: country.trim() || null,
          state: stateVal.trim() || null,
          city: city.trim() || null,
          images: imageDataUrls,
          video: videoDataUrl,
          ownerEmail: savedEmail,
          ownerName,
          createdAt: new Date().toISOString(),
        };
        existing.unshift(newListing);
        localStorage.setItem("marketplaceListings", JSON.stringify(existing));
        setMessage("Listing saved locally ✅");
      }

      setTimeout(() => {
        router.push("/marketplace");
      }, 700);
    } catch (err) {
      console.error("Save failed:", err);
      setMessage("Save failed — check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          {editId ? "Edit Listing" : "Create Listing"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 p-6 rounded-lg shadow">
          {/* Title */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 rounded bg-black/60 text-white border border-gray-800"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 rounded bg-black/60 text-white border border-gray-800"
              rows={4}
              required
            />
          </div>

          {/* Price, Email, Country */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Price (USD) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2 rounded bg-black/60 text-white border border-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Contact Email *</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full p-2 rounded bg-black/60 text-white border border-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Country</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full p-2 rounded bg-black/60 text-white border border-gray-800"
              />
            </div>
          </div>

          {/* State, City */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">State</label>
              <input
                value={stateVal}
                onChange={(e) => setStateVal(e.target.value)}
                className="w-full p-2 rounded bg-black/60 text-white border border-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2 rounded bg-black/60 text-white border border-gray-800"
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Upload Images</label>
            <input type="file" accept="image/*" multiple onChange={handleImageChange} className="text-white" />
            {previewImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {previewImages.map((src, i) => (
                  <img key={i} src={src} alt={`Preview ${i + 1}`} className="w-full h-28 object-cover rounded" />
                ))}
              </div>
            )}
          </div>

          {/* Video */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Upload Video (optional)</label>
            <input type="file" accept="video/*" onChange={handleVideoChange} className="text-white" />
            {previewVideo && (
              <div className="mt-3">
                <video controls src={previewVideo} className="w-full rounded" />
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : editId ? "Update Listing" : "Create Listing"}
            </button>

            <div className="text-sm text-gray-400">
              <span className="text-xs">Signed in as </span>
              <span className="text-red-400">
                @{getUsername(localStorage.getItem("teslites_userEmail") || contactEmail)}
              </span>
            </div>
          </div>

          {message && <div className="mt-2 text-sm text-yellow-300">{message}</div>}
        </form>
      </div>
    </div>
  );
}
