"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Mail, Phone, ArrowLeft, Loader2, Shield, CheckCircle2, MessageSquareText, ShieldCheck } from "lucide-react"
import { Particles } from "@/components/particles"
import { AuthDownloadCard } from "@/components/auth-download-card"

type Method = "email" | "sms"

export default function AdminForgotPasswordPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [method, setMethod] = useState<Method>("email")
  const [otp, setOtp] = useState("")
  const [stage, setStage] = useState<"request" | "verify" | "done">("request")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!identifier) {
      toast.error("Please enter your email address or phone number")
      return
    }

    setIsSubmitting(true)
    try {
      const isEmail = identifier.includes("@")

      if (method === "email") {
        const response = await fetch("/api/auth/admin/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isEmail ? { email: identifier } : { phone_number: identifier }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Failed to send reset link")
        }

        toast.success("Reset link sent", {
          description: "If an admin account exists, a password reset email has been sent.",
        })
        setStage("done")
        return
      }

      const response = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEmail ? { email: identifier, type: "forgot_password" } : { phone_number: identifier, type: "forgot_password" }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP")
      }

      toast.success("OTP sent", {
        description: "Enter the verification code from your SMS to continue.",
      })
      setStage("verify")
    } catch (error) {
      toast.error("Request failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp) {
      toast.error("Enter the verification code")
      return
    }

    setIsSubmitting(true)
    try {
      const isEmail = identifier.includes("@")
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEmail
            ? { code: otp, email: identifier, type: "forgot_password" }
            : { code: otp, phone_number: identifier, type: "forgot_password" }
        ),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Invalid OTP")
      }

      toast.success("OTP verified", { description: "You can now reset the admin password." })
      router.push(`/auth/admin/reset-password?${isEmail ? "email" : "phone_number"}=${encodeURIComponent(identifier)}&method=sms`)
    } catch (error) {
      toast.error("Verification failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <Particles />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg z-10"
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
              <CardTitle className="text-2xl font-serif">Reset Admin Password</CardTitle>
              <CardDescription>Send a reset link by email or verify an SMS OTP first</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {stage === "request" && (
              <form onSubmit={handleRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email or phone number
                  </Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="admin@example.com or +234..."
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-background/50 h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Recovery method</Label>
                  <select
                    id="method"
                    value={method}
                    onChange={(event) => setMethod(event.target.value as Method)}
                    aria-label="Recovery method"
                    title="Recovery method"
                    className="h-11 w-full rounded-md border border-input bg-background/50 px-3 text-sm"
                  >
                    <option value="email">Send recovery link to email</option>
                    <option value="sms">Send SMS OTP</option>
                  </select>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    ℹ️ Email recovery sends a reset link. SMS recovery sends an OTP you verify before setting a new password.
                  </p>
                </div>

                <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {isSubmitting ? "Sending..." : method === "email" ? "Send Reset Link" : "Send SMS OTP"}
                </Button>
              </form>
            )}

            {stage === "verify" && (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4" />
                    Verification code
                  </Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-background/50 h-11"
                    placeholder="Enter the 6-digit OTP"
                    inputMode="numeric"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setStage("request")} disabled={isSubmitting}>
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 h-11" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {isSubmitting ? "Verifying..." : "Verify OTP"}
                  </Button>
                </div>
              </form>
            )}

            {stage === "done" && (
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    If the admin account exists, a recovery email has been sent.
                  </p>
                </div>

                <Button asChild className="w-full h-11">
                  <Link href="/auth/admin/login">Back to Login</Link>
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t pt-4 pb-4 px-6">
            <div className="text-center text-sm mb-2">
              <Link href="/auth/admin/login" className="text-primary hover:underline font-medium flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      <div className="fixed bottom-4 right-4 z-10 hidden lg:block w-full max-w-sm">
        <AuthDownloadCard
          title="Install the app"
          description="Keep admin alerts, ride activity, and messaging handy on your phone as well."
        />
      </div>
    </div>
  )
}
