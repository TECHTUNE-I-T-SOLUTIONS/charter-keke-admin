"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { User, Mail, Phone, Car, FileText, Moon, Sun, Save, Loader2, Shield } from "lucide-react"
import { useTheme } from "next-themes"

function DriverSettingsContent() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success("Settings saved successfully!")
    setIsSaving(false)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Driver Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your driver profile and preferences</p>
          </motion.div>

          <div className="grid gap-6">
            {/* Profile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        defaultValue={user?.firstName}
                        className="bg-background/50 border-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        defaultValue={user?.lastName}
                        className="bg-background/50 border-primary/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        defaultValue={user?.email}
                        className="pl-10 bg-background/50 border-primary/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        defaultValue={user?.phone}
                        className="pl-10 bg-background/50 border-primary/20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Vehicle Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    Vehicle Information
                  </CardTitle>
                  <CardDescription>Your registered vehicle details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-muted/30 border border-primary/10 text-center">
                    <p className="text-muted-foreground">No vehicle registered yet</p>
                    <Button variant="outline" className="mt-4 border-primary/20 hover:bg-primary/10 bg-transparent">
                      Add Vehicle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Documents */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Documents
                  </CardTitle>
                  <CardDescription>Upload required documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-primary/20 text-center">
                      <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-foreground">Driver&apos;s License</p>
                      <p className="text-xs text-muted-foreground">Not uploaded</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-primary/20 text-center">
                      <Car className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-foreground">Vehicle Registration</p>
                      <p className="text-xs text-muted-foreground">Not uploaded</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Appearance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {theme === "dark" ? (
                      <Moon className="h-5 w-5 text-primary" />
                    ) : (
                      <Sun className="h-5 w-5 text-primary" />
                    )}
                    Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">Toggle theme</p>
                    </div>
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full md:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DriverSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <DriverSettingsContent />
    </ProtectedRoute>
  )
}
