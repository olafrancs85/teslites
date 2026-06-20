"use client"
import { ReactNode } from "react"
import { AuthWatcher } from "./AuthWatcher"
export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthWatcher />
      {children}
    </>
  )
}
