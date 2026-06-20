"use client";
import Link from "next/link";

export default function GroupsPage() {
  const groups = [
    { name: "Tesla Owners", slug: "eesla-owners" },
    { name: "EV Charging", slug: "ev-charging" },
    { name: "Innovations & Tech", slug: "innovations-tech" },
    { name: "Sustainability", slug: "sustainability" },
  ];

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Community Groups</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <Link key={group.slug} href={`/community/groups/${group.slug}`}>
            <div className="p-6 bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer">
              <h2 className="text-xl font-semibold">{group.name}</h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
