// lib/rewards.ts
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function addPointsToUser(userId: string, points: number) {
  if (!userId || !points) return;
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      // create minimal user doc if missing
      await setDoc(userRef, { points: points, updatedAt: serverTimestamp() }, { merge: true });
      return;
    }
    const data = snap.data();
    const current = (data?.points as number) || 0;
    await updateDoc(userRef, { points: current + points, updatedAt: serverTimestamp() });
  } catch (err) {
    console.error("Failed to add points:", err);
  }
}
