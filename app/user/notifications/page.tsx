"use client"

import { motion } from "framer-motion"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, BellOff, Mail, Smartphone, Volume2 } from "lucide-react"

function NotificationsContent() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">Manage your notification preferences</p>
          </motion.div>

          <div className="grid gap-6">
            {/* Notification Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>Choose how you want to receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Volume2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <Label htmlFor="push" className="font-medium">
                          Push Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">Receive real-time updates on your device</p>
                      </div>
                    </div>
                    <Switch id="push" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/10">
                        <Mail className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <Label htmlFor="email" className="font-medium">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">Get ride confirmations and receipts via email</p>
                      </div>
                    </div>
                    <Switch id="email" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <Smartphone className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <Label htmlFor="sms" className="font-medium">
                          SMS Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">Receive important updates via text message</p>
                      </div>
                    </div>
                    <Switch id="sms" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardHeader>
                  <CardTitle>Recent Notifications</CardTitle>
                  <CardDescription>Your latest notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 rounded-full bg-muted/50 mb-4">
                      <BellOff className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-foreground mb-1">No notifications yet</h3>
                    <p className="text-sm text-muted-foreground">
                      You&apos;ll see your notifications here once you start using EASELY.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <NotificationsContent />
    </ProtectedRoute>
  )
}
