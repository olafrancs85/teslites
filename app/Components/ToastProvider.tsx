"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "linear-gradient(145deg, #0d0d0d, #111)",
            color: "#fff",
            border: "1px solid #ff0000",
            boxShadow: "0 0 12px rgba(255, 0, 0, 0.3)",
            borderRadius: "10px",
            padding: "12px 16px",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.9rem",
          },
          success: {
            style: {
              borderColor: "#16a34a",
              boxShadow: "0 0 14px rgba(22, 163, 74, 0.4)",
              animation: "pulse-green 1.5s infinite",
            },
            iconTheme: {
              primary: "#16a34a",
              secondary: "#111",
            },
          },
          error: {
            style: {
              borderColor: "#ef4444",
              boxShadow: "0 0 14px rgba(239, 68, 68, 0.4)",
              animation: "pulse-red 1.5s infinite",
            },
            iconTheme: {
              primary: "#ef4444",
              secondary: "#111",
            },
          },
        }}
      />

      <style jsx global>{`
        @keyframes pulse-red {
          0% {
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
          }
          100% {
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
          }
        }
        @keyframes pulse-green {
          0% {
            box-shadow: 0 0 10px rgba(22, 163, 74, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(22, 163, 74, 0.6);
          }
          100% {
            box-shadow: 0 0 10px rgba(22, 163, 74, 0.3);
          }
        }
      `}</style>
    </>
  );
}
