"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Lock,
  Unlock,
} from "lucide-react"

interface Settlement {
  id: string
  settlement_date: string
  total_rides: number
  total_platform_fees: number
  settlement_status: "pending" | "paid" | "overdue"
  payment_due_date: string
  paid_at: string | null
}

interface Payment {
  id: string
  amount: number
  payment_method: string
  status: string
  payment_date: string
  payment_reference: string
  confirmed_at: string | null
}

export default function DriverPaymentsPage() {
  const { data: session } = useSession()
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [totalPending, setTotalPending] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [selectedSettlements, setSelectedSettlements] = useState<string[]>([])
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!session?.user) return

    const fetchPaymentStatus = async () => {
      try {
        const response = await fetch(
          `/api/driver/payment-status?driver_id=${(session?.user as any)?.id}`
        )
        const data = await response.json()

        if (isMountedRef.current) {
          setSettlements(data.settlements || [])
          setPayments(data.payments || [])
          setTotalPending(data.totalPending || 0)
        }
      } catch (error) {
        console.error("Error fetching payment status:", error)
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    fetchPaymentStatus()
  }, [session?.user])

  const handleInitiatePayment = async () => {
    if (!selectedSettlements.length) {
      alert("Please select at least one settlement to pay")
      return
    }

    const amount = settlements
      .filter((s) => selectedSettlements.includes(s.id))
      .reduce((sum, s) => sum + s.total_platform_fees, 0)

    setProcessingPayment(true)

    try {
      const response = await fetch("/api/driver/initiate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: (session?.user as any)?.id,
          settlementIds: selectedSettlements,
          amount,
        }),
      })

      const data = await response.json()

      if (data.success && data.authUrl) {
        // Redirect to Paystack payment
        window.location.href = data.authUrl
      } else {
        alert("Failed to initiate payment: " + data.error)
      }
    } catch (error) {
      console.error("Error initiating payment:", error)
      alert("Failed to initiate payment")
    } finally {
      setProcessingPayment(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      case "overdue":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const pendingSettlements = settlements.filter((s) => s.settlement_status === "pending")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Payment Management
          </h1>
          <p className="text-gray-600">
            Track your daily settlements and payment history
          </p>
        </div>

        {/* Total Pending Card */}
        {totalPending > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      Total Amount Due
                    </h2>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      ₦{totalPending.toLocaleString("en-NG")}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Pay before {new Date(Math.max(...pendingSettlements.map((s) => new Date(s.payment_due_date).getTime()))).toLocaleDateString()} to avoid penalty
                    </p>
                  </div>
                  <Button
                    onClick={handleInitiatePayment}
                    disabled={!pendingSettlements.length || processingPayment}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {processingPayment ? "Processing..." : "Pay Now"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pending">
              Pending ({pendingSettlements.length})
            </TabsTrigger>
            <TabsTrigger value="paid">
              Paid ({settlements.filter((s) => s.settlement_status === "paid").length})
            </TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>

          {/* Pending Settlements */}
          <TabsContent value="pending" className="space-y-4">
            {pendingSettlements.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-600">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <p>No pending settlements! All fees are paid.</p>
                </CardContent>
              </Card>
            ) : (
              pendingSettlements.map((settlement) => (
                <motion.div
                  key={settlement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Settlement for {new Date(settlement.settlement_date).toLocaleDateString()}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {settlement.total_rides} rides completed
                          </p>
                        </div>
                        <Badge className={getStatusColor(settlement.settlement_status)}>
                          {getStatusIcon(settlement.settlement_status)}
                          <span className="ml-2">{settlement.settlement_status.toUpperCase()}</span>
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-y">
                        <div>
                          <p className="text-sm text-gray-600">Platform Fees</p>
                          <p className="text-lg font-semibold text-gray-900">
                            ₦{settlement.total_platform_fees.toLocaleString("en-NG")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Due Date</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {new Date(settlement.payment_due_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedSettlements.includes(settlement.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSettlements([
                                ...selectedSettlements,
                                settlement.id,
                              ])
                            } else {
                              setSelectedSettlements(
                                selectedSettlements.filter((id) => id !== settlement.id)
                              )
                            }
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <label className="text-sm text-gray-600">
                          Include in payment
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Paid Settlements */}
          <TabsContent value="paid" className="space-y-4">
            {settlements.filter((s) => s.settlement_status === "paid").length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-600">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p>No paid settlements yet</p>
                </CardContent>
              </Card>
            ) : (
              settlements
                .filter((s) => s.settlement_status === "paid")
                .map((settlement) => (
                  <motion.div
                    key={settlement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              Settlement for {new Date(settlement.settlement_date).toLocaleDateString()}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Paid on {settlement.paid_at ? new Date(settlement.paid_at).toLocaleDateString() : "N/A"}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            PAID
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4 py-4 border-t">
                          <div>
                            <p className="text-sm text-gray-600">Platform Fees</p>
                            <p className="text-lg font-semibold text-green-600">
                              ₦{settlement.total_platform_fees.toLocaleString("en-NG")}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Rides</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {settlement.total_rides}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
            )}
          </TabsContent>

          {/* Payment History */}
          <TabsContent value="history" className="space-y-4">
            {payments.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-600">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p>No payment history yet</p>
                </CardContent>
              </Card>
            ) : (
              payments.map((payment) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {payment.payment_method === "paystack"
                              ? "Paystack Payment"
                              : "Bank Transfer"}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          className={
                            payment.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : payment.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {payment.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-4 border-y mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Amount</p>
                          <p className="text-lg font-semibold text-gray-900">
                            ₦{payment.amount.toLocaleString("en-NG")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Reference</p>
                          <p className="text-sm font-mono text-gray-600 break-all">
                            {payment.payment_reference}
                          </p>
                        </div>
                      </div>

                      {payment.status === "completed" && (
                        <p className="text-sm text-green-600">
                          ✓ Confirmed on {payment.confirmed_at ? new Date(payment.confirmed_at).toLocaleDateString() : "N/A"}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
