"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AdminPaymentDetailsModal } from "@/components/admin-payment-details-modal"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Search, Filter, Download, Wallet, ArrowUpRight, ArrowDownLeft, Loader2, Calendar, TrendingUp, AlertCircle } from "lucide-react"

interface Payment {
  id: string
  driver_first_name: string
  driver_last_name: string
  amount: number
  payment_method: string
  status: string
  created_at: string
}

interface DailyPayment {
  date: string
  totalAmount: number
  count: number
  completed: number
  pending: number
  failed: number
  methods: Array<{
    method: string
    count: number
  }>
}

interface PaymentSummary {
  totalPending: number
  totalCompleted: number
  totalFailed: number
  averageDaily: number
}

function PaymentsContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [payments, setPayments] = useState<Payment[]>([])
  const [dailyPayments, setDailyPayments] = useState<DailyPayment[]>([])
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    totalPending: 0,
    totalCompleted: 0,
    totalFailed: 0,
    averageDaily: 0,
  })
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    pendingPayouts: 0,
    totalTransactions: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Fetch stats and revenue
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsResponse, revenueResponse, dailyResponse] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/revenue?limit=1000"),
          fetch("/api/admin/payments/daily"),
        ])

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          const revenueData = revenueResponse.ok ? await revenueResponse.json() : null
          const dailyData = dailyResponse.ok ? await dailyResponse.json() : null

          setStats({
            totalRevenue: revenueData?.summary?.totalFares || statsData.revenue?.total || 0,
            todayRevenue: 0,
            pendingPayouts: revenueData?.summary?.totalDriverEarnings || 0,
            totalTransactions: revenueData?.count || 0,
          })

          if (dailyData) {
            setDailyPayments(dailyData.dailyPayments || [])
            setPaymentSummary(dailyData.summary || {
              totalPending: 0,
              totalCompleted: 0,
              totalFailed: 0,
              averageDaily: 0,
            })
          }
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      }
    }
    fetchStats()
  }, [])

  // Fetch payments
  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (statusFilter !== "all") params.append("status", statusFilter)
        params.append("limit", "50")

        const response = await fetch(`/api/admin/payments?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setPayments(data.payments || [])
        }
      } catch (error) {
        console.error("Failed to fetch payments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchPayments()
    }, 300)

    return () => clearTimeout(timer)
  }, [statusFilter])

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-background">

      <main className="min-w-0 pb-24 pt-16 lg:pl-0 lg:pt-0">
        <div className="mx-auto w-full max-w-[1600px] min-w-0 space-y-6 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0">
              <h1 className="break-words font-serif text-2xl font-bold text-foreground md:text-3xl">Payments</h1>
              <p className="mt-1 break-words text-muted-foreground">Manage transactions and payouts</p>
            </div>
            <Button variant="outline" className="w-full border-primary/20 bg-transparent hover:bg-primary/10 sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Card className="min-w-0 bg-gradient-to-br from-primary to-secondary text-white">
              <CardContent className="p-4">
                <div className="mb-2 flex min-w-0 items-center gap-2">
                  <Wallet className="h-4 w-4 shrink-0" />
                  <span className="text-sm opacity-80">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="min-w-0 border-primary/10 bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="mb-2 flex min-w-0 items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Today</span>
                </div>
                <p className="text-2xl font-bold text-foreground">₦{stats.todayRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="min-w-0 border-primary/10 bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="mb-2 flex min-w-0 items-center gap-2">
                  <ArrowDownLeft className="h-4 w-4 shrink-0 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Pending Payouts</span>
                </div>
                <p className="text-2xl font-bold text-foreground">₦{stats.pendingPayouts.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="min-w-0 border-primary/10 bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="mb-2 flex min-w-0 items-center gap-2">
                  <CreditCard className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm text-muted-foreground">Transactions</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.totalTransactions}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Payments Alert */}
          {paymentSummary.totalPending > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex min-w-0 items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4"
            >
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Pending Payments</h3>
                <p className="break-words text-sm text-amber-800 dark:text-amber-200">
                  {paymentSummary.totalPending} payment{paymentSummary.totalPending !== 1 ? "s" : ""} awaiting processing. Average daily processing: ₦{paymentSummary.averageDaily.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </motion.div>
          )}

          {/* Daily Payments Summary */}
          {dailyPayments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.17 }}
            >
              <div className="mb-4 flex min-w-0 items-center gap-2">
                <TrendingUp className="h-5 w-5 shrink-0 text-primary" />
                <h2 className="break-words text-lg font-semibold text-foreground">Daily Payments Breakdown</h2>
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dailyPayments.slice(0, 6).map((daily, idx) => (
                  <Card key={idx} className="min-w-0 border-primary/10 bg-card/50 backdrop-blur transition hover:border-primary/20">
                    <CardContent className="p-4">
                      <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-center gap-2">
                          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="break-words text-sm font-semibold">{daily.date}</span>
                        </div>
                        <div className="min-w-0 sm:text-right">
                          <p className="break-words text-xl font-bold text-primary sm:text-2xl">
                            ₦{daily.totalAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs border-t border-primary/10 pt-3">
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-bold text-foreground">{daily.count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-emerald-600 dark:text-emerald-400">Completed</p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">{daily.completed}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-amber-600 dark:text-amber-400">Pending</p>
                          <p className="font-bold text-amber-600 dark:text-amber-400">{daily.pending}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <div className="mb-4 flex min-w-0 flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="w-full overflow-x-auto pb-1 md:w-auto">
                  <TabsList className="min-w-max bg-muted/50">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="failed">Failed</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border-primary/20 bg-background/50 pl-10 sm:w-64"
                    />
                  </div>
                  <Button variant="outline" className="border-primary/20 hover:bg-primary/10 bg-transparent">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <TabsContent value={statusFilter}>
                <Card className="min-w-0 overflow-hidden border-primary/10 bg-card/50 backdrop-blur">
                  <CardContent className="p-0">
                    <div className="hidden overflow-x-auto md:block">
                    <Table className="min-w-[760px]">
                      <TableHeader>
                        <TableRow className="border-primary/10">
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
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
                        ) : payments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6}>
                              <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="p-4 rounded-full bg-muted/50 mb-4">
                                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-medium text-foreground mb-1">No transactions found</h3>
                                <p className="text-sm text-muted-foreground">
                                  Transactions will appear here once payments start.
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          payments.map((payment) => (
                            <TableRow
                              key={payment.id}
                              className="border-primary/10 cursor-pointer hover:bg-primary/5 transition"
                              onClick={() => {
                                setSelectedPaymentId(payment.id)
                                setShowPaymentModal(true)
                              }}
                            >
                              <TableCell className="font-medium text-sm">{payment.id.slice(0, 8)}</TableCell>
                              <TableCell className="text-sm">
                                {payment.driver_first_name} {payment.driver_last_name}
                              </TableCell>
                              <TableCell className="text-sm">{payment.payment_method}</TableCell>
                              <TableCell className="text-sm font-medium">
                                ₦{payment.amount.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    payment.status === "completed"
                                      ? "bg-emerald-500/20 text-emerald-500"
                                      : payment.status === "pending"
                                        ? "bg-amber-500/20 text-amber-500"
                                        : "bg-red-500/20 text-red-500"
                                  }`}
                                >
                                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(payment.created_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    </div>
                    <div className="space-y-3 p-3 md:hidden">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : payments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <div className="mb-4 rounded-full bg-muted/50 p-4">
                            <CreditCard className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="mb-1 font-medium text-foreground">No transactions found</h3>
                          <p className="text-sm text-muted-foreground">Transactions will appear here once payments start.</p>
                        </div>
                      ) : (
                        payments.map((payment) => (
                          <button
                            key={payment.id}
                            type="button"
                            className="w-full rounded-lg border border-primary/10 bg-background/60 p-4 text-left transition hover:border-primary/30 hover:bg-primary/5"
                            onClick={() => {
                              setSelectedPaymentId(payment.id)
                              setShowPaymentModal(true)
                            }}
                          >
                            <div className="flex min-w-0 items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="break-words text-sm font-semibold text-foreground">
                                  {payment.driver_first_name} {payment.driver_last_name}
                                </p>
                                <p className="mt-1 break-all text-xs text-muted-foreground">#{payment.id}</p>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                                  payment.status === "completed"
                                    ? "bg-emerald-500/20 text-emerald-500"
                                    : payment.status === "pending"
                                      ? "bg-amber-500/20 text-amber-500"
                                      : "bg-red-500/20 text-red-500"
                                }`}
                              >
                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                              </span>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Method</p>
                                <p className="break-words font-medium text-foreground">{payment.payment_method}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Amount</p>
                                <p className="break-words font-semibold text-primary">₦{payment.amount.toLocaleString()}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-xs text-muted-foreground">Date</p>
                                <p className="text-foreground">{new Date(payment.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main><AdminPaymentDetailsModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        paymentId={selectedPaymentId}
      />
    </div>
  )
}

export default function PaymentsPage() {
  return <PaymentsContent />
}
