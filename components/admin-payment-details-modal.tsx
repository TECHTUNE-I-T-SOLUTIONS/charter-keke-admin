"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { User, CreditCard, Loader2, Calendar, Zap, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react"

interface PaymentDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentId: string | null
}

interface PaymentDetail {
  id: string
  driverId: string
  driver: {
    firstName: string
    lastName: string
    email: string
    phone: string
    vehicleType: string
    plateName: string
    verified: boolean
    rating: number
    totalRides: number
    totalEarnings: number
  }
  amount: number
  paymentMethod: string
  status: string
  paymentDate: string
  createdAt: string
  settlement: {
    id: string
    date: string
    totalRides: number
    totalEarnings: number
    status: string
  } | null
  relatedRides: Array<{
    id: string
    fare: number
    earnings: number
    status: string
    createdAt: string
    completedAt: string
  }>
}

export function AdminPaymentDetailsModal({ open, onOpenChange, paymentId }: PaymentDetailsModalProps) {
  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open || !paymentId) return

    const fetchPaymentDetails = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/admin/payments/${paymentId}`)
        if (response.ok) {
          const data = await response.json()
          setPayment(data.payment)
        }
      } catch (error) {
        console.error("Failed to fetch payment details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [open, paymentId])

  if (!payment && isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Payment Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!payment) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-500"
      case "pending":
        return "bg-amber-500/20 text-amber-500"
      case "failed":
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-gray-500/20 text-gray-500"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader className="space-y-2 mb-4">
          <DialogTitle className="text-xl md:text-2xl flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Details
          </DialogTitle>
          <DialogDescription className="text-sm">
            Transaction ID: {payment.id.slice(0, 12)}...
          </DialogDescription>
          <div className="pt-2">
            <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full ${getStatusColor(payment.status)}`}>
              {getStatusIcon(payment.status)}
              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
            </span>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* Payment Amount - Prominent */}
          <div className="md:col-span-2">
            <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Payment Amount</p>
                    <p className="text-4xl font-bold text-primary">
                      ₦{payment.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Method</p>
                    <p className="text-lg font-semibold text-foreground">{payment.paymentMethod}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Driver Info */}
          <Card className="bg-card/50 backdrop-blur border-primary/10">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <User className="h-4 w-4" /> Driver
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">
                    {payment.driver.firstName} {payment.driver.lastName}
                    {payment.driver.verified && <CheckCircle className="h-3 w-3 inline ml-1 text-emerald-500" />}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground text-xs">{payment.driver.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{payment.driver.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Info */}
          <Card className="bg-card/50 backdrop-blur border-primary/10">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" /> Vehicle
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium text-foreground">{payment.driver.vehicleType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plate Number</p>
                  <p className="font-medium text-foreground">{payment.driver.plateName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="font-medium text-foreground">{payment.driver.rating.toFixed(1)}⭐</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver Performance Stats */}
          <Card className="bg-card/50 backdrop-blur border-primary/10">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Driver Stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Rides:</span>
                  <span className="font-medium">{payment.driver.totalRides}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Earnings:</span>
                  <span className="font-medium text-primary">
                    ₦{payment.driver.totalEarnings.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Dates */}
          <Card className="bg-card/50 backdrop-blur border-primary/10">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Dates
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-medium text-foreground">
                    {new Date(payment.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Date</p>
                  <p className="font-medium text-foreground">
                    {new Date(payment.paymentDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settlement Info if available */}
          {payment.settlement && (
            <Card className="md:col-span-2 bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-sm">Settlement Information</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Date</p>
                    <p className="font-medium text-foreground">{payment.settlement.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Rides</p>
                    <p className="font-medium text-foreground">{payment.settlement.totalRides}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Earnings</p>
                    <p className="font-medium text-primary">
                      ₦{payment.settlement.totalEarnings.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Rides */}
          {payment.relatedRides && payment.relatedRides.length > 0 && (
            <Card className="md:col-span-2 bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-sm">Recent Related Rides</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {payment.relatedRides.map((ride) => (
                    <div key={ride.id} className="p-2 rounded bg-background/50 hover:bg-background/80 transition">
                      <div className="flex justify-between items-start text-xs gap-2">
                        <div>
                          <p className="font-medium text-foreground">{ride.id.slice(0, 8)}</p>
                          <p className="text-muted-foreground">
                            {new Date(ride.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-primary">₦{ride.earnings.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                          <span className={`inline-block text-xs px-2 py-0.5 rounded ${
                            ride.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : ride.status === 'in_progress'
                                ? 'bg-blue-500/20 text-blue-500'
                                : 'bg-gray-500/20 text-gray-500'
                          }`}>
                            {ride.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
