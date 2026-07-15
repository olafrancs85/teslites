import { NextResponse } from "next/server";
import { JSDOM } from "jsdom"; // Make sure jsdom + @types/jsdom installed

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const src = searchParams.get("url");

    if (!src) {
      return NextResponse.json({ error: "Missing 'src' query parameter" }, { status: 400 });
    }

    const res = await fetch(src);
    if (!res.ok) throw new Error(`Failed to fetch article: ${res.status}`);

    const htmlText = await res.text();

    const dom = new JSDOM(htmlText);
    const document = dom.window.document;

    // Remove scripts, iframes, etc.
    const unwantedTags = ["script", "iframe", "noscript", "style"];
    unwantedTags.forEach(tag => {
      document.querySelectorAll(tag).forEach((el: Element) => el.remove());
    });

    // Remove inline event handlers
    document.querySelectorAll("*").forEach((el: Element) => {
      Array.from(el.attributes).forEach((attr: Attr) => {
        if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
      });
    });

    const articleEl = document.querySelector("article") || document.body;
    const contentHTML = articleEl.innerHTML;

    return NextResponse.json({ html: contentHTML });
  } catch (err) {
    console.error("Rewrite API error:", err);
    return NextResponse.json({ error: "Failed to rewrite article" }, { status: 500 });
  }
}
