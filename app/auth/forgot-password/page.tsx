"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Mail, ArrowLeft, Loader2, KeyRound, CheckCircle2 } from "lucide-react"
import { Particles } from "@/components/particles"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process request")
      }

      toast.success("Check Your Email", {
        description: "If an account exists with this email, you'll receive password reset instructions.",
      })
      setSubmitted(true)
    } catch (error) {
      toast.error("Request Failed", {
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
      })
      setIsSubmitting(false)
    }
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
                <h2 className="text-2xl font-serif font-bold">Email Sent</h2>
                <p className="text-muted-foreground mt-2">
                  If an account exists with this email address, you'll receive password reset instructions shortly.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ℹ️ <strong>Check your inbox and spam folder</strong> for the reset link. The link expires in 1 hour.
                </p>
              </div>

              <Button asChild className="w-full h-11">
                <Link href="/auth/login">Back to Login</Link>
              </Button>
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
              <KeyRound className="w-6 h-6 text-white" />
            </motion.div>

            <div>
              <CardTitle className="text-2xl font-serif">Reset Your Password</CardTitle>
              <CardDescription>Enter your email to receive reset instructions</CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-background/50 h-11"
                  required
                />
              </div>

              {/* Info */}
              <div className="p-3 mb-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  ℹ️ We'll send a secure reset link to your email address. The link will be valid for 1 hour.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="text-center text-sm mb-2">
                <Link href="/auth/login" className="text-primary hover:underline font-medium flex items-center justify-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
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
