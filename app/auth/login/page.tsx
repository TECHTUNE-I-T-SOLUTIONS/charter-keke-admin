"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Eye, EyeOff, Mail, Phone, Lock, ArrowRight, Loader2 } from "lucide-react"
import { Particles } from "@/components/particles"

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email")
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!emailOrPhone || !password) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSubmitting(true)

    const result = await login(emailOrPhone, password)

    if (result.success) {
      toast.success("Welcome back!", {
        description: "Redirecting to your dashboard...",
      })

      // Get user from localStorage to determine redirect
      const storedUser = localStorage.getItem("easely_user")
      if (storedUser) {
        const user = JSON.parse(storedUser)
        setTimeout(() => {
          switch (user.role) {
            case "admin":
              router.push("/admin/dashboard")
              break
            case "driver":
              router.push("/driver/dashboard")
              break
            default:
              router.push("/user/dashboard")
          }
        }, 1000)
      }
    } else {
      toast.error("Login Failed", {
        description: result.error,
      })
      setIsSubmitting(false)
    }
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
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto"
            >
              <Link href="/">
                <Image
                  src="/images/easely-06.png"
                  alt="EASELY"
                  width={80}
                  height={80}
                  className="mx-auto drop-shadow-lg hover:scale-105 transition-transform"
                />
              </Link>
            </motion.div>
            <CardTitle className="text-2xl font-serif text-foreground">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to continue your journey with EASELY
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as "email" | "phone")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                <TabsTrigger
                  value="email"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger
                  value="phone"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Phone
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4">
                <TabsContent value="email" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={emailOrPhone}
                        onChange={(e) => setEmailOrPhone(e.target.value)}
                        className="pl-10 bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="phone" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+234 808 319 1228"
                        value={emailOrPhone}
                        onChange={(e) => setEmailOrPhone(e.target.value)}
                        className="pl-10 bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                </TabsContent>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-background/50 border-primary/20 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Link href="/auth/forgot-password" className="text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity group"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            </Tabs>

            <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-primary/10">
              <p className="text-xs text-muted-foreground text-center mb-2">Demo Accounts (password: demo123)</p>
              <div className="text-xs text-center space-y-1">
                <p>
                  <span className="text-primary">User:</span> user@easely.com
                </p>
                <p>
                  <span className="text-primary">Driver:</span> driver@easely.com
                </p>
                <p>
                  <span className="text-primary">Admin:</span> admin@easely.com
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
