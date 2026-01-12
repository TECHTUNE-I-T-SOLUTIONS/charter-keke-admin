"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CharterKeKeMap } from "@/components/easely-map"
import { Car, Wallet, Star, Clock, Users, Navigation, AlertCircle, Loader, MapPin } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

function DriverDashboardContent() {
  const { data: session } = useSession()
  const { user: contextUser } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [driverData, setDriverData] = useState<any>(null)
  const [activeRides, setActiveRides] = useState<any[]>([])
  const [mapMarkers, setMapMarkers] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  const user = session?.user
    ? {
        id: (session.user as any).id || "",
        email: session.user.email || "",
        phone: (session.user as any).phone,
        firstName: (session.user as any).firstName || "Driver",
        lastName: (session.user as any).lastName || "",
        role: (session.user as any).role || "driver",
      }
    : contextUser

  // Fetch driver details and active rides
  useEffect(() => {
    if (!user?.id) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const [detailsRes, ridesRes] = await Promise.all([
          fetch("/api/driver/details"),
          fetch("/api/driver/active-rides"),
        ])

        const detailsData = await detailsRes.json()
        const ridesData = await ridesRes.json()

        setDriverData(detailsData.driver)
        setActiveRides(ridesData.rides || [])

        // Create map markers from active rides
        const markers: any[] = []
        if (detailsData.driver?.users?.profile_picture_url) {
          markers.push({
            id: "driver",
            lat: 6.5244,
            lng: 3.3792,
            title: `${user.firstName} (You)`,
            type: "driver",
          })
        }

        ridesData.rides?.forEach((ride: any) => {
          markers.push({
            id: `pickup-${ride.id}`,
            lat: 6.5244 + Math.random() * 0.05,
            lng: 3.3792 + Math.random() * 0.05,
            title: ride.pickup_zone,
            description: `Pickup for ${ride.users?.first_name}`,
            type: "pickup",
          })

          markers.push({
            id: `destination-${ride.id}`,
            lat: 6.5244 + Math.random() * 0.1,
            lng: 3.3792 + Math.random() * 0.1,
            title: ride.destination_zone,
            description: "Destination",
            type: "destination",
          })
        })

        setMapMarkers(markers)
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  const handleOnlineToggle = (checked: boolean) => {
    setIsOnline(checked)
    fetch("/api/driver/details", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "availability",
        data: { status: checked ? "online" : "offline" },
      }),
    })
      .then(() => {
        if (checked) {
          toast.success("You're now online!", {
            description: "You'll start receiving ride requests from Lagos riders.",
          })
        } else {
          toast.info("You're now offline", {
            description: "You won't receive any ride requests.",
          })
        }
      })
      .catch(() => toast.error("Failed to update status"))
  }

  const stats = [
    {
      label: "Today's Earnings",
      value: `₦${driverData?.total_earnings || 0}`,
      icon: <Wallet className="h-5 w-5" />,
      color: "from-emerald-500 to-emerald-400",
    },
    {
      label: "Rides Completed",
      value: `${driverData?.total_rides_completed || 0}`,
      icon: <Car className="h-5 w-5" />,
      color: "from-primary to-primary/70",
    },
    {
      label: "Rating",
      value: `${(driverData?.average_rating || 5.0).toFixed(1)}⭐`,
      icon: <Star className="h-5 w-5" />,
      color: "from-amber-500 to-amber-400",
    },
    {
      label: "Active Rides",
      value: `${activeRides.length}`,
      icon: <Clock className="h-5 w-5" />,
      color: "from-blue-500 to-blue-400",
    },
  ]

  const quickActions = [
    {
      label: "Active Rides",
      href: "/driver/rides",
      icon: <Car className="h-6 w-6" />,
      description: "See ride requests",
      count: activeRides.length,
    },
    {
      label: "Earnings",
      href: "/driver/earnings",
      icon: <Wallet className="h-6 w-6" />,
      description: "Track your income",
    },
    {
      label: "History",
      href: "/driver/history",
      icon: <Navigation className="h-6 w-6" />,
      description: "Ride history",
    },
    {
      label: "Referrals",
      href: "/driver/referrals",
      icon: <Users className="h-6 w-6" />,
      description: "Invite drivers",
    },
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AnimatedSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header with Online Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Image
                  src="/charter keke.png"
                  alt="Charter Keke"
                  width={24}
                  height={24}
                />
                <span className="text-sm text-primary font-medium">
                  Charter Keke Driver
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                Welcome, {user?.firstName}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Serve Lagos riders with safe and reliable keke transport.
              </p>
            </div>

            <motion.div whileHover={{ scale: 1.02 }}>
              <Card
                className={`p-4 transition-all duration-300 ${isOnline ? "bg-emerald-500/10 border-emerald-500/30" : "bg-card/50 border-primary/10"}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`relative w-3 h-3 rounded-full ${isOnline ? "bg-emerald-500" : "bg-muted-foreground"}`}
                  >
                    {isOnline && (
                      <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </div>
                  <Label
                    htmlFor="online-toggle"
                    className="font-medium text-foreground"
                  >
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
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {stats.map((stat, idx) => (
              <Card key={idx} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div
                      className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} text-white`}
                    >
                      {stat.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Active Rides & Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tabs defaultValue="map" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="map">Live Map</TabsTrigger>
                <TabsTrigger value="rides">
                  Active Rides ({activeRides.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="space-y-4">
                <CharterKeKeMap
                  height="h-96"
                  center={userLocation || [6.5244, 3.3792]}
                  markers={mapMarkers}
                  showRoute={false}
                  showGeolocation={true}
                  onLocationChange={(lat, lng) => setUserLocation([lat, lng])}
                  className="mt-4"
                />
              </TabsContent>

              <TabsContent value="rides" className="space-y-4">
                {activeRides.length === 0 ? (
                  <Card className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No active rides right now. Go online to receive requests!
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {activeRides.map((ride) => (
                      <Card
                        key={ride.id}
                        className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {ride.users?.first_name} {ride.users?.last_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {ride.pickup_zone} → {ride.destination_zone}
                              </span>
                            </div>
                            <p className="text-sm mt-2">
                              Status:{" "}
                              <span className="font-medium capitalize">
                                {ride.status}
                              </span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              ₦{ride.fare_amount}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Earn: ₦{ride.driver_earnings}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, idx) => (
                <Link key={idx} href={action.href}>
                  <Card className="h-full cursor-pointer hover:shadow-md hover:border-primary/50 transition-all">
                    <CardContent className="p-6 text-center">
                      <div className="mb-3 inline-block p-3 rounded-lg bg-primary/10 text-primary">
                        {action.icon}
                      </div>
                      <h3 className="font-semibold">{action.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </p>
                      {action.count !== undefined && (
                        <div className="mt-2 inline-block px-2 py-1 bg-primary/20 text-primary text-xs font-bold rounded">
                          {action.count}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function DriverDashboard() {
  return (
    <ProtectedRoute requiredRole="driver">
      <DriverDashboardContent />
    </ProtectedRoute>
  )
}
