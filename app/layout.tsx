// app/layout.tsx  (server component)
import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthProvider";
import { NotificationsProvider } from "@/context/NotificationsContext";
import Navbar from "./Components/Navbar";
import ClientProviders from "./Components/ClientProviders";
import ToastProvider from "./Components/ToastProvider";
import TesliteAIWidget from "./Components/TesliteAIWidget";
import FloatingTeslaNews from "./Components/FloatingTeslaNews";

export const metadata: Metadata = {
  title: "Teslites",
  description: "Tesla Elites Community",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen">
        <AuthProvider>
          {/* ✅ Notifications now available everywhere */}
          <NotificationsProvider>
            <ClientProviders>
              <Navbar />
              <main className="pt-16">{children}</main>

              {/* Toast alerts */}
              <ToastProvider />

              {/* 🤖 Teslite AI Assistant Widget */}
              <TesliteAIWidget />
            </ClientProviders>
          </NotificationsProvider>
        </AuthProvider>
        <FloatingTeslaNews />
      </body>
    </html>
  );
}
