"use client"

import { motion } from "framer-motion"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Calendar } from "lucide-react"

function RideHistoryContent() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Ride History</h1>
            <p className="text-muted-foreground mt-1">View all your past rides and earnings</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  All Rides
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed
                </TabsTrigger>
                <TabsTrigger
                  value="cancelled"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancelled
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <Card className="bg-card/50 backdrop-blur border-primary/10">
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="p-4 rounded-full bg-muted/50 mb-4">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-foreground mb-1">No ride history</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Your completed rides will appear here. Start driving to build your history!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                <Card className="bg-card/50 backdrop-blur border-primary/10">
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="p-4 rounded-full bg-muted/50 mb-4">
                        <CheckCircle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-foreground mb-1">No completed rides</h3>
                      <p className="text-sm text-muted-foreground">Completed rides will appear here.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cancelled" className="mt-6">
                <Card className="bg-card/50 backdrop-blur border-primary/10">
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="p-4 rounded-full bg-muted/50 mb-4">
                        <XCircle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-foreground mb-1">No cancelled rides</h3>
                      <p className="text-sm text-muted-foreground">Cancelled rides will appear here.</p>
                    </div>
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

export default function RideHistoryPage() {
  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <RideHistoryContent />
    </ProtectedRoute>
  )
}
