"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/protected-route"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader, TrendingUp, Calendar, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function DriverEarnings() {
  const { data: session } = useSession()
  const [earnings, setEarnings] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState("month")

  useEffect(() => {
    if (!session?.user) return

    const fetchEarnings = async () => {
      try {
        const response = await fetch(
          `/api/driver/earnings?timeframe=${timeframe}`
        )
        const data = await response.json()
        setEarnings(data.earnings)
        setTransactions(data.transactions || [])
      } catch (error) {
        console.error("Failed to fetch earnings:", error)
        toast.error("Failed to load earnings")
      } finally {
        setLoading(false)
      }
    }

    fetchEarnings()
  }, [session?.user, timeframe])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <AnimatedSidebar />

        <main className="flex-1 lg:pl-0 pt-16 lg:pt-0 pb-24 lg:pb-0">
          <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Earnings</h1>
              <p className="text-muted-foreground mt-2">Track your income</p>
            </div>

            {/* Earnings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">
                        Net Earnings This {timeframe}
                      </p>
                      <p className="text-3xl font-bold mt-2">
                        ₦{(earnings?.driver_net_amount || 0).toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">
                        Gross Earnings
                      </p>
                      <p className="text-3xl font-bold mt-2">
                        ₦{(earnings?.total_ride_earnings || 0).toLocaleString()}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Completed Rides
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {earnings?.total_rides_accepted || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Platform Fee (13%): ₦{(earnings?.total_platform_fee || 0).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Time Period Selector */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Filter by Period</h2>
              <Tabs defaultValue="month" onValueChange={setTimeframe}>
                <TabsList className="grid w-full max-w-md grid-cols-5">
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="year">Year</TabsTrigger>
                  <TabsTrigger value="all">All Time</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Transactions */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>

              {transactions.length === 0 ? (
                <Card className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No transactions yet</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold capitalize">
                            {transaction.source}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold text-lg ${transaction.transaction_type === "credit" ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {transaction.transaction_type === "credit"
                              ? "+"
                              : "-"}
                            ₦{transaction.amount}
                          </p>
                          <Badge
                            variant={
                              transaction.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
