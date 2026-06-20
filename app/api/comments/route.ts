import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

/* =============================
   FIREBASE ADMIN INIT
============================= */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_ADMIN_KEY!)
    ),
  });
}

const db = admin.firestore();

/* =============================
   GET COMMENTS
============================= */
export async function GET(req: NextRequest) {
  const articleId = req.nextUrl.searchParams.get("articleId");

  if (!articleId) {
    return NextResponse.json([]);
  }

  try {
    const snapshot = await db
      .collection("comments")
      .where("articleId", "==", articleId)
      .get();

    const comments = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        articleId: data.articleId,
        author: data.author,
        content: data.content,
        createdAt: data.createdAt?.toDate().toISOString(),
      };
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Fetch comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

/* =============================
   POST COMMENT
============================= */
export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { articleId, name, text } = body;

    if (!articleId || !text) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const docRef = await db.collection("comments").add({
      articleId,
      name: name || "Anonymous",
      text,
      createdAt: admin.firestore.Timestamp.now(),
    });

    return NextResponse.json(
      {
        id: docRef.id,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Post comment error:", error);
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 }
    );
  }
}
