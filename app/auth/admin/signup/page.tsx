"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Loader2, Shield, AlertCircle, CheckCircle2 } from "lucide-react"
import { Particles } from "@/components/particles"

export default function AdminSignupPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // User fields
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dob: "",
    gender: "",
    emergencyContact: "",
    emergencyPhone: "",
    // Admin fields
    adminLevel: "support",
    department: "general",
    reason: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Personal info validation
        if (!formData.firstName.trim()) {
          toast.error("First name is required")
          return false
        }
        if (!formData.lastName.trim()) {
          toast.error("Last name is required")
          return false
        }
        if (!formData.email.includes("@")) {
          toast.error("Valid email is required")
          return false
        }
        if (!formData.phone.trim()) {
          toast.error("Phone number is required")
          return false
        }
        return true

      case 2:
        // Password validation
        if (!formData.password) {
          toast.error("Password is required")
          return false
        }
        if (formData.password.length < 8) {
          toast.error("Password must be at least 8 characters long")
          return false
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match")
          return false
        }
        return true

      case 3:
        // Additional info validation
        if (!formData.dob) {
          toast.error("Date of birth is required")
          return false
        }
        if (!formData.gender) {
          toast.error("Gender is required")
          return false
        }
        return true

      case 4:
        // Emergency contact validation
        if (!formData.emergencyContact.trim()) {
          toast.error("Emergency contact name is required")
          return false
        }
        if (!formData.emergencyPhone.trim()) {
          toast.error("Emergency contact phone is required")
          return false
        }
        return true

      case 5:
        // Admin level and reason validation
        if (!formData.adminLevel) {
          toast.error("Admin level is required")
          return false
        }
        if (!formData.department) {
          toast.error("Department is required")
          return false
        }
        if (!formData.reason.trim()) {
          toast.error("Please provide reason for admin access")
          return false
        }
        if (formData.reason.trim().length < 20) {
          toast.error("Please provide a detailed reason (at least 20 characters)")
          return false
        }
        return true

      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep(5)) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/admin/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          dob: formData.dob,
          gender: formData.gender,
          emergencyContact: formData.emergencyContact,
          emergencyPhone: formData.emergencyPhone,
          adminLevel: formData.adminLevel,
          department: formData.department,
          reason: formData.reason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request")
      }

      toast.success("Request Submitted Successfully!", {
        description: "Your admin access request has been submitted and pending approval by the super admin.",
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
            <CardContent className="pt-8 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3 w-fit"
              >
                <CheckCircle2 className="w-6 h-6 text-white" />
              </motion.div>

              <div>
                <h2 className="text-2xl font-serif font-bold">Request Submitted</h2>
                <p className="text-muted-foreground mt-2">
                  Your admin access request has been submitted for review by the super administrator.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ℹ️ <strong>What's next?</strong> Your admin request has been submitted for review. You'll be notified once a super administrator approves your access.
                </p>
              </div>

              <Button asChild className="w-full h-11">
                <Link href="/auth/admin/login">Back to Admin Login</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Step indicators
  const steps = [
    { number: 1, title: "Personal Info" },
    { number: 2, title: "Password" },
    { number: 3, title: "Additional Info" },
    { number: 4, title: "Emergency Contact" },
    { number: 5, title: "Admin Details" },
  ]

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <Particles />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl z-10"
      >
        <Card className="bg-card/80 backdrop-blur-xl border-primary/20 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          <CardHeader className="text-center space-y-3 flex-shrink-0">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-full p-3"
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>

            <div>
              <CardTitle className="text-2xl font-serif">Request Admin Access</CardTitle>
              <CardDescription>Step {currentStep} of 5: {steps[currentStep - 1].title}</CardDescription>
            </div>

            {/* Step Indicators */}
            <div className="flex gap-2 mt-4 px-4">
              {steps.map((step) => (
                <motion.div
                  key={step.number}
                  className={`flex-1 h-2 rounded-full ${
                    currentStep >= step.number
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </CardHeader>

          <form 
            onSubmit={(e) => {
              if (currentStep === 5) {
                handleSubmit(e)
              } else {
                e.preventDefault()
                nextStep()
              }
            }}
            className="flex flex-col flex-1 min-h-0"
          >
            <CardContent className="space-y-4 overflow-y-auto flex-1 py-6">
              {/* STEP 1: Personal Information */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        className="bg-background/50 h-10"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        className="bg-background/50 h-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="bg-background/50 h-10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+234..."
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="bg-background/50 h-10"
                      required
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Password */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password *
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        value={formData.password}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        className="bg-background/50 h-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        className="bg-background/50 h-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        disabled={isSubmitting}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      💡 Use a strong password with at least 8 characters including uppercase, lowercase, numbers, and symbols.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Additional Information */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      name="dob"
                      type="date"
                      value={formData.dob}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="bg-background/50 h-10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <select
                      id="gender"
                      name="gender"
                      title="Select your gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-foreground text-sm"
                      required
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Emergency Contact */}
              {currentStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                    <Input
                      id="emergencyContact"
                      name="emergencyContact"
                      placeholder="Full name of emergency contact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="bg-background/50 h-10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Emergency Contact Phone *
                    </Label>
                    <Input
                      id="emergencyPhone"
                      name="emergencyPhone"
                      placeholder="+234..."
                      value={formData.emergencyPhone}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="bg-background/50 h-10"
                      required
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      📋 This information will be used to contact someone in case of emergencies.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: Admin Details */}
              {currentStep === 5 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="adminLevel">Requested Admin Level *</Label>
                    <select
                      id="adminLevel"
                      name="adminLevel"
                      title="Select your requested admin level"
                      value={formData.adminLevel}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-foreground text-sm"
                      required
                    >
                      <option value="support">Support (Customer Service)</option>
                      <option value="ops">Operations (Ride Management)</option>
                      <option value="finance">Finance (Payments & Settlements)</option>
                      <option value="super">Super Admin (System Access)</option>
                    </select>
                    <p className="text-xs text-muted-foreground">Select the admin level appropriate for your role</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <select
                      id="department"
                      name="department"
                      title="Select your department"
                      value={formData.department}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-foreground text-sm"
                      required
                    >
                      <option value="general">General</option>
                      <option value="support">Customer Support</option>
                      <option value="billing">Billing</option>
                      <option value="operations">Operations</option>
                      <option value="rider_management">Rider Management</option>
                      <option value="trust_safety">Trust and Safety</option>
                      <option value="technical">Technical Support</option>
                      <option value="engineering">Engineering</option>
                      <option value="product">Product and Systems</option>
                      <option value="finance">Finance</option>
                    </select>
                    <p className="text-xs text-muted-foreground">Departments drive CRM routing and queue access.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Why do you need admin access? *</Label>
                    <Textarea
                      id="reason"
                      name="reason"
                      placeholder="Please explain your reason for requesting admin access (minimum 20 characters)..."
                      value={formData.reason}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="bg-background/50 min-h-28 resize-none"
                      required
                    />
                    <p className="text-xs text-muted-foreground">{formData.reason.length} characters</p>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Note:</strong> Admin access is restricted and requires approval from the super administrator. Your request will be reviewed within 24-48 hours.
                      </span>
                    </p>
                  </div>
                </motion.div>
              )}
            </CardContent>

            <CardFooter className="flex gap-2 flex-shrink-0 border-t pt-4 pb-4 px-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || isSubmitting}
                className="flex-1 h-10"
              >
                Previous
              </Button>

              <Button
                type="submit"
                className="flex-1 h-10"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {currentStep === 5 ? "Submitting..." : "Loading..."}
                  </>
                ) : currentStep === 5 ? (
                  <>
                    Submit
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>

            <div className="px-6 pb-3 text-center text-xs text-muted-foreground border-t">
              Already have admin access?{" "}
              <Link href="/auth/admin/login" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
