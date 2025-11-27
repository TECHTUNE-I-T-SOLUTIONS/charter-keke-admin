"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Car, MapPin, Navigation } from "lucide-react"

function ActiveRidesContent() {
  const [isOnline, setIsOnline] = useState(false)

  const handleOnlineToggle = (checked: boolean) => {
    setIsOnline(checked)
    toast.success(checked ? "You're now online!" : "You're now offline")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Active Rides</h1>
              <p className="text-muted-foreground mt-1">Manage your current and incoming ride requests</p>
            </div>

            <Card
              className={`p-4 transition-all duration-300 ${isOnline ? "bg-emerald-500/10 border-emerald-500/30" : "bg-card/50 border-primary/10"}`}
            >
              <div className="flex items-center gap-4">
                <div className={`relative w-3 h-3 rounded-full ${isOnline ? "bg-emerald-500" : "bg-muted-foreground"}`}>
                  {isOnline && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping" />}
                </div>
                <Label htmlFor="online-toggle" className="font-medium text-foreground">
                  {isOnline ? "Online" : "Offline"}
                </Label>
                <Switch
                  id="online-toggle"
                  checked={isOnline}
                  onCheckedChange={handleOnlineToggle}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Map Area */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur border-primary/10 h-[400px] lg:h-full">
                <CardContent className="p-0 h-full">
                  <div className="h-full rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="p-4 rounded-full bg-primary/10 inline-block mb-4">
                        <MapPin className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Live Map</h3>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        Real-time navigation and ride tracking coming soon!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Ride Requests */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardHeader>
                  <CardTitle>Incoming Requests</CardTitle>
                  <CardDescription>
                    {isOnline ? "Ride requests will appear here" : "Go online to see requests"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className={`p-4 rounded-full mb-4 ${isOnline ? "bg-emerald-500/10" : "bg-muted/50"}`}>
                      <Car className={`h-8 w-8 ${isOnline ? "text-emerald-500" : "text-muted-foreground"}`} />
                    </div>
                    <h3 className="font-medium text-foreground mb-1">
                      {isOnline ? "Waiting for requests..." : "You're offline"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isOnline ? "Stay online to receive ride requests" : "Go online to start receiving requests"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardHeader>
                  <CardTitle>Current Ride</CardTitle>
                  <CardDescription>No active ride</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="p-4 rounded-full bg-muted/50 mb-4">
                      <Navigation className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-foreground mb-1">No active ride</h3>
                    <p className="text-sm text-muted-foreground">Accept a ride request to start navigating</p>
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

export default function ActiveRidesPage() {
  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <ActiveRidesContent />
    </ProtectedRoute>
  )
}
