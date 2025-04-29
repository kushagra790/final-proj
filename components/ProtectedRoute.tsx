"use client"

import type React from "react"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const { data: session, status } = useSession()
  const loading = status === "loading"

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login")
    }
  }, [session, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute

