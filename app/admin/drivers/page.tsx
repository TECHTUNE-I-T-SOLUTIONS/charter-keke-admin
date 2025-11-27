"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Car, Search, UserPlus, Filter, Download, CheckCircle, Clock, XCircle } from "lucide-react"

function DriversContent() {
  const [searchQuery, setSearchQuery] = useState("")

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
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold text-emerald-500">0</p>
                  <p className="text-sm text-muted-foreground">Verified</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-amber-500">0</p>
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
                placeholder="Search drivers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-primary/20"
              />
            </div>
            <Button variant="outline" className="border-primary/20 hover:bg-primary/10 bg-transparent">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </motion.div>

          {/* Drivers Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="p-4 rounded-full bg-muted/50 mb-4">
                            <Car className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="font-medium text-foreground mb-1">No drivers yet</h3>
                          <p className="text-sm text-muted-foreground">Drivers will appear here once they register.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function DriversPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DriversContent />
    </ProtectedRoute>
  )
}
