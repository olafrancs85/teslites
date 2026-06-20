import { useState } from "react";

export const useTeslaNewsRewrite = () => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Attempts to fetch a rewritten article from our API.
   * If fails, content remains null and error is set.
   */
  const rewrite = async (url: string) => {
    setLoading(true);
    setError(null);
    setContent(null);
    try {
      const res = await fetch("/api/tesla/news/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (res.ok && data.content) {
        setContent(data.content);
      } else {
        // API returned an error or empty content
        setError(data.error || "Failed to rewrite article");
      }
    } catch (err: any) {
      console.error("Rewrite error:", err);
      setError(err.message || "Unknown error occurred while rewriting");
    } finally {
      setLoading(false);
    }
  };

  /**
   * If rewrite fails, open external URL in new tab.
   */
  const openExternalFallback = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return { loading, content, error, rewrite, openExternalFallback };
};
