"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Search, Filter, Clock, CheckCircle, XCircle, Navigation } from "lucide-react"

function RidesContent() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
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
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Total Rides</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground">Active Now</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-emerald-500">0</p>
                <p className="text-sm text-muted-foreground">Completed Today</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-red-500">0</p>
                <p className="text-sm text-muted-foreground">Cancelled</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Map Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-0 h-64">
                <div className="h-full rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                  <div className="text-center">
                    <Navigation className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Live map with active rides coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs & Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Tabs defaultValue="all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="all">All Rides</TabsTrigger>
                  <TabsTrigger value="active">
                    <Clock className="h-4 w-4 mr-1" />
                    Active
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Completed
                  </TabsTrigger>
                  <TabsTrigger value="cancelled">
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancelled
                  </TabsTrigger>
                </TabsList>

                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search rides..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 bg-background/50 border-primary/20"
                    />
                  </div>
                  <Button variant="outline" className="border-primary/20 hover:bg-primary/10 bg-transparent">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <TabsContent value="all">
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
                        <TableRow>
                          <TableCell colSpan={7}>
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="p-4 rounded-full bg-muted/50 mb-4">
                                <MapPin className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <h3 className="font-medium text-foreground mb-1">No rides yet</h3>
                              <p className="text-sm text-muted-foreground">
                                Rides will appear here once bookings start.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function RidesPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <RidesContent />
    </ProtectedRoute>
  )
}
