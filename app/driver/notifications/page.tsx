"use client"

import { motion } from "framer-motion"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, BellOff, Mail, Smartphone, Volume2, Car } from "lucide-react"

function DriverNotificationsContent() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">Manage your driver notification preferences</p>
          </motion.div>

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
                <CardDescription>Choose how you receive alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Label className="font-medium">Ride Requests</Label>
                      <p className="text-sm text-muted-foreground">Get notified of new ride requests</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Volume2 className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <Label className="font-medium">Sound Alerts</Label>
                      <p className="text-sm text-muted-foreground">Play sound for new requests</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Smartphone className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <Label className="font-medium">SMS Alerts</Label>
                      <p className="text-sm text-muted-foreground">Receive SMS for important updates</p>
                    </div>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Mail className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <Label className="font-medium">Email Summaries</Label>
                      <p className="text-sm text-muted-foreground">Daily/weekly earning summaries</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>Your latest alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <BellOff className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">No notifications</h3>
                  <p className="text-sm text-muted-foreground">You&apos;ll see ride requests and updates here.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function DriverNotificationsPage() {
  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <DriverNotificationsContent />
    </ProtectedRoute>
  )
}
