"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { AuthDownloadCard } from "@/components/auth-download-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Shield } from "lucide-react"
import { Particles } from "@/components/particles"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Login Failed", {
          description: result.error || "Invalid admin credentials",
        })
        setIsSubmitting(false)
      } else if (result?.ok) {
        toast.success("Welcome back, Admin!", {
          description: "Redirecting to admin dashboard...",
        })

        // Get session to verify admin role
        const session = await fetch("/api/auth/session").then((r) => r.json())
        const userRole = session?.user?.role

        // Check if user is admin
        if (userRole === "admin" || userRole === "super_admin") {
          setTimeout(() => {
            router.push("/admin/dashboard")
          }, 1000)
        } else {
          toast.error("Access Denied", {
            description: "You don't have admin privileges",
          })
          setIsSubmitting(false)
        }
      }
    } catch (error) {
      toast.error("Login Failed", {
        description: "An error occurred. Please try again.",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#052659]/10 via-white to-[#4353a4]/10 px-4 py-8 md:py-12">
      <Particles />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-card/85 border-primary/20 shadow-2xl backdrop-blur-xl">
            <CardHeader className="space-y-4 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto rounded-full bg-gradient-to-br from-primary to-primary/60 p-3"
              >
                <Shield className="h-6 w-6 text-white" />
              </motion.div>

              <div>
                <CardTitle className="text-2xl font-serif">Admin Portal</CardTitle>
                <CardDescription>Secure access for administrators</CardDescription>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@charterkeke.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="h-11 bg-background/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <Link href="/auth/admin/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="h-11 bg-background/50 pr-10"
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

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>Security:</strong> Never share your admin credentials. Keep your password secure.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login to Admin
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="mb-2 text-center text-sm text-muted-foreground">
                  New admin account?{" "}
                  <Link href="/auth/admin/signup" className="font-medium text-primary hover:underline">
                    Request Access
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Charter Keke Admin Panel</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:pt-10"
        >
          <AuthDownloadCard
            title="Need the mobile app?"
            description="Download the app to keep using the same account on mobile while staying signed in on the web."
          />
        </motion.div>
      </div>
    </main>
  )
}
