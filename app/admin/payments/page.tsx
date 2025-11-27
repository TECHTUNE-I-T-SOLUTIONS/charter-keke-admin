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
import { CreditCard, Search, Filter, Download, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react"

function PaymentsContent() {
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
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Payments</h1>
              <p className="text-muted-foreground mt-1">Manage transactions and payouts</p>
            </div>
            <Button variant="outline" className="border-primary/20 hover:bg-primary/10 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Card className="bg-gradient-to-br from-primary to-secondary text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm opacity-80">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold">₦0</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Today</span>
                </div>
                <p className="text-2xl font-bold text-foreground">₦0</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownLeft className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Pending Payouts</span>
                </div>
                <p className="text-2xl font-bold text-foreground">₦0</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Transactions</span>
                </div>
                <p className="text-2xl font-bold text-foreground">0</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tabs defaultValue="all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="topups">Top-ups</TabsTrigger>
                  <TabsTrigger value="rides">Ride Payments</TabsTrigger>
                  <TabsTrigger value="payouts">Payouts</TabsTrigger>
                </TabsList>

                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
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
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="p-4 rounded-full bg-muted/50 mb-4">
                                <CreditCard className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <h3 className="font-medium text-foreground mb-1">No transactions yet</h3>
                              <p className="text-sm text-muted-foreground">
                                Transactions will appear here once payments start.
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

export default function PaymentsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <PaymentsContent />
    </ProtectedRoute>
  )
}
