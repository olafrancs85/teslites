"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useNotifications } from "@/context/NotificationsContext";
import getUsername from "@/lib/getUsername";
import { Bell } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications = [], unreadCount = 0, markAllAsRead } = useNotifications() as any;

  const [username, setUsername] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement | null>(null);
  const moreRef = useRef<HTMLDivElement | null>(null);

  /** Load username */
  useEffect(() => {
    const stored = localStorage.getItem("teslites_username");
    if (stored) {
      setUsername(stored);
      return;
    }

    const email = user?.email || localStorage.getItem("teslites_userEmail") || null;
    if (email) setUsername(getUsername(email));
    else setUsername(null);
  }, [user]);

  /** Close notifications + More dropdown on outside click */
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (e) {
      console.warn("Logout error", e);
    }
  };

  /** Toggle notifications */
  const toggleNotifications = () => {
    const open = !notifOpen;
    setNotifOpen(open);
    if (open && typeof markAllAsRead === "function") {
      markAllAsRead();
    }
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 bg-black text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-red-500 font-bold text-xl hover:text-red-400 transition">
              Teslites
            </Link>
          </div>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="hover:text-red-400 transition">Home</Link>
            <Link href="/marketplace" className="hover:text-red-400 transition">Marketplace</Link>
            <Link href="/community" className="hover:text-red-400 transition">Community</Link>
            <Link href="/social-impact" className="hover:text-red-400 transition">Social Impact</Link>
            <Link href="/tesla/systems" className="hover:text-red-400 transition">Systems</Link>

            {/* Hubs */}
            <Link href="/tesla" className="hover:text-green-500 font-semibold">Tesla Hub</Link>
            <Link href="/intelligence/spacex" className="hover:text-blue-500 font-semibold">SpaceX Hub</Link>
            <Link href="/tesla/optimus" className="hover:text-green-600 font-semibold">Optimus Hub</Link>
            {user && (
              <Link href="/innovation-lab" className="hover:text-red-400 transition">
                Innovation Lab
              </Link>
            )}

            {/* MORE DROPDOWN */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="hover:text-red-400 transition"
              >
                More ▾
              </button>

              {moreOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 py-2">
                  <Link href="/rewards" className="block px-4 py-2 hover:bg-gray-800 transition">
                    Rewards
                  </Link>
                  <Link href="/adventure" className="block px-4 py-2 hover:bg-gray-800 transition">
                    Adventure
                  </Link>
                  {user && (
                    <Link
                      href="/profile"
                      className="block px-4 py-2 hover:bg-gray-800 transition"
                    >
                      My Profile
                    </Link>
                  )}
                  <Link
                    href="/profiles"
                    className="block px-4 py-2 hover:bg-gray-800 transition"
                  >
                    Profiles
                  </Link>
                  {user && (
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-800 transition text-red-400"
                    >
                      Logout
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* NOTIFICATION BELL */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 rounded hover:bg-gray-800 transition"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-xs px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
                    <div className="p-3 border-b border-gray-700 font-semibold flex justify-between">
                      <span>Notifications</span>
                      <button
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => markAllAsRead && markAllAsRead()}
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-gray-400 text-sm text-center">
                          No notifications yet
                        </p>
                      ) : (
                        notifications.map((n: any) => (
                          <a
                            key={n.id}
                            href={n.link || "#"}
                            className="block p-3 border-b border-gray-800 hover:bg-gray-800 transition text-sm"
                          >
                            <div className="text-slate-200 truncate">{n.message}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {n.createdAt && n.createdAt.toDate
                                ? new Date(n.createdAt.toDate()).toLocaleString()
                                : new Date(n.createdAt).toLocaleString()}
                            </div>
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* USERNAME */}
            {user && (
              <span className="text-sm text-gray-300">
                <span className="text-red-400">@{username || "user"}</span>
              </span>
            )}

            {!user && (
              <Link
                href="/login"
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow transition"
              >
                Login
              </Link>
            )}
          </div>

          {/* MOBILE CONTROLS */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Notification Bell */}
            {user && (
              <button
                onClick={() => {
                  markAllAsRead && markAllAsRead();
                  setMenuOpen(true);
                }}
                className="p-2 rounded hover:bg-gray-800 transition"
              >
                <Bell className="w-5 h-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {menuOpen ? (
                <span className="text-xl">✕</span>
              ) : (
                <span className="text-xl">☰</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DROPDOWN */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900 px-4 py-3 space-y-2">
          <Link href="/" onClick={() => setMenuOpen(false)} className="block">Home</Link>
          <Link href="/marketplace" onClick={() => setMenuOpen(false)} className="block">Marketplace</Link>
          <Link href="/community" onClick={() => setMenuOpen(false)} className="block">Community</Link>
          <Link href="/social-impact" onClick={() => setMenuOpen(false)} className="block">Social Impact</Link>
          <Link href="/tesla/systems" onClick={() => setMenuOpen(false)} className="block">Systems</Link>

{/* Hubs */}
<Link
  href="/tesla"
  onClick={() => setMenuOpen(false)}
  className="block font-semibold hover:text-green-500"
>
  Tesla Hub
</Link>
<Link
  href="/intelligence/spacex"
  onClick={() => setMenuOpen(false)}
  className="block font-semibold hover:text-blue-500"
>
  SpaceX Hub
</Link>
<Link
  href="/tesla/optimus"
  onClick={() => setMenuOpen(false)}
  className="block font-semibold hover:text-green-600"
>
  Optimus Hub
</Link>

{user && (
  <Link
    href="/innovation-lab"
    onClick={() => setMenuOpen(false)}
    className="block"
  >
    Innovation Lab
  </Link>
)}

{/* Mobile MORE */}
<div className="relative">
  <button
    onClick={() => setMoreOpen(!moreOpen)}
    className="block w-full text-left hover:text-red-400 transition"
  >
    More ▾
  </button>
  {moreOpen && (
    <div className="mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 py-2">
      <Link
        href="/rewards"
        onClick={() => setMenuOpen(false)}
        className="block px-4 py-2 hover:bg-gray-800 transition"
      >
        Rewards
      </Link>
      <Link
        href="/adventure"
        onClick={() => setMenuOpen(false)}
        className="block px-4 py-2 hover:bg-gray-800 transition"
      >
        Adventure
      </Link>
      {user && (
        <Link
          href="/profile"
          onClick={() => setMenuOpen(false)}
          className="block px-4 py-2 hover:bg-gray-800 transition"
        >
          My Profile
        </Link>
      )}
      <Link
        href="/profiles"
        onClick={() => setMenuOpen(false)}
        className="block px-4 py-2 hover:bg-gray-800 transition"
      >
        Profiles
      </Link>
      {user && (
        <button
          onClick={() => { setMenuOpen(false); handleLogout(); }}
          className="block w-full text-left px-4 py-2 hover:bg-gray-800 transition text-red-400"
        >
          Logout
        </button>
      )}
    </div>
  )}
</div>

{/* Login for unauthenticated users */}
{!user && (
  <Link
    href="/login"
    onClick={() => setMenuOpen(false)}
    className="block bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-center"
  >
    Login
  </Link>
)}
        </div>
      )}
    </nav>
  );
}