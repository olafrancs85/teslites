import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const { headline, percentMove, confidence } = await req.json();

    if (!headline || !percentMove || !confidence) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const alertsRef = collection(db, "teslaAlerts");

    await addDoc(alertsRef, {
      headline,
      percentMove,
      confidence,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving alert:", error);
    return NextResponse.json({ error: "Failed to save alert" }, { status: 500 });
  }
}
