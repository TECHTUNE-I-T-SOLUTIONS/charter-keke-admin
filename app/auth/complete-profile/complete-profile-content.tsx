"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"

interface CompleteProfileContentProps {
  userRole: string
}

export default function CompleteProfileContent({ userRole }: CompleteProfileContentProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("")

  const [formData, setFormData] = useState({
    vehicle_type: "",
    plate_number: "",
    operating_zones: "",
    union_name: "",
    emergency_contact: "",
    bank_name: "",
    bank_account_number: "",
  })

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfilePicture(file)
      const preview = URL.createObjectURL(file)
      setProfilePicturePreview(preview)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const form = new FormData()

      if (profilePicture) {
        form.append("profile_picture", profilePicture)
      }

      if (userRole === "driver") {
        form.append("vehicle_type", formData.vehicle_type)
        form.append("plate_number", formData.plate_number)
        form.append("operating_zones", formData.operating_zones)
        form.append("union_name", formData.union_name)
        form.append("emergency_contact", formData.emergency_contact)
        form.append("bank_name", formData.bank_name)
        form.append("bank_account_number", formData.bank_account_number)
      }

      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        body: form,
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to complete profile")
        return
      }

      toast.success("Profile completed successfully!")

      // Redirect based on role
      if (userRole === "driver") {
        router.push("/driver/dashboard")
      } else {
        router.push("/user/book")
      }
    } catch (error) {
      console.error("Profile completion error:", error)
      toast.error("An error occurred while completing your profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#052659]/10 via-transparent to-[#4353a4]/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Complete Your Profile</CardTitle>
            <CardDescription>
              {userRole === "driver"
                ? "Provide your driver information to get started"
                : "Complete your profile to start booking rides"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture Section */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  {profilePicturePreview ? (
                    <img
                      src={profilePicturePreview}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-primary">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Driver-specific fields */}
              {userRole === "driver" && (
                <>
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Driver Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicle_type">Keke Type</Label>
                        <Input
                          id="vehicle_type"
                          name="vehicle_type"
                          placeholder="e.g., Bajaj Auto, Piaggio"
                          value={formData.vehicle_type}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plate_number">License Plate</Label>
                        <Input
                          id="plate_number"
                          name="plate_number"
                          placeholder="e.g., ABC123"
                          value={formData.plate_number}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="operating_zones">Operating Zones</Label>
                      <Input
                        id="operating_zones"
                        name="operating_zones"
                        placeholder="e.g., Debari, Shomolu, Yaba (comma-separated)"
                        value={formData.operating_zones}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="union_name">Union Name (Optional)</Label>
                      <Input
                        id="union_name"
                        name="union_name"
                        placeholder="e.g., KK Union 1"
                        value={formData.union_name}
                        onChange={handleFormChange}
                      />
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="emergency_contact">Emergency Contact</Label>
                      <Input
                        id="emergency_contact"
                        name="emergency_contact"
                        placeholder="Name and phone number"
                        value={formData.emergency_contact}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="bank_name">Bank Name</Label>
                        <Input
                          id="bank_name"
                          name="bank_name"
                          placeholder="e.g., GTBank"
                          value={formData.bank_name}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_account_number">Account Number</Label>
                        <Input
                          id="bank_account_number"
                          name="bank_account_number"
                          placeholder="Your bank account number"
                          value={formData.bank_account_number}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Go Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {loading ? "Completing..." : "Complete Profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
