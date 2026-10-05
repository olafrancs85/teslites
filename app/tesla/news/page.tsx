"use client";
import { useEffect, useRef, useState } from "react";
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
  image: string;
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

const articleImage =
  searchParams.get("image") ?? "";

const requestedPage = Math.max(
  1,
  Number(searchParams.get("page") || "1")
);

  /* ---- LIST STATE ---- */
  const [news, setNews] = useState<NewsItem[]>([]);
const [listLoading, setListLoading] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);
const [listError, setListError] = useState("");
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const [hasLoadedInitialPage, setHasLoadedInitialPage] =
  useState(false);

  const hasStartedInitialFetch = useRef(false);

  /* ---- ARTICLE STATE ---- */
  const [article, setArticle] = useState<RewrittenArticle | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState("");

  const ARTICLE_CACHE_PREFIX = "teslites_article_";

  const NEWS_SCROLL_KEY =
  "teslites_news_scroll_position";

  /* =============================
     MODE 1: NEWS LIST
  ============================= */
  useEffect(() => {
  // Article mode does not load the news list.
  if (src) return;

  // Prevent the initial request from starting more than once.
  // This also protects against React Strict Mode running
  // the effect twice during development.
  if (hasStartedInitialFetch.current) return;

  // Mark it as started BEFORE making the request.
  hasStartedInitialFetch.current = true;

  async function fetchNews() {
    setListLoading(true);
    setListError("");

    try {
      console.log(
        "📰 Loading Tesla News page:",
        requestedPage
      );

      const res = await fetch(
        `/api/teslite-ai/live/tesla-news?page=${requestedPage}`,
        {
          cache: "no-store",
        }
      );

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(
            "News service is temporarily busy. Please try again in a few seconds."
          );
        }

        throw new Error(
          `Failed to load news page ${requestedPage}`
        );
      }

      const data = await res.json();

      const pageNews: NewsItem[] =
        data.news || [];

      setNews(pageNews);
      setPage(requestedPage);

      setHasMore(
        data.hasMore === true &&
        pageNews.length > 0
      );

      setHasLoadedInitialPage(true);

      console.log(
        "✅ Tesla News page loaded:",
        {
          page: requestedPage,
          articles: pageNews.length,
          hasMore: data.hasMore,
          source: data.source,
          totalArticles: data.totalArticles,
        }
      );
    } catch (err) {
      console.error(
        "News Fetch Error:",
        err
      );

      setListError(
        err instanceof Error
          ? err.message
          : "Error fetching Tesla news"
      );
    } finally {
      setListLoading(false);
    }
  }

  fetchNews();
}, [src, requestedPage]);

  async function loadMoreNews() {
  if (loadingMore || !hasMore) {
    return;
  }

  try {
    setLoadingMore(true);
    setListError("");

    const nextPage = page + 1;

    console.log(
      "📰 Loading Tesla News page:",
      nextPage
    );

    const res = await fetch(
      `/api/teslite-ai/live/tesla-news?page=${nextPage}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      if (res.status === 429) {
        throw new Error(
          "News service is temporarily busy. Please try again in a few seconds."
        );
      }

      throw new Error(
        `Failed to load page ${nextPage}`
      );
    }

    const data = await res.json();

    const incomingNews: NewsItem[] =
      data.news || [];

    setNews((previousNews) => {
      const existingUrls = new Set(
        previousNews.map(
          (item) => item.url
        )
      );

      const newArticles =
        incomingNews.filter(
          (item) =>
            !existingUrls.has(item.url)
        );

      return [
        ...previousNews,
        ...newArticles,
      ];
    });

    setPage(nextPage);

    router.push(
  `/tesla/news?page=${nextPage}`,
  {
    scroll: false,
  }
);

    setHasMore(
      data.hasMore !== false &&
      incomingNews.length > 0
    );
  } catch (error) {
    console.error(
      "Load More News Error:",
      error
    );

    setListError(
      error instanceof Error
        ? error.message
        : "Unable to load older Tesla news."
    );
  } finally {
    setLoadingMore(false);
  }
}

  /* =============================
     MODE 2: ARTICLE READER
  ============================= */
  useEffect(() => {
    if (!src) return;

    let cancelled = false;
    const cacheKey = `${ARTICLE_CACHE_PREFIX}${src}`;

    setArticle(null);
    setArticleLoading(true);
    setArticleError("");

    try {
      const cachedArticle = sessionStorage.getItem(cacheKey);

      if (cachedArticle) {
        const parsedArticle =
  JSON.parse(cachedArticle) as RewrittenArticle;

if (
  parsedArticle.title &&
  parsedArticle.summary &&
  parsedArticle.content &&
  parsedArticle.source &&
  parsedArticle.url &&
  parsedArticle.publishedAt
) {
  const cachedFinalArticle: RewrittenArticle = {
    ...parsedArticle,
    image:
      parsedArticle.image ||
      articleImage,
  };

  setArticle(cachedFinalArticle);
          setArticleLoading(false);
          return () => {
            cancelled = true;
          };
        }
      }
    } catch (cacheError) {
      console.warn("Could not read cached article:", cacheError);
    }

    async function fetchArticle() {
      try {
        const res = await fetch(
          `/api/teslite-ai/rewrite?url=${encodeURIComponent(src)}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMsg = errorData?.error || `Error ${res.status}`;

          if (!cancelled) {
            setArticleError(`Unable to load article: ${errorMsg}`);
          }

          return;
        }

        const data = await res.json();

        if (!data?.title) {
          if (!cancelled) setArticleError("Article title is missing");
          return;
        }

        if (!data?.content) {
          if (!cancelled) setArticleError("Article content is unavailable");
          return;
        }

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

        const finalArticle: RewrittenArticle = {
  title: data.title,
  summary,
  content: cleanedContent,
  source:
    data.source ||
    new URL(src).hostname ||
    "Unknown",
  url: data.url || src,
  publishedAt:
    data.publishedAt ||
    new Date().toISOString(),
  image: articleImage,
};

        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(finalArticle));
          console.log("Rewritten article cached:", src);
        } catch (cacheError) {
          console.warn("Could not cache article:", cacheError);
        }

        if (!cancelled) {
          setArticle(finalArticle);
        }
      } catch (err) {
        console.error("Article Fetch Error:", err);

        if (!cancelled) {
          setArticleError("Unable to load article. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setArticleLoading(false);
        }
      }
    }

    fetchArticle();

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
  if (src) return;

  const savedScrollPosition =
    sessionStorage.getItem(
      NEWS_SCROLL_KEY
    );

  if (!savedScrollPosition) {
    return;
  }

  const scrollPosition =
    Number(savedScrollPosition);

  if (!Number.isFinite(scrollPosition)) {
    return;
  }

  requestAnimationFrame(() => {
    window.scrollTo({
      top: scrollPosition,
      behavior: "instant",
    });
  });

  sessionStorage.removeItem(
    NEWS_SCROLL_KEY
  );
}, [src]);

  /* =============================
     RENDER: ARTICLE VIEW
  ============================= */
  if (src) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <button
          onClick={() => {
  router.push(
    `/tesla/news?page=${page}`,
    {
      scroll: false,
    }
  );
}}
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

            {article.image && (
  <img
    src={article.image}
    alt={article.title}
    className="w-full max-h-[420px] object-cover rounded-lg mb-6"
  />
)}

            <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

            <div className="text-sm text-gray-500 mb-6">
              {article.source} • {new Date(article.publishedAt).toLocaleString()}
            </div>

            <div className="bg-white border-l-4 border-red-500 p-4 mb-6 text-black">
              <strong>Summary:</strong>
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
         onClick={() => {
  sessionStorage.setItem(
    NEWS_SCROLL_KEY,
    String(window.scrollY)
  );

  router.push(
    `/tesla/news?page=${page}&src=${encodeURIComponent(
      item.url
    )}&image=${encodeURIComponent(
      item.image || ""
    )}`,
    {
      scroll: false,
    }
  );
}}
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

{hasMore && news.length > 0 && (
  <div className="flex justify-center mt-8">
    <button
      onClick={loadMoreNews}
      disabled={loadingMore}
      className="px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      {loadingMore
        ? "Loading older news..."
        : "Load More News"}
    </button>
  </div>
)}

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