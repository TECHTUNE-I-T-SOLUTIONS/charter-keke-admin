"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AdminDriverDetailsModal } from "@/components/admin-driver-details-modal"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Car, Search, UserPlus, Filter, Download, CheckCircle, Clock, XCircle, Loader2, Star, MapPin } from "lucide-react"

interface Driver {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  profile_picture_url: string
  vehicle_type: string
  plate_number: string
  verified: boolean
  avg_rating: number
  rides_completed: number
  earnings: number
}

function DriversContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "pending">("all")
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats")
        if (response.ok) {
          const data = await response.json()
          setStats({
            total: data.drivers.total || 0,
            verified: data.drivers.verified || 0,
            pending: data.drivers.pending || 0,
          })
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      }
    }
    fetchStats()
  }, [])

  // Fetch drivers with search/filter
  useEffect(() => {
    const fetchDrivers = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.append("search", searchQuery)
        if (verifiedFilter === "verified") params.append("verified", "true")
        else if (verifiedFilter === "pending") params.append("verified", "false")
        params.append("limit", "50")

        const response = await fetch(`/api/admin/drivers?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setDrivers(data.drivers || [])
        }
      } catch (error) {
        console.error("Failed to fetch drivers:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchDrivers()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, verifiedFilter])

  return (
    <div className="flex min-h-screen bg-background">

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Driver Management</h1>
              <p className="text-muted-foreground mt-1">Manage drivers and verify documents</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-primary/20 hover:bg-primary/10 bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Driver
              </Button>
            </div>
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
                <p className="text-sm text-muted-foreground">Total Drivers</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold text-emerald-500">{stats.verified}</p>
                  <p className="text-sm text-muted-foreground">Verified</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-500">0</p>
                  <p className="text-sm text-muted-foreground">Suspended</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col md:flex-row gap-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drivers (name, plate number)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-primary/20"
              />
            </div>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value as "all" | "verified" | "pending")}
              className="px-4 py-2 bg-background/50 border border-primary/20 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Drivers</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending Verification</option>
            </select>
            <Button variant="outline" className="border-primary/20 hover:bg-primary/10 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </motion.div>

          {/* Drivers Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-primary/10 hover:bg-transparent">
                        <TableHead>Driver</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rides</TableHead>
                        <TableHead>Earnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : drivers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="p-4 rounded-full bg-muted/50 mb-4">
                                <Car className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <h3 className="font-medium text-foreground mb-1">No drivers found</h3>
                              <p className="text-sm text-muted-foreground">Drivers will appear here once they register.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        drivers.map((driver) => (
                          <TableRow
                            key={driver.id}
                            className="border-primary/10 cursor-pointer hover:bg-primary/5 transition"
                            onClick={() => {
                              setSelectedDriver(driver.id)
                              setDetailsModalOpen(true)
                            }}
                          >
                            <TableCell className="font-medium">
                              {driver.first_name} {driver.last_name}
                            </TableCell>
                            <TableCell className="text-sm">
                              {driver.vehicle_type} - {driver.plate_number}
                            </TableCell>
                            <TableCell className="text-sm">
                              {driver.avg_rating ? driver.avg_rating.toFixed(1) : "N/A"}
                              <span className="text-xs text-muted-foreground ml-1">⭐</span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  driver.verified
                                    ? "bg-emerald-500/20 text-emerald-500"
                                    : "bg-amber-500/20 text-amber-500"
                                }`}
                              >
                                {driver.verified ? "Verified" : "Pending"}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">{driver.rides_completed}</TableCell>
                            <TableCell className="text-sm font-medium">
                              ₦{driver.earnings.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-4 pb-20 md:pb-0">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : drivers.length === 0 ? (
                <Card className="bg-card/50 backdrop-blur border-primary/10">
                  <CardContent className="py-12 text-center">
                    <div className="p-4 rounded-full bg-muted/50 mb-4 w-fit mx-auto">
                      <Car className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-foreground mb-1">No drivers found</h3>
                    <p className="text-sm text-muted-foreground">Drivers will appear here once they register.</p>
                  </CardContent>
                </Card>
              ) : (
                drivers.map((driver) => (
                  <Card
                    key={driver.id}
                    className="bg-card/50 backdrop-blur border-primary/10 cursor-pointer hover:border-primary/30 transition"
                    onClick={() => {
                      setSelectedDriver(driver.id)
                      setDetailsModalOpen(true)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header: Name and Status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">
                              {driver.first_name} {driver.last_name}
                            </h3>
                            <p className="text-xs text-muted-foreground">{driver.vehicle_type}</p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              driver.verified
                                ? "bg-emerald-500/20 text-emerald-500"
                                : "bg-amber-500/20 text-amber-500"
                            }`}
                          >
                            {driver.verified ? "Verified" : "Pending"}
                          </span>
                        </div>

                        {/* Vehicle Info */}
                        <div className="flex items-center gap-2 text-sm">
                          <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">{driver.plate_number}</span>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-primary/10" />

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Rating</p>
                            <p className="font-semibold text-foreground flex items-center gap-1">
                              {driver.avg_rating ? driver.avg_rating.toFixed(1) : "N/A"}
                              <span className="text-yellow-500">⭐</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Rides</p>
                            <p className="font-semibold text-foreground">{driver.rides_completed}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Earnings</p>
                            <p className="font-semibold text-primary">₦{(driver.earnings / 1000).toFixed(0)}K</p>
                          </div>
                        </div>

                        {/* Full Earnings */}
                        <div className="pt-2 border-t border-primary/10">
                          <p className="text-xs text-muted-foreground mb-1">Total Earnings</p>
                          <p className="text-lg font-bold text-primary">
                            ₦{driver.earnings.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </main>{/* Driver Details Modal */}
      <AdminDriverDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        driverId={selectedDriver}
      />
    </div>
  )
}

export default function DriversPage() {
  return <DriversContent />
}
