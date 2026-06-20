import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"
import { User } from "firebase/auth"

export async function ensureUserProfile(user: User) {
  const docRef = doc(db, "users", user.uid)
  const snap = await getDoc(docRef)

  if (!snap.exists()) {
    await setDoc(docRef, {
      uid: user.uid,
      displayName: user.displayName || "New User",
      photoURL: user.photoURL || "/default-avatar.png",
      bio: "",
      location: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}
