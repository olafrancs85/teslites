"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FloatingTeslaNews() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="fixed bottom-28 right-6 z-50">
      <div className="relative">
        {open && (
          <div className="absolute bottom-14 right-0 bg-black border border-gray-800 rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => router.push("/tesla/news")}
              className="block w-full px-4 py-3 text-left hover:bg-gray-900"
            >
              Tesla News
            </button>
            <button
              onClick={() => router.push("/tesla/stock")}
              className="block w-full px-4 py-3 text-left hover:bg-gray-900"
            >
              Tesla Stock
            </button>
          </div>
        )}

        <button
          onClick={() => setOpen(!open)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-full shadow-lg"
        >
          Tesla Live
        </button>
      </div>
    </div>
  );
}
