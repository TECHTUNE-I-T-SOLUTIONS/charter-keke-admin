"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  ArrowLeft,
  GraduationCap,
  Upload,
  Calendar,
  Check,
  AlertCircle,
  Building2,
  CheckCircle2,
  FileText,
} from "lucide-react"
import { Particles } from "@/components/particles"
import { AnimatedStepIndicator } from "@/components/animated-step-indicator"
import { fetchBanksFromPaystack, verifyBankAccount, type Bank } from "@/lib/paystack"

type UserRole = "user" | "driver" | "admin"

// Driver has 6 steps, Rider has 4 steps
const DRIVER_STEPS = [
  { label: "Role", description: "Select type" },
  { label: "Basic Info", description: "Personal" },
  { label: "Bank Verify", description: "Account" },
  { label: "Vehicle", description: "Details" },
  { label: "Documents", description: "Upload" },
  { label: "Security", description: "Password" },
]

const RIDER_STEPS = [
  { label: "Role", description: "Select type" },
  { label: "Basic Info", description: "Personal" },
  { label: "Emergency", description: "Contact" },
  { label: "Security", description: "Password" },
]

const SIGNUP_STEPS = {
  ROLE_SELECTION: 0,
  BASIC_INFO: 1,
  BANK_VERIFICATION: 2,
  VEHICLE_INFO: 3,
  DOCUMENTS: 4,
  EMERGENCY_CONTACT: 2,
  SECURITY: 5,
}

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(SIGNUP_STEPS.ROLE_SELECTION)
  const [role, setRole] = useState<UserRole | null>(
    (searchParams.get("type") === "driver" ? "driver" : null) as UserRole | null
  )

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    password: "",
    confirmPassword: "",
    profilePicture: null as File | null,
    profilePictureUrl: "",
    // Driver specific
    vehicleType: "keke",
    plateNumber: "",
    unionName: "",
    operatingZones: [] as string[],
    bankName: "",
    bankCode: "",
    bankAccountNumber: "",
    verifiedAccountName: "",
    emergencyContact: "",
    vehiclePictureUrl: "",
    licensePictureUrl: "",
    vehiclePicture: null as File | null,
    licensePicture: null as File | null,
    // Rider specific
    emergencyContactName: "",
    emergencyContactPhone: "",
    // Other
    referralCode: searchParams.get("ref") || "",
  })

  const [banks, setBanks] = useState<Bank[]>([])
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [verifyingAccount, setVerifyingAccount] = useState(false)
  const [accountVerified, setAccountVerified] = useState(false)
  const [previewImages, setPreviewImages] = useState<{ [key: string]: string }>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole)
    setCurrentStep(SIGNUP_STEPS.BASIC_INFO)
  }

  // Get step configuration based on role
  const getStepConfig = () => (role === "driver" ? DRIVER_STEPS : RIDER_STEPS)

  // Get display step (adjusted for rider flow)
  const getDisplayStep = () => {
    if (role === "driver") return currentStep
    // For riders: step 2 maps to step 2 (emergency contact), step 5 maps to step 3 (security)
    if (currentStep === SIGNUP_STEPS.EMERGENCY_CONTACT) return 2
    if (currentStep === SIGNUP_STEPS.SECURITY) return 3
    return currentStep
  }

  // Load banks when needed
  useEffect(() => {
    if (role === "driver" && currentStep === SIGNUP_STEPS.BANK_VERIFICATION && banks.length === 0) {
      loadBanks()
    }
  }, [role, currentStep])

  const loadBanks = async () => {
    setLoadingBanks(true)
    try {
      const banksList = await fetchBanksFromPaystack()
      setBanks(banksList)
    } catch (error) {
      toast.error("Failed to load banks. Please try again.")
    } finally {
      setLoadingBanks(false)
    }
  }

  const handleVerifyBankAccount = async () => {
    if (!formData.bankAccountNumber) {
      toast.error("Please enter an account number")
      return
    }

    if (!formData.bankCode) {
      toast.error("Please select a bank")
      return
    }

    // Validate account number format
    if (!/^\d{10}$/.test(formData.bankAccountNumber)) {
      toast.error("Account number must be exactly 10 digits")
      return
    }

    setVerifyingAccount(true)
    try {
      const response = await verifyBankAccount(formData.bankAccountNumber, formData.bankCode)
      if (response.status === true) {
        setFormData((prev) => ({
          ...prev,
          verifiedAccountName: response.data?.account_name || "",
          bankName: banks.find((b) => b.code === formData.bankCode)?.name || "",
        }))
        setAccountVerified(true)
        toast.success("Account verified successfully!")
      } else {
        const errorMsg = response.error || response.message || "Account verification failed"
        console.error("Verification error:", errorMsg, response)
        
        // Check if it's a rate limit error
        if (errorMsg.includes("daily limit") || errorMsg.includes("Test mode")) {
          toast.error(errorMsg + ". If you're sure about your account details, you can proceed to the next step.", {
            duration: 6000,
          })
        } else {
          toast.error(errorMsg)
        }
        setAccountVerified(false)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to verify account"
      console.error("Bank verification error:", error)
      toast.error(errorMsg)
      setAccountVerified(false)
    } finally {
      setVerifyingAccount(false)
    }
  }

  const handleProceedWithoutVerification = () => {
    // Set bankName from the selected bank even without verification
    const selectedBank = banks.find((b) => b.code === formData.bankCode)
    setFormData((prev) => ({
      ...prev,
      bankName: selectedBank?.name || "",
    }))
    setAccountVerified(true)
    toast.success("Proceeding with manual verification. Please ensure your details are correct.")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: file,
      }))

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImages((prev) => ({
          ...prev,
          [fieldName]: reader.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateStep = (step: number) => {
    const errors: string[] = []

    if (step === SIGNUP_STEPS.BASIC_INFO) {
      if (!formData.firstName.trim()) errors.push("First name is required")
      if (!formData.lastName.trim()) errors.push("Last name is required")
      if (!formData.email.trim()) errors.push("Email is required")
      if (!formData.email.includes("@")) errors.push("Valid email is required")
      if (!formData.phone.trim()) errors.push("Phone number is required")
      if (!formData.dob) errors.push("Date of birth is required")
      if (!formData.gender) errors.push("Gender is required")
    }

    if (step === SIGNUP_STEPS.BANK_VERIFICATION && role === "driver") {
      if (!accountVerified) errors.push("Bank account must be verified")
      if (!formData.bankAccountNumber) errors.push("Bank account number is required")
    }

    if (step === SIGNUP_STEPS.VEHICLE_INFO && role === "driver") {
      if (!formData.vehicleType) errors.push("Vehicle type is required")
      if (!formData.plateNumber.trim()) errors.push("Plate number is required")
      if (!formData.unionName.trim()) errors.push("Union name is required")
      if (!previewImages.vehiclePicture) errors.push("Vehicle picture is required")
    }

    if (step === SIGNUP_STEPS.DOCUMENTS && role === "driver") {
      if (!formData.emergencyContact.trim()) errors.push("Emergency contact is required")
      if (!previewImages.licensePicture) errors.push("License picture is required")
      if (!formData.operatingZones.length) errors.push("At least one operating zone is required")
    }

    if (step === SIGNUP_STEPS.EMERGENCY_CONTACT && role === "user") {
      if (!formData.emergencyContactName.trim()) errors.push("Emergency contact name is required")
      if (!formData.emergencyContactPhone.trim()) errors.push("Emergency contact phone is required")
    }

    if (step === SIGNUP_STEPS.SECURITY) {
      if (!formData.password) errors.push("Password is required")
      if (formData.password.length < 8) errors.push("Password must be at least 8 characters")
      if (formData.password !== formData.confirmPassword) errors.push("Passwords do not match")
    }

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error))
      return false
    }

    return true
  }

  const handleNextStep = () => {
    if (!validateStep(currentStep)) return

    if (role === "driver") {
      if (currentStep < SIGNUP_STEPS.SECURITY) {
        setCurrentStep(currentStep + 1)
      }
    } else {
      if (currentStep === SIGNUP_STEPS.BASIC_INFO) {
        setCurrentStep(SIGNUP_STEPS.EMERGENCY_CONTACT)
      } else if (currentStep === SIGNUP_STEPS.EMERGENCY_CONTACT) {
        setCurrentStep(SIGNUP_STEPS.SECURITY)
      }
    }
  }

  const handlePrevStep = () => {
    if (currentStep === SIGNUP_STEPS.BASIC_INFO) {
      setCurrentStep(SIGNUP_STEPS.ROLE_SELECTION)
      setRole(null)
    } else if (role === "driver") {
      setCurrentStep(currentStep - 1)
    } else {
      if (currentStep === SIGNUP_STEPS.SECURITY) {
        setCurrentStep(SIGNUP_STEPS.EMERGENCY_CONTACT)
      } else if (currentStep === SIGNUP_STEPS.EMERGENCY_CONTACT) {
        setCurrentStep(SIGNUP_STEPS.BASIC_INFO)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep(SIGNUP_STEPS.SECURITY)) return

    setIsSubmitting(true)
    try {
      // Create FormData for file uploads
      const formDataObj = new FormData()
      formDataObj.append("firstName", formData.firstName)
      formDataObj.append("lastName", formData.lastName)
      formDataObj.append("email", formData.email)
      formDataObj.append("phone", formData.phone)
      formDataObj.append("dob", formData.dob)
      formDataObj.append("gender", formData.gender)
      formDataObj.append("password", formData.password)
      formDataObj.append("role", role)

      // Append profile picture if exists
      if (formData.profilePicture) {
        formDataObj.append("profilePicture", formData.profilePicture)
      }

      // Create user account
      const signUpResponse = await fetch("/api/auth/signup", {
        method: "POST",
        body: formDataObj,
      })

      if (!signUpResponse.ok) {
        const error = await signUpResponse.json()
        throw new Error(error.message || "Sign up failed")
      }

      const response = await signUpResponse.json()
      
      if (!response.success || !response.user) {
        throw new Error(response.error || "Sign up failed")
      }

      const userData = response.user

      // If driver, create driver profile
      if (role === "driver") {
        // Ensure bankName is populated from the selected bank
        const bankName = formData.bankName || banks.find((b) => b.code === formData.bankCode)?.name || ""
        
        if (!bankName) {
          throw new Error("Bank name could not be determined. Please select a bank and try again.")
        }

        const driverFormData = new FormData()
        driverFormData.append("userId", userData.id)
        driverFormData.append("vehicleType", formData.vehicleType)
        driverFormData.append("plateNumber", formData.plateNumber)
        driverFormData.append("unionName", formData.unionName)
        driverFormData.append("operatingZones", JSON.stringify(formData.operatingZones))
        driverFormData.append("bankName", bankName)
        driverFormData.append("bankAccountNumber", formData.bankAccountNumber)
        driverFormData.append("emergencyContact", formData.emergencyContact)

        // Append vehicle and license pictures if exist
        if (formData.vehiclePicture) {
          driverFormData.append("vehiclePicture", formData.vehiclePicture)
        }
        if (formData.licensePicture) {
          driverFormData.append("licensePicture", formData.licensePicture)
        }

        const driverResponse = await fetch("/api/drivers", {
          method: "POST",
          body: driverFormData,
        })

        if (!driverResponse.ok) {
          throw new Error("Failed to create driver profile")
        }
      } else {
        // If rider, no need for separate profile - users with role 'user' are riders
        // Profile is already marked as complete during signup
        // No additional action needed here
      }

      toast.success("Account created successfully!")

      // Sign in user
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.ok) {
        router.push(role === "driver" ? "/driver/dashboard" : "/user/dashboard")
      } else {
        router.push("/auth/login")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign up failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const zoneOptions = [
    "Shomolu Roundabout",
    "Palmgrove Bus Stop Axis",
    "Fola Agoro Junction",
    "Bajulaiye Road Area",
    "Pedro Bus Stop",
    "Onipanu Inward Streets",
    "Bariga Road (Shomolu Inward Axis)",
    "Akoka Road Stretch (toward UNILAG back gate)",
    "Lad-Lak Bus Stop Area",
    "Shomolu Local Government Area Axis",
    "Igbobi–Shomolu Link Roads",
    "Shomolu Market Vicinity",
    "Alade Street Cluster",
    "Abiodun Street Cluster",
    "Ilaje Road Extension",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-background flex items-center justify-center p-2 relative overflow-hidden pb-24">
      <Particles />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl z-10"
      >
        <Card className="bg-card/80 backdrop-blur-xl border-primary/20 shadow-2xl">
          <CardHeader className="text-center space-y-2 pb-1">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </motion.div>

            <div>
              <CardTitle className="text-2xl">Join Charter Keke</CardTitle>
              <CardDescription>
                {currentStep === SIGNUP_STEPS.ROLE_SELECTION
                  ? "How would you like to use Charter Keke?"
                  : `Step ${getDisplayStep() + 1} of ${getStepConfig().length}`}
              </CardDescription>
            </div>
          </CardHeader>

          {currentStep !== SIGNUP_STEPS.ROLE_SELECTION && role && (
            <div className="px-6 pt-2 pb-0 lg:pb-0">
              <AnimatedStepIndicator steps={getStepConfig()} currentStep={getDisplayStep()} allowClickNavigation={false} />
            </div>
          )}

          <CardContent className="pt-4">
            <AnimatePresence mode="wait">
              {/* Step 1: Role Selection */}
              {currentStep === SIGNUP_STEPS.ROLE_SELECTION && (
                <motion.div key="role-selection" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Driver Option */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRoleSelect("driver")}
                      className="p-6 rounded-xl border-2 border-transparent hover:border-primary bg-secondary/10 hover:bg-secondary/20 transition-all text-left"
                    >
                      <Car className="w-8 h-8 text-primary mb-3" />
                      <h3 className="font-semibold text-lg">Drive with us</h3>
                      <p className="text-sm text-muted-foreground mt-2">Become a driver and start earning</p>
                    </motion.button>

                    {/* Rider Option */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRoleSelect("user")}
                      className="p-6 rounded-xl border-2 border-transparent hover:border-primary bg-secondary/10 hover:bg-secondary/20 transition-all text-left"
                    >
                      <User className="w-8 h-8 text-primary mb-3" />
                      <h3 className="font-semibold text-lg">Book a ride</h3>
                      <p className="text-sm text-muted-foreground mt-2">Get around town affordably</p>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Basic Info */}
              {currentStep === SIGNUP_STEPS.BASIC_INFO && role && (
                <motion.form key="basic-info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input id="firstName" name="firstName" placeholder="John" value={formData.firstName} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input id="lastName" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input id="email" name="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input id="phone" name="phone" placeholder="+234 800 000 0000" value={formData.phone} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob" className="text-sm">
                      Date of Birth <span className="text-red-500">*</span>
                    </Label>
                    <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm">
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-3 py-2 border border-input rounded-md bg-background">
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profilePicture" className="text-sm">
                      Profile Picture
                    </Label>
                    <div className="border-2 border-dashed border-muted-foreground rounded-lg p-4">
                      <input type="file" id="profilePicture" name="profilePicture" accept="image/*" onChange={(e) => handleFileChange(e, "profilePicture")} className="hidden" />
                      <label htmlFor="profilePicture" className="cursor-pointer flex flex-col items-center gap-2">
                        {previewImages.profilePicture ? (
                          <Image src={previewImages.profilePicture} alt="Profile" width={80} height={80} className="rounded-lg object-cover" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Click to upload</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1">
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* Step 3: Bank Verification (Driver Only) */}
              {currentStep === SIGNUP_STEPS.BANK_VERIFICATION && role === "driver" && (
                <motion.form key="bank-verification" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-2">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-3">
                    <div className="flex gap-3">
                      <Building2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Bank Account Verification</p>
                        <p className="text-xs text-muted-foreground mt-1">Verify your bank account for payouts</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankCode" className="text-sm">
                      Select Bank <span className="text-red-500">*</span>
                    </Label>
                    <select name="bankCode" value={formData.bankCode} onChange={handleInputChange} disabled={loadingBanks} className="w-full px-3 py-2 border border-input rounded-md bg-background">
                      <option value="">{loadingBanks ? "Loading banks..." : "Select a bank"}</option>
                      {banks.map((bank, index) => (
                        <option key={`${bank.code}-${index}`} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankAccountNumber" className="text-sm">
                      Account Number <span className="text-red-500">*</span>
                    </Label>
                    <Input id="bankAccountNumber" name="bankAccountNumber" placeholder="1234567890" value={formData.bankAccountNumber} onChange={handleInputChange} maxLength={10} />
                  </div>

                  <Button type="button" onClick={handleVerifyBankAccount} disabled={verifyingAccount || !formData.bankCode || !formData.bankAccountNumber} className="w-full">
                    {verifyingAccount ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Verify Account
                      </>
                    )}
                  </Button>

                  {accountVerified && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex gap-3 items-start">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-700">Account {formData.verifiedAccountName ? "Verified" : "Accepted"}</p>
                          <div className="mt-2 space-y-1">
                            {formData.verifiedAccountName && (
                              <p className="text-sm text-green-700">
                                <span className="font-medium">Name:</span> {formData.verifiedAccountName}
                              </p>
                            )}
                            {formData.bankName && (
                              <p className="text-sm text-green-700">
                                <span className="font-medium">Bank:</span> {formData.bankName}
                              </p>
                            )}
                            {!formData.verifiedAccountName && (
                              <p className="text-sm text-green-700">
                                Account number: {formData.bankAccountNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!accountVerified && formData.bankAccountNumber && formData.bankCode && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                      <p className="text-xs text-yellow-700">
                        Verification temporarily unavailable. If you're confident about your account details, you can proceed to the next step.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1">
                      Back
                    </Button>
                    {!accountVerified && formData.bankAccountNumber && formData.bankCode ? (
                      <Button type="button" onClick={handleProceedWithoutVerification} className="flex-1">
                        Proceed Anyway
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button type="submit" disabled={!accountVerified} className="flex-1">
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </motion.form>
              )}

              {/* Step 4: Vehicle Info (Driver Only) */}
              {currentStep === SIGNUP_STEPS.VEHICLE_INFO && role === "driver" && (
                <motion.form key="vehicle-info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-2">
                  <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-3 mb-3">
                    <div className="flex gap-3">
                      <Car className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Vehicle Information</p>
                        <p className="text-xs text-muted-foreground mt-1">Details about your vehicle</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">
                      Vehicle Type <span className="text-red-500">*</span>
                    </Label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground">
                      <p className="font-medium text-foreground">Keke Tricycle</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plateNumber" className="text-sm">
                      Plate Number <span className="text-red-500">*</span>
                    </Label>
                    <Input id="plateNumber" name="plateNumber" placeholder="ABC 123 XY" value={formData.plateNumber} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unionName" className="text-sm">
                      Union/Association Name <span className="text-red-500">*</span>
                    </Label>
                    <Input id="unionName" name="unionName" placeholder="E.g., Ikeja Unions" value={formData.unionName} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Vehicle Picture <span className="text-red-500">*</span></Label>
                    <div className="border-2 border-dashed border-muted-foreground rounded-lg p-4">
                      <input type="file" id="vehiclePicture" name="vehiclePicture" accept="image/*" onChange={(e) => handleFileChange(e, "vehiclePicture")} className="hidden" />
                      <label htmlFor="vehiclePicture" className="cursor-pointer flex flex-col items-center gap-2">
                        {previewImages.vehiclePicture ? (
                          <Image src={previewImages.vehiclePicture} alt="Vehicle" width={100} height={80} className="rounded-lg object-cover" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Click to upload vehicle image</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1">
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* Step 5: Documents & License (Driver Only) */}
              {currentStep === SIGNUP_STEPS.DOCUMENTS && role === "driver" && (
                <motion.form key="documents" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-2">
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-3">
                    <div className="flex gap-3">
                      <FileText className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Documents & Contact</p>
                        <p className="text-xs text-muted-foreground mt-1">License and emergency information</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">License Picture <span className="text-red-500">*</span></Label>
                    <div className="border-2 border-dashed border-muted-foreground rounded-lg p-4">
                      <input type="file" id="licensePicture" name="licensePicture" accept="image/*" onChange={(e) => handleFileChange(e, "licensePicture")} className="hidden" />
                      <label htmlFor="licensePicture" className="cursor-pointer flex flex-col items-center gap-2">
                        {previewImages.licensePicture ? (
                          <Image src={previewImages.licensePicture} alt="License" width={100} height={80} className="rounded-lg object-cover" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Click to upload license image</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Operating Zones <span className="text-red-500">*</span></Label>
                    <div className="grid grid-cols-2 gap-2">
                      {zoneOptions.map((zone) => (
                        <label key={zone} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.operatingZones.includes(zone)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData((prev) => ({
                                  ...prev,
                                  operatingZones: [...prev.operatingZones, zone],
                                }))
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  operatingZones: prev.operatingZones.filter((z) => z !== zone),
                                }))
                              }
                            }}
                            className="rounded"
                          />
                          {zone}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact" className="text-sm">
                      Emergency Contact <span className="text-red-500">*</span>
                    </Label>
                    <Input id="emergencyContact" name="emergencyContact" placeholder="Contact name & number" value={formData.emergencyContact} onChange={handleInputChange} />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1">
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* Step 3: Emergency Contact (Rider Only) */}
              {currentStep === SIGNUP_STEPS.EMERGENCY_CONTACT && role === "user" && (
                <motion.form key="emergency-contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-2">
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-3">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Emergency Contact</p>
                        <p className="text-xs text-muted-foreground mt-1">For safety purposes</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName" className="text-sm">
                      Emergency Contact Name <span className="text-red-500">*</span>
                    </Label>
                    <Input id="emergencyContactName" name="emergencyContactName" placeholder="Full name" value={formData.emergencyContactName} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone" className="text-sm">
                      Emergency Contact Phone <span className="text-red-500">*</span>
                    </Label>
                    <Input id="emergencyContactPhone" name="emergencyContactPhone" placeholder="+234 800 000 0000" value={formData.emergencyContactPhone} onChange={handleInputChange} />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1">
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* Step 6/4: Security & Password */}
              {currentStep === SIGNUP_STEPS.SECURITY && role && (
                <motion.form key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSubmit} className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-2">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-3">
                    <div className="flex gap-3">
                      <Lock className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Secure Your Account</p>
                        <p className="text-xs text-muted-foreground mt-1">Create a strong password</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm">
                      Confirm Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referralCode" className="text-sm">
                      Referral Code (Optional)
                    </Label>
                    <Input id="referralCode" name="referralCode" placeholder="Referral code" value={formData.referralCode} onChange={handleInputChange} />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1">
                      Back
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Create Account
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
