"use client"
import { useEffect } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { ensureUserProfile } from "@/lib/createUserProfile"

export function AuthWatcher() {
  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await ensureUserProfile(user)
      }
    })
    return () => unsubscribe()
  }, [])

  return null
}
