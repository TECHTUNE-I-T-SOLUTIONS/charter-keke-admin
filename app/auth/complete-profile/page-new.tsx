"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import CompleteProfileContent from "./complete-profile-content"

function CompleteProfileWrapper() {
  const searchParams = useSearchParams()
  const userRole = searchParams.get("role") || "user"

  return <CompleteProfileContent userRole={userRole} />
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CompleteProfileWrapper />
    </Suspense>
  )
}
