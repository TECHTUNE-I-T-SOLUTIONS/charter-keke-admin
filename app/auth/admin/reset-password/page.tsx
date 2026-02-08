"use client"

import type React from "react"
import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Eye, EyeOff, Lock, ArrowRight, Loader2, Shield, AlertCircle, CheckCircle2 } from "lucide-react"
import { Particles } from "@/components/particles"

function AdminResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false)
        setIsValidating(false)
        return
      }

      try {
        const response = await fetch(`/api/auth/admin/validate-reset-token?token=${token}`)
        const data = await response.json()

        if (response.ok && data.valid) {
          setIsValidToken(true)
        } else {
          setIsValidToken(false)
          toast.error("Invalid or Expired Link", {
            description: "This password reset link is no longer valid. Please request a new one.",
          })
        }
      } catch (error) {
        setIsValidToken(false)
        toast.error("Validation Failed", {
          description: "Could not validate the reset link. Please try again.",
        })
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      toast.success("Password Reset Successfully!", {
        description: "Your password has been updated. You can now login.",
      })
      setSubmitted(true)

      setTimeout(() => {
        router.push("/auth/admin/login")
      }, 2000)
    } catch (error) {
      toast.error("Reset Failed", {
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
      })
      setIsSubmitting(false)
    }
  }

  if (isValidating) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
        <Particles />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="z-10"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </motion.div>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
        <Particles />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md z-10"
        >
          <Card className="bg-card/80 backdrop-blur-xl border-primary/20 shadow-2xl">
            <CardContent className="pt-12 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto bg-gradient-to-br from-red-500 to-red-600 rounded-full p-3 w-fit"
              >
                <AlertCircle className="w-6 h-6 text-white" />
              </motion.div>

              <div>
                <h2 className="text-2xl font-serif font-bold">Invalid Link</h2>
                <p className="text-muted-foreground mt-2">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
              </div>

              <Button asChild className="w-full h-11">
                <Link href="/auth/admin/forgot-password">Request New Link</Link>
              </Button>

              <div className="text-center text-sm">
                <Link href="/auth/admin/login" className="text-primary hover:underline font-medium">
                  Back to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
        <Particles />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md z-10"
        >
          <Card className="bg-card/80 backdrop-blur-xl border-primary/20 shadow-2xl">
            <CardContent className="pt-12 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3 w-fit"
              >
                <CheckCircle2 className="w-6 h-6 text-white" />
              </motion.div>

              <div>
                <h2 className="text-2xl font-serif font-bold">Password Reset Complete</h2>
                <p className="text-muted-foreground mt-2">
                  Your password has been successfully updated. Redirecting to login...
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <Particles />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="bg-card/80 backdrop-blur-xl border-primary/20 shadow-2xl">
          <CardHeader className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-full p-3"
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>

            <div>
              <CardTitle className="text-2xl font-serif">Set New Password</CardTitle>
              <CardDescription>Create a strong password for your admin account</CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-background/50 h-11 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-background/50 h-11 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Security note */}
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  🔒 <strong>Security:</strong> Use a strong, unique password. Avoid common words or patterns.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="text-center text-sm">
                <Link href="/auth/admin/login" className="text-primary hover:underline font-medium">
                  Back to Login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <Particles />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please wait...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <AdminResetPasswordContent />
    </Suspense>
  )
}
