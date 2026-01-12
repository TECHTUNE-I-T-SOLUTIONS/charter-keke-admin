"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import CompleteProfileContent from "./complete-profile-content"

function CompleteProfileWrapper() {
  const searchParams = useSearchParams()
  const userRole = searchParams.get("role") || "user"

  return <CompleteProfileContent userRole={userRole} />
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <CompleteProfileWrapper />
    </Suspense>
  )
}
