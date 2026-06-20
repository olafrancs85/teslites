"use client";

import { useState } from "react";

type ListingFormProps = {
  initialData?: any; // For editing
  isEdit?: boolean; // Distinguish between new/edit
  onSubmit?: (data: any) => Promise<void> | void; // Parent handles Firestore/Storage
  buttonLabel?: string; // Customizable button text
};

export default function ListingForm({
  initialData,
  isEdit = false,
  onSubmit,
  buttonLabel,
}: ListingFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [price, setPrice] = useState(initialData?.price || "");
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || "");
  const [country, setCountry] = useState(initialData?.country || "");
  const [state, setState] = useState(initialData?.state || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [video, setVideo] = useState<string | null>(initialData?.video || null);

  // Handle multiple images (local preview only)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setImages((prev) => [...prev, reader.result!.toString()]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle video (local preview only)
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) setVideo(reader.result.toString());
    };
    reader.readAsDataURL(file);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newData = {
      id: initialData?.id || Date.now().toString(),
      title,
      description,
      price: Number(price),
      contactEmail,
      country,
      state,
      city,
      images,
      video,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };

    if (onSubmit) {
      await onSubmit(newData); // Parent saves to Firestore
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      {/* Title */}
      <div>
        <label className="block mb-1">Title</label>
        <input
          className="w-full p-2 rounded bg-gray-800 text-white"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block mb-1">Description</label>
        <textarea
          className="w-full p-2 rounded bg-gray-800 text-white"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      {/* Price */}
      <div>
        <label className="block mb-1">Price</label>
        <input
          type="number"
          className="w-full p-2 rounded bg-gray-800 text-white"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>

      {/* Contact Email */}
      <div>
        <label className="block mb-1">Contact Email</label>
        <input
          type="email"
          className="w-full p-2 rounded bg-gray-800 text-white"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          required
        />
      </div>

      {/* Country */}
      <div>
        <label className="block mb-1">Country</label>
        <input
          className="w-full p-2 rounded bg-gray-800 text-white"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
      </div>

      {/* State */}
      <div>
        <label className="block mb-1">State</label>
        <input
          className="w-full p-2 rounded bg-gray-800 text-white"
          value={state}
          onChange={(e) => setState(e.target.value)}
        />
      </div>

      {/* City */}
      <div>
        <label className="block mb-1">City</label>
        <input
          className="w-full p-2 rounded bg-gray-800 text-white"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>

      {/* Images */}
      <div>
        <label className="block mb-1">Images</label>
        <input type="file" multiple onChange={handleImageUpload} />
        <div className="grid grid-cols-3 gap-2 mt-2">
          {images.map((img, idx) => (
            <img key={idx} src={img} alt="Preview" className="rounded" />
          ))}
        </div>
      </div>

      {/* Video */}
      <div>
        <label className="block mb-1">Video</label>
        <input type="file" accept="video/*" onChange={handleVideoUpload} />
        {video && <video controls src={video} className="mt-2 w-full rounded" />}
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {buttonLabel || (isEdit ? "Update Listing" : "Create Listing")}
      </button>
    </form>
  );
}
