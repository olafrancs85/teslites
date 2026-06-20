"use client";

import React from "react";
import Link from "next/link";

type Props = {
  id: string;
  title: string;
  description: string;
  category: "innovation" | "tesla" | string;
  difficulty?: "easy" | "medium" | "hard";
  rewardPoints?: number;
  imageURL?: string;
};

export default function AdventureCard({
  id,
  title,
  description,
  category,
  difficulty = "easy",
  rewardPoints = 100,
  imageURL,
}: Props) {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow hover:shadow-red-500/20 transition">
      {imageURL ? (
        <img src={imageURL} alt={title} className="w-full h-36 object-cover" />
      ) : (
        <div className="w-full h-36 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-center text-slate-400">
          {category.toUpperCase()}
        </div>
      )}

      <div className="p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-slate-400 line-clamp-2 my-2">{description}</p>

        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-slate-400">
            {difficulty.toUpperCase()} • {rewardPoints} pts
          </div>
          <Link href={`/adventure/${id}`}>
            <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
              View
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
