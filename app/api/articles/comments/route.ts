import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import admin from "firebase-admin";

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = getFirestore();

/* -----------------------------
   GET /api/articles/comments?url=<articleUrl>
   Fetch comments for a specific article
----------------------------- */
export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "Missing article URL" }, { status: 400 });
    }

    const commentsSnapshot = await db
      .collection("articleComments")
      .where("articleUrl", "==", url)
      .orderBy("createdAt", "asc")
      .get();

    const comments = commentsSnapshot.docs.map((doc) => doc.data());

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("GET comments error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

/* -----------------------------
   POST /api/articles/comments
   Add a new comment
   Body: { articleUrl, articleTitle, content }
----------------------------- */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { articleUrl, articleTitle, content } = body;

    if (!articleUrl || !content) {
      return NextResponse.json(
        { error: "Missing articleUrl or content" },
        { status: 400 }
      );
    }

    // For now, we'll simulate authentication with a dummy user
    // Replace this with your Firebase Auth session verification
    const user = {
      uid: "demoUserId",
      name: "Demo User",
      photoUrl: null,
    };

    const newComment = {
      articleUrl,
      articleTitle: articleTitle || "",
      userId: user.uid,
      userName: user.name,
      userPhoto: user.photoUrl,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection("articleComments").add(newComment);

    return NextResponse.json({ id: docRef.id, ...newComment });
  } catch (error) {
    console.error("POST comment error:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
