"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Bell, IdCard, Loader2, Lock, Save, Shield, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type AdminProfile = {
  user: {
    id: string
    first_name: string
    last_name: string
    phone_number: string
    email: string
    dob: string | null
    gender: string | null
    profile_picture_url: string | null
    role: string
    status: string
    profile_complete: boolean
    emergency_contact: string | null
    emergency_phone: string | null
    created_at: string
    updated_at: string
  }
  admin: {
    id: string
    admin_level: string
    department: string
    crm_enabled: boolean
    crm_meta: Record<string, any> | null
    permissions: Record<string, any> | null
    created_at: string
    updated_at: string
  }
}

type ProfileForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
  dob: string
  gender: string
  emergencyContact: string
  emergencyPhone: string
}

type PreferencesForm = {
  timezone: string
  language: string
  emailAlerts: boolean
  pushAlerts: boolean
  dailySummary: boolean
  weeklyReport: boolean
  compactMode: boolean
}

const DEFAULT_PREFERENCES: PreferencesForm = {
  timezone: "Africa/Lagos",
  language: "en",
  emailAlerts: true,
  pushAlerts: true,
  dailySummary: true,
  weeklyReport: true,
  compactMode: false,
}

function formatDate(value?: string | null) {
  if (!value) return "Not set"
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function prettify(value?: string | null) {
  if (!value) return "Not set"
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function AdminSettingsContent() {
  const { data: session, update } = useSession()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    emergencyContact: "",
    emergencyPhone: "",
  })
  const [preferences, setPreferences] = useState<PreferencesForm>(DEFAULT_PREFERENCES)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const displayName = useMemo(() => {
    const name = `${profileForm.firstName} ${profileForm.lastName}`.trim()
    return name || session?.user?.name || "Admin"
  }, [profileForm.firstName, profileForm.lastName, session?.user?.name])

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=FF9101&color=000`
  const reviewStatus = profile?.admin.permissions?.status || "approved"
  const reviewReason = profile?.admin.permissions?.request_reason || profile?.admin.permissions?.reason

  const hydrateForm = (nextProfile: AdminProfile) => {
    setProfile(nextProfile)
    setAvatarUrl(nextProfile.user.profile_picture_url || "")
    setProfileForm({
      firstName: nextProfile.user.first_name || "",
      lastName: nextProfile.user.last_name || "",
      email: nextProfile.user.email || "",
      phone: nextProfile.user.phone_number || "",
      dob: nextProfile.user.dob || "",
      gender: nextProfile.user.gender || "",
      emergencyContact: nextProfile.user.emergency_contact || "",
      emergencyPhone: nextProfile.user.emergency_phone || "",
    })
    setPreferences({
      ...DEFAULT_PREFERENCES,
      ...(nextProfile.admin.crm_meta?.preferences || {}),
    })
  }

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/profile", { cache: "no-store" })
      const result = await response.json()
      if (!response.ok) throw new Error(result?.error || "Failed to load profile")
      hydrateForm(result.profile)
    } catch (error) {
      console.error("[AdminSettings] loadProfile failed:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingAvatar(true)
      const formData = new FormData()
      formData.append("profilePicture", file)

      const response = await fetch("/api/user/profile/avatar", {
        method: "POST",
        body: formData,
      })
      const result = await response.json()

      if (!response.ok) throw new Error(result?.error || "Avatar upload failed")

      const nextAvatar = result?.user?.profile_picture_url || ""
      setAvatarUrl(nextAvatar)
      setProfile((current) =>
        current ? { ...current, user: { ...current.user, profile_picture_url: nextAvatar } } : current
      )
      await update?.()
      toast.success("Profile picture updated")
    } catch (error) {
      console.error("Admin avatar upload failed:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload avatar")
    } finally {
      setUploadingAvatar(false)
      e.target.value = ""
    }
  }

  const patchProfile = async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/admin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result?.error || "Failed to save settings")
    hydrateForm(result.profile)
    await update?.()
    return result
  }

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true)
      await patchProfile(profileForm)
      toast.success("Profile updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSavePreferences = async () => {
    try {
      setSavingPreferences(true)
      await patchProfile({ crmMeta: { preferences } })
      toast.success("Preferences saved")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save preferences")
    } finally {
      setSavingPreferences(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirmation do not match")
      return
    }

    try {
      setSavingPassword(true)
      await patchProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast.success("Password changed")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password")
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen pt-16 lg:pt-0 p-4 md:p-6 lg:p-8">
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading your admin settings...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-16 lg:pt-0">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Admin Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your profile, access details, notifications, and security.</p>
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-primary hover:bg-primary/90">
            {savingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Profile
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <Card className="border-primary/10">
            <CardContent className="p-5">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <Image
                    src={avatarUrl || (session?.user as any)?.image || fallbackAvatar}
                    alt="Admin avatar"
                    width={84}
                    height={84}
                    className="h-[84px] w-[84px] rounded-full border-2 border-primary object-cover"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
                    <p className="text-sm text-muted-foreground">{profileForm.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                        {prettify(profile?.admin.admin_level)}
                      </span>
                      <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                        {prettify(profile?.admin.department)}
                      </span>
                      <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                        {prettify(profile?.user.status)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-full max-w-sm space-y-2">
                  <Label htmlFor="adminAvatar">Profile picture</Label>
                  <Input
                    id="adminAvatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                  <p className="text-xs text-muted-foreground">
                    {uploadingAvatar ? "Uploading..." : "Upload PNG, JPG, or WEBP for your admin account."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="profile">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="profile" className="gap-2">
              <UserRound className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="access" className="gap-2">
              <IdCard className="h-4 w-4" />
              Access
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Bell className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>These details come from your `users` record and are used across the admin dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={profileForm.dob}
                      onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={profileForm.gender || "not_set"}
                      onValueChange={(value) => setProfileForm({ ...profileForm, gender: value === "not_set" ? "" : value })}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_set">Prefer not to say</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency contact</Label>
                    <Input
                      id="emergencyContact"
                      value={profileForm.emergencyContact}
                      onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Emergency phone</Label>
                    <Input
                      id="emergencyPhone"
                      value={profileForm.emergencyPhone}
                      onChange={(e) => setProfileForm({ ...profileForm, emergencyPhone: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-primary hover:bg-primary/90">
                  {savingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle>Admin Access</CardTitle>
                  <CardDescription>Your role is managed by super admins and HR.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow label="Admin ID" value={profile?.admin.id} />
                  <InfoRow label="User ID" value={profile?.user.id} />
                  <InfoRow label="Admin level" value={prettify(profile?.admin.admin_level)} />
                  <InfoRow label="Department" value={prettify(profile?.admin.department)} />
                  <InfoRow label="CRM access" value={profile?.admin.crm_enabled ? "Enabled" : "Disabled"} />
                  <InfoRow label="Review status" value={prettify(reviewStatus)} />
                  <InfoRow label="Account status" value={prettify(profile?.user.status)} />
                  <InfoRow label="Admin since" value={formatDate(profile?.admin.created_at)} />
                  <InfoRow label="Last updated" value={formatDate(profile?.admin.updated_at)} />
                </CardContent>
              </Card>

              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle>Review Metadata</CardTitle>
                  <CardDescription>Current access request and approval details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviewReason ? (
                    <div className="rounded-md border border-primary/10 bg-muted/30 p-4">
                      <p className="text-xs uppercase text-muted-foreground">Request reason</p>
                      <p className="mt-2 text-sm text-foreground">{reviewReason}</p>
                    </div>
                  ) : null}
                  <InfoRow label="Requested at" value={formatDate(profile?.admin.permissions?.request_date)} />
                  <InfoRow label="Reviewed at" value={formatDate(profile?.admin.permissions?.reviewed_at)} />
                  <InfoRow label="Review message" value={profile?.admin.permissions?.review_message || "No review message"} />
                  <div className="rounded-md border border-primary/10 bg-muted/30 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Raw permissions</p>
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
                      {JSON.stringify(profile?.admin.permissions || {}, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="mt-6">
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle>Personal Preferences</CardTitle>
                <CardDescription>Saved to your admin `crm_meta.preferences` record.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(timezone) => setPreferences({ ...preferences, timezone })}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New York</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={preferences.language}
                      onValueChange={(language) => setPreferences({ ...preferences, language })}
                    >
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="yo">Yoruba</SelectItem>
                        <SelectItem value="ha">Hausa</SelectItem>
                        <SelectItem value="ig">Igbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <PreferenceSwitch
                  title="Email alerts"
                  description="Receive email alerts for tickets, assignments, and admin events."
                  checked={preferences.emailAlerts}
                  onCheckedChange={(emailAlerts) => setPreferences({ ...preferences, emailAlerts })}
                />
                <PreferenceSwitch
                  title="Web push alerts"
                  description="Receive browser push notifications when this admin device is subscribed."
                  checked={preferences.pushAlerts}
                  onCheckedChange={(pushAlerts) => setPreferences({ ...preferences, pushAlerts })}
                />
                <PreferenceSwitch
                  title="Daily operations summary"
                  description="Include this account in daily summary emails when enabled by the system."
                  checked={preferences.dailySummary}
                  onCheckedChange={(dailySummary) => setPreferences({ ...preferences, dailySummary })}
                />
                <PreferenceSwitch
                  title="Weekly report"
                  description="Include this account in weekly performance report emails."
                  checked={preferences.weeklyReport}
                  onCheckedChange={(weeklyReport) => setPreferences({ ...preferences, weeklyReport })}
                />
                <PreferenceSwitch
                  title="Compact dashboard mode"
                  description="Prefer denser tables and cards where supported."
                  checked={preferences.compactMode}
                  onCheckedChange={(compactMode) => setPreferences({ ...preferences, compactMode })}
                />

                <Button onClick={handleSavePreferences} disabled={savingPreferences} className="bg-primary hover:bg-primary/90">
                  {savingPreferences ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Use a strong password to protect your admin account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleChangePassword} disabled={savingPassword} className="bg-primary hover:bg-primary/90">
                    {savingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                    Update Password
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle>Account Activity</CardTitle>
                  <CardDescription>Reference timestamps for this admin profile.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow label="User created" value={formatDate(profile?.user.created_at)} />
                  <InfoRow label="User updated" value={formatDate(profile?.user.updated_at)} />
                  <InfoRow label="Profile complete" value={profile?.user.profile_complete ? "Yes" : "No"} />
                  <InfoRow label="Role" value={prettify(profile?.user.role)} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-primary/10 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="break-all text-sm font-medium text-foreground">{value || "Not set"}</span>
    </div>
  )
}

function PreferenceSwitch({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-primary/10 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export default function AdminSettingsPage() {
  return <AdminSettingsContent />
}
