import { NextResponse } from "next/server";

/*
  Simple in-memory Tesla news store.
  This can later be replaced with Firestore.
*/

type TeslaNews = {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  originalUrl: string;
  summary: string;
  rewritten: string;
};

const store = new Map<string, TeslaNews>();

export async function POST(req: Request) {
  const body = await req.json();

  const id = crypto.randomUUID();

  const record: TeslaNews = {
    id,
    title: body.title,
    source: body.source,
    publishedAt: body.publishedAt,
    originalUrl: body.originalUrl,
    summary: body.summary,
    rewritten: body.rewritten,
  };

  store.set(id, record);

  return NextResponse.json({ id });
}

export async function GET() {
  return NextResponse.json({
    count: store.size,
    news: Array.from(store.values()),
  });
}

export { store };
