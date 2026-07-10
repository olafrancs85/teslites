"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import CommentsSection from "@/components/CommentsSection";

/* =============================
   TYPES
============================= */
interface NewsItem {
  title: string;
  description: string;
  url: string;
  image: string;
  source: string;
  publishedAt: string;
}

interface RewrittenArticle {
  title: string;
  summary: string;
  content: string;
  source: string;
  url: string;
  publishedAt: string;
}

const articleStyles = `
.article-document {
  max-width: 720px;
  margin: 0 auto;
  font-size: 17px;
  line-height: 1.75;
}

.article-document p {
  margin: 0 0 1.25rem 0;
  text-align: justify;
}

.article-document h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 2.5rem 0 1rem 0;
}

.article-document strong {
  font-weight: 600;
}

.article-document img {
  margin: 1.5rem auto;
}

.article-document blockquote {
  margin: 2rem 0;
  padding-left: 1rem;
  border-left: 4px solid #ef4444;
  color: #374151;
}
`;

/* =============================
   COMPONENT
============================= */
function TeslaNewsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const src = searchParams.get("src") ?? "";

  /* ---- LIST STATE ---- */
  const [news, setNews] = useState<NewsItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  /* ---- ARTICLE STATE ---- */
  const [article, setArticle] = useState<RewrittenArticle | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState("");

  /* =============================
     MODE 1: NEWS LIST
  ============================= */
  useEffect(() => {
    if (src) return;

    setListLoading(true);
    setListError("");
    setArticle(null);

    async function fetchNews() {
      try {
        const res = await fetch("/api/teslite-ai/live/tesla-news", {
          cache: "no-store",
        });

        if (!res.ok) {
          setListError("Failed to load Tesla news");
          setListLoading(false);
          return;
        }

        const data = await res.json();
        setNews(data.news || []);
      } catch (err) {
        console.error("News Fetch Error:", err);
        setListError("Error fetching Tesla news");
      } finally {
        setListLoading(false);
      }
    }

    fetchNews();
  }, [src]);

  /* =============================
     MODE 2: ARTICLE READER
  ============================= */
  useEffect(() => {
    if (!src) return;

    setArticle(null);
    setArticleLoading(true);
    setArticleError("");

    async function fetchArticle() {
      try {
        const res = await fetch(
          `/api/teslite-ai/rewrite?url=${encodeURIComponent(src)}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMsg = errorData?.error || `Error ${res.status}`;
          setArticleError(`Unable to load article: ${errorMsg}`);
          setArticleLoading(false);
          return;
        }

        const data = await res.json();

        if (!data?.title) {
          setArticleError("Article title is missing");
          setArticleLoading(false);
          return;
        }

        if (!data?.content) {
          setArticleError("Article content is unavailable");
          setArticleLoading(false);
          return;
        }

        // Provide fallback summary if missing
        const summary = data?.summary || "Summary unavailable for this article.";

        let cleanedContent = data.content
          .replace(/<strong>([A-Z\s]{5,})<\/strong>/g, "<h2 class='mt-8 mb-4'>$1</h2>")
          .replace(/\|\s*Photo Credit:\s*\n\s*/g, "| Photo Credit: ")
          .replace(/<p>\s*<\/p>/g, "")
          .replace(
            /(BACK TO TOP|Comments\s*$|Published on.*$|Log in to our website.*$|Oops! Looks like you have exceeded.*$|Catch all the Business News.*$|Download The .* App.*$)/gim,
            ""
          )
          .replace(
            /(<p>)([\s\S]*?)(<\/p>)/g,
            (_: string, open: string, content: string, close: string) => {
              const cleanText = content
                .replace(/\n+/g, " ")
                .replace(/\s+/g, " ")
                .trim();
              return cleanText.length > 0 ? `${open}${cleanText}${close}` : "";
            }
          );

        if (!/^<p|^<h2/.test(cleanedContent.trim())) {
          cleanedContent = `<p>${cleanedContent}</p>`;
        }

        setArticle({
          title: data.title,
          summary: summary,
          content: cleanedContent,
          source: data.source || new URL(src).hostname || "Unknown",
          url: data.url || src,
          publishedAt: data.publishedAt || new Date().toISOString(),
        });
      } catch (err) {
        console.error("Article Fetch Error:", err);
        setArticleError("Unable to load article. Please try again later.");
      } finally {
        setArticleLoading(false);
      }
    }

    fetchArticle();
  }, [src]);

  /* =============================
     RENDER: ARTICLE VIEW
  ============================= */
  if (src) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <button
          onClick={() => router.push("/tesla/news")}
          className="mb-6 text-sm text-red-600 hover:underline"
        >
          ← Back to Tesla News
        </button>

        {articleLoading && <p className="text-gray-500">Loading article…</p>}

        {articleError && (
          <p className="text-red-500 font-semibold">{articleError}</p>
        )}

        {article && (
          <>
            <style>{articleStyles}</style>
            <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

            <div className="text-sm text-gray-500 mb-6">
              {article.source} • {new Date(article.publishedAt).toLocaleString()}
            </div>

            <div className="bg-white border-l-4 border-red-500 p-4 mb-6 text-black">
              <strong>Tesla AI Summary:</strong>
              <p className="mt-2">{article.summary}</p>
            </div>

            <div
              className="article-document"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            <div className="mt-8 pt-6 border-t text-sm text-gray-500">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:underline font-medium"
              >
                Read on Original Source →
              </a>
            </div>

            <CommentsSection articleId={src} />
          </>
        )}
      </div>
    );
  }

  /* =============================
     RENDER: NEWS LIST
  ============================= */
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Tesla News</h1>

      {listLoading && <p className="text-gray-500">Loading Tesla updates…</p>}

      {listError && <p className="text-red-500 font-semibold">{listError}</p>}

      <div className="grid gap-6 mt-6">
        {news.map((item, idx) => (
          <div
            key={idx}
            onClick={() =>
              router.push(`/tesla/news?src=${encodeURIComponent(item.url)}`)
            }
            className="cursor-pointer bg-white shadow-sm border rounded-lg p-4 hover:shadow-md transition"
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-56 object-cover rounded"
              />
            )}

            <div className="mt-4">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="text-gray-600 mt-2">{item.description}</p>

              <div className="text-sm text-gray-500 mt-3">
                <span className="font-medium">{item.source}</span> •{" "}
                {new Date(item.publishedAt).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default function TeslaNewsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeslaNewsContent />
    </Suspense>
  );
}