"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Shield, Lock, EyeOff, KeyRound } from "lucide-react"

export default function AdminSecurityPage() {
  const [twoFactor, setTwoFactor] = useState(false)
  const [loginAlerts, setLoginAlerts] = useState(true)
  const [adminPassword, setAdminPassword] = useState(false)

  const handleToggle = (type: string) => {
    toast.success(type + (type === "2FA" ? (twoFactor ? " disabled" : " enabled") : loginAlerts ? " disabled" : " enabled"))
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 pt-16 lg:pt-0 flex flex-col">
          <div className="p-4 md:p-6 lg:p-8 space-y-6 h-full">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-7 w-7 text-primary" />
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">App Security</h1>
              </div>
              <p className="text-muted-foreground">Manage security settings and controls for the app.</p>
            </motion.div>
            <Separator />
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-primary/10">
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Require 2FA for admin logins</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" />Enable 2FA</span>
                    <Switch checked={twoFactor} onCheckedChange={v => { setTwoFactor(v); handleToggle("2FA") }} />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-primary/10">
                <CardHeader>
                  <CardTitle>Login Alerts</CardTitle>
                  <CardDescription>Notify admin on new logins</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><EyeOff className="h-5 w-5 text-primary" />Enable Alerts</span>
                    <Switch checked={loginAlerts} onCheckedChange={v => { setLoginAlerts(v); handleToggle("Login Alerts") }} />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-primary/10 md:col-span-2">
                <CardHeader>
                  <CardTitle>Change Admin Password</CardTitle>
                  <CardDescription>Update the password for admin access</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    <Button variant="outline" onClick={() => { setAdminPassword(true); toast.info("Password change flow coming soon!") }}>Change Password</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
