"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTeslaNewsRewrite } from "@/hooks/useTeslaNewsRewrite";

export default function TeslaNewsDetailPage() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") || ""; // the original article URL
  const { loading, content, error, rewrite } = useTeslaNewsRewrite();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration/blinking issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only call rewrite API after mount and if URL exists
  useEffect(() => {
    if (mounted && url) {
      rewrite(url);
    }
  }, [mounted, url]);

  if (!mounted) return null; // avoids client/server mismatch

  return (
    <div className="max-w-4xl mx-auto p-4">
      {loading && <p>Loading news...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {content && (
        <div className="prose prose-lg" dangerouslySetInnerHTML={{ __html: content }} />
      )}
      {!loading && !content && !error && <p>No news selected.</p>}
    </div>
  );
}
