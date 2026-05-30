"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Search, Filter, Clock, CheckCircle, XCircle, Navigation, Loader2, Eye } from "lucide-react"
import { AdminRideDetailsModal } from "@/components/admin-ride-details-modal"

interface Ride {
  id: string
  rider_first_name: string
  rider_last_name: string
  driver_first_name: string
  driver_last_name: string
  pickup_zone: string
  destination_zone: string
  ride_type: string
  estimated_fare: number
  platform_fee: number
  status: string
  created_at: string
  driver_earnings?: number
  distance_km?: number
  duration_minutes?: number
}

function RidesContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [rides, setRides] = useState<Ride[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats")
        if (response.ok) {
          const data = await response.json()
          setStats({
            total: data.rides.active || 0,
            active: data.rides.active || 0,
            completed: 0,
            cancelled: 0,
          })
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      }
    }
    fetchStats()
  }, [])

  // Fetch rides
  useEffect(() => {
    const fetchRides = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (statusFilter !== "all") params.append("status", statusFilter)
        params.append("limit", "50")

        const response = await fetch(`/api/admin/rides?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setRides(data.rides || [])
        }
      } catch (error) {
        console.error("Failed to fetch rides:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchRides()
    }, 300)

    return () => clearTimeout(timer)
  }, [statusFilter])

  const handleViewDetails = (ride: Ride) => {
    setSelectedRide(ride)
    setDetailsModalOpen(true)
  }

  return (
    <div className="flex min-h-screen bg-background">

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0 pb-24">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Ride Management</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage all rides in real-time</p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Rides</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-primary">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active Now</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-emerald-500">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed Today</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-red-500">{stats.cancelled}</p>
                <p className="text-sm text-muted-foreground">Cancelled</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="all">All Rides</TabsTrigger>
                <TabsTrigger value="ongoing" className="hidden sm:inline-flex">
                  <Clock className="h-4 w-4 mr-1" />
                  Active
                </TabsTrigger>
                <TabsTrigger value="completed" className="hidden sm:inline-flex">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="hidden sm:inline-flex">
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancelled
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rides..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full md:w-64 bg-background/50 border-primary/20"
                />
              </div>
              <Button variant="outline" className="border-primary/20 hover:bg-primary/10 bg-transparent hidden sm:inline-flex">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Rides List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4 pb-20 md:pb-0"
          >
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-primary/10">
                        <TableHead>Ride ID</TableHead>
                        <TableHead>Passenger</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Fare</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : rides.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="p-4 rounded-full bg-muted/50 mb-4">
                                <MapPin className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <h3 className="font-medium text-foreground mb-1">No rides found</h3>
                              <p className="text-sm text-muted-foreground">
                                Rides will appear here once bookings start.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        rides.map((ride) => (
                          <TableRow key={ride.id} className="border-primary/10 hover:bg-primary/5 cursor-pointer transition-colors">
                            <TableCell className="font-medium text-sm">{ride.id.slice(0, 8)}</TableCell>
                            <TableCell className="text-sm">
                              {ride.rider_first_name} {ride.rider_last_name}
                            </TableCell>
                            <TableCell className="text-sm">
                              {ride.driver_first_name} {ride.driver_last_name}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {ride.pickup_zone} → {ride.destination_zone}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              ₦{ride.estimated_fare.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  ride.status === "ongoing"
                                    ? "bg-blue-500/20 text-blue-500"
                                    : ride.status === "completed"
                                      ? "bg-emerald-500/20 text-emerald-500"
                                      : ride.status === "cancelled"
                                        ? "bg-red-500/20 text-red-500"
                                        : "bg-gray-500/20 text-gray-500"
                                }`}
                              >
                                {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDetails(ride)}
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="hidden sm:inline">View</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Tablet and Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : rides.length === 0 ? (
                <Card className="bg-card/50 backdrop-blur border-primary/10">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                    <div className="p-4 rounded-full bg-muted/50 mb-4">
                      <MapPin className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-foreground mb-1">No rides found</h3>
                    <p className="text-sm text-muted-foreground">
                      Rides will appear here once bookings start.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                rides.map((ride) => (
                  <Card key={ride.id} className="bg-card/50 backdrop-blur border-primary/10 cursor-pointer hover:bg-card/70 transition-colors" onClick={() => handleViewDetails(ride)}>
                    <CardContent className="p-4 space-y-3">
                      {/* Header with ID and Status */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Ride ID</p>
                          <p className="font-semibold text-sm">{ride.id.slice(0, 12)}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            ride.status === "ongoing"
                              ? "bg-blue-500/20 text-blue-500"
                              : ride.status === "completed"
                                ? "bg-emerald-500/20 text-emerald-500"
                                : ride.status === "cancelled"
                                  ? "bg-red-500/20 text-red-500"
                                  : "bg-gray-500/20 text-gray-500"
                          }`}
                        >
                          {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                        </span>
                      </div>

                      {/* Route */}
                      <div className="space-y-1 border-t border-primary/10 pt-3">
                        <p className="text-xs text-muted-foreground">Route</p>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{ride.pickup_zone}</p>
                            <p className="text-xs text-muted-foreground">Pickup</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 mt-2">
                          <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{ride.destination_zone}</p>
                            <p className="text-xs text-muted-foreground">Destination</p>
                          </div>
                        </div>
                      </div>

                      {/* Passenger & Driver */}
                      <div className="grid grid-cols-2 gap-3 border-t border-primary/10 pt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Passenger</p>
                          <p className="text-sm font-medium">
                            {ride.rider_first_name} {ride.rider_last_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Driver</p>
                          <p className="text-sm font-medium">
                            {ride.driver_first_name} {ride.driver_last_name}
                          </p>
                        </div>
                      </div>

                      {/* Fare & Details */}
                      <div className="grid grid-cols-2 gap-3 border-t border-primary/10 pt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Fare</p>
                          <p className="text-sm font-semibold">₦{ride.estimated_fare.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Type</p>
                          <p className="text-sm font-medium capitalize">{ride.ride_type}</p>
                        </div>
                      </div>

                      {/* View Details Button */}
                      <Button
                        className="w-full mt-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDetails(ride)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Details
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Details Modal */}
      <AdminRideDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        ride={selectedRide}
      /></div>
  )
}

export default function RidesPage() {
  return <RidesContent />
}
