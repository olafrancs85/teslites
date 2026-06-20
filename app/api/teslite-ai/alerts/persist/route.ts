import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { headline, percentMove, confidence } = body;

    if (!headline || !percentMove) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const alertsRef = collection(db, "teslaAlerts");

    // Deduplicate by headline
    const q = query(alertsRef, where("headline", "==", headline));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return NextResponse.json({ status: "duplicate" });
    }

    await addDoc(alertsRef, {
      headline,
      percentMove,
      confidence: confidence ?? "High",
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ status: "persisted" });
  } catch (error) {
    console.error("Alert persistence failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
