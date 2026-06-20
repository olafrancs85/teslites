"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getAuth, onAuthStateChanged, User } from "firebase/auth"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsubscribe()
  }, [])

  const cards = [
    {
      title: "Marketplace",
      href: "/marketplace",
      desc: "Browse & list pre-owned Tesla products — cars, Cybertruck, solar hardware and more.",
      cta: "Go to Marketplace",
      accent: "red",
    },
    {
      title: "Community",
      href: "/community",
      desc: "Connect with Tesla owners and enthusiasts, share experiences, reviews and tips.",
      cta: "Join Community",
      accent: "indigo",
    },
    {
      title: "Social Impact",
      href: "/social-impact",
      desc: "Find and support community projects powered by Tesla lovers — donations, campaigns, and more.",
      cta: "See Projects",
      accent: "emerald",
    },
    {
      title: "Rewards",
      href: "/rewards",
      desc: "See monthly rewards and how to win — top contributors and best posts get recognized.",
      cta: "View Rewards",
      accent: "yellow",
    },
  ]

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-red-600 mb-4">🚗 Teslites</h1>
          <p className="text-white/90 leading-relaxed">
            Welcome to the Tesla Elites community app - where Tesla enthusiasts, innovators, and
            business minds collaborate to shape the future of sustainable technology.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {/* 💡 Make Innovation Lab first if user is logged in */}
          {user && <InnovationLabCard user={user} />}

          {/* Render the rest of the cards */}
          {cards.map((c) => (
            <Card key={c.title} {...c} />
          ))}

          {/* If not logged in, place Innovation Lab last */}
          {!user && <InnovationLabCard user={null} />}
        </section>
      </div>
    </main>
  )
}

/* General Card component */
function Card({
  title,
  href,
  desc,
  cta,
  accent,
}: {
  title: string
  href: string
  desc: string
  cta: string
  accent?: string
}) {
  const accentClass =
    accent === "red"
      ? "border-red-600"
      : accent === "indigo"
      ? "border-indigo-500"
      : accent === "emerald"
      ? "border-emerald-500"
      : accent === "yellow"
      ? "border-yellow-400"
      : "border-gray-500"

  return (
    <article className={`p-6 rounded-lg bg-gray-900 border ${accentClass}`}>
      <h3 className="text-xl font-bold text-red-400 mb-2">{title}</h3>
      <p className="text-gray-200 mb-4">{desc}</p>
      <Link
        href={href}
        className="inline-block px-4 py-2 rounded bg-white text-black hover:bg-gray-200 transition"
      >
        {cta}
      </Link>
    </article>
  )
}

/* 💡 Innovation Lab Card */
function InnovationLabCard({ user }: { user: User | null }) {
  const isLoggedIn = !!user
  const accentClass = "border-purple-500"

  return (
    <article
      className={`p-6 rounded-lg bg-gray-900 border ${accentClass} ${
        isLoggedIn ? "" : "opacity-60 cursor-not-allowed"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold text-purple-400">💡 Innovation Lab</h3>
        {isLoggedIn && (
          <span className="text-xs bg-purple-700 px-2 py-1 rounded">Members Only</span>
        )}
      </div>
      <p className="text-gray-200 mb-4">
        Pitch design ideas, propose Tesla tech upgrades, and collaborate with other innovators
        shaping the next evolution of Tesla.
      </p>

      {isLoggedIn ? (
        <Link
          href="/innovation-lab"
          className="inline-block px-4 py-2 rounded bg-purple-500 text-white hover:bg-purple-600 transition"
        >
          Enter Innovation Lab
        </Link>
      ) : (
        <Link
          href="/auth"
          className="inline-block px-4 py-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
        >
          Login to Enter
        </Link>
      )}
    </article>
  )
}
