"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  Lock,
  User,
  Gift,
  ArrowRight,
  Loader2,
  Car,
  GraduationCap,
  ArrowLeft,
} from "lucide-react"
import { Particles } from "@/components/particles"

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: (searchParams.get("type") === "driver" ? "driver" : "user") as UserRole,
    referralCode: searchParams.get("ref") || "",
    // Driver specific fields
    vehicleMake: "",
    vehicleModel: "",
    vehiclePlate: "",
    licenseNumber: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRoleSelect = (role: UserRole) => {
    setFormData((prev) => ({ ...prev, role }))
    setStep(2)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
      toast.error("Please fill in all required fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setIsSubmitting(true)

    const result = await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: formData.role,
      referralCode: formData.referralCode || undefined,
    })

    if (result.success) {
      toast.success("Account Created!", {
        description: formData.referralCode
          ? "You'll get 5% off your first booking with your referral!"
          : "Welcome to EASELY. Redirecting...",
      })

      setTimeout(() => {
        switch (formData.role) {
          case "driver":
            router.push("/driver/dashboard")
            break
          default:
            router.push("/user/dashboard")
        }
      }, 1500)
    } else {
      toast.error("Registration Failed", {
        description: result.error,
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 py-8 overflow-hidden">
      <Particles />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg z-10"
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
            <CardTitle className="text-2xl font-serif text-foreground">
              {step === 1 ? "Join EASELY" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {step === 1
                ? "How would you like to use EASELY?"
                : formData.role === "driver"
                  ? "Register as a driver for UNILORIN students"
                  : "Register as a UNILORIN student"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {step === 1 ? (
                // Step 1: Role Selection
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRoleSelect("user")}
                      className="flex items-center gap-4 p-6 rounded-xl border-2 border-muted bg-background/50 hover:border-primary hover:bg-primary/10 transition-all text-left"
                    >
                      <div className="p-4 rounded-xl bg-primary/10">
                        <GraduationCap className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground">I'm a Student</h3>
                        <p className="text-sm text-muted-foreground">Book rides between campus and town</p>
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRoleSelect("driver")}
                      className="flex items-center gap-4 p-6 rounded-xl border-2 border-muted bg-background/50 hover:border-secondary hover:bg-secondary/10 transition-all text-left"
                    >
                      <div className="p-4 rounded-xl bg-secondary/10">
                        <Car className="h-8 w-8 text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground">I'm a Driver</h3>
                        <p className="text-sm text-muted-foreground">Earn by driving UNILORIN students</p>
                      </div>
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                // Step 2: Registration Form
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {/* Back Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-foreground">
                        First Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={(e) => handleChange("firstName", e.target.value)}
                          className="pl-10 bg-background/50 border-primary/20 focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-foreground">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Contact Fields */}
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
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="pl-10 bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

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
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className="pl-10 bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-foreground">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        className="pl-10 bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Referral Code */}
                  <div className="space-y-2">
                    <Label htmlFor="referralCode" className="text-foreground flex items-center gap-2">
                      <Gift className="h-4 w-4 text-primary" />
                      Referral Code (Optional)
                    </Label>
                    <Input
                      id="referralCode"
                      placeholder="Enter referral code for 5% off"
                      value={formData.referralCode}
                      onChange={(e) => handleChange("referralCode", e.target.value.toUpperCase())}
                      className="bg-background/50 border-primary/20 focus:border-primary uppercase"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity group"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create {formData.role === "driver" ? "Driver" : "Student"} Account
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By signing up, you agree to our{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Use
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
