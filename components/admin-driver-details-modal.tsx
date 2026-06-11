"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { User, Car, Star, CheckCircle, Loader2, TrendingUp, Calendar, AlertCircle, FileCheck, ShieldCheck } from "lucide-react"

interface DriverDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  driverId: string | null
}

interface EarningPerDay {
  date: string
  amount: number
  rides: number
  status: string
}

interface DriverDetail {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  profile_picture_url: string
  vehicle_type: string
  plate_number: string
  operating_zones: string[]
  union_name: string
  bank_name: string
  bank_account_number: string
  account_name: string
  emergency_contact: string
  vehicle_picture_url: string
  license_picture_url: string
  verified: boolean
  avg_rating: number
  rides_completed: number
  total_earnings: number
  created_at: string
  settlement_count: number
  earnings_per_day: EarningPerDay[]
}

interface DriverSettlement {
  id: string
  settlement_date: string
  total_rides: number
  total_platform_fees: number
  total_driver_earnings: number
  settlement_status: "pending" | "paid" | "overdue"
  payment_due_date: string
  paid_at: string | null
}

export function AdminDriverDetailsModal({ open, onOpenChange, driverId }: DriverDetailsModalProps) {
  const [driver, setDriver] = useState<DriverDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [timeFilter, setTimeFilter] = useState<"all" | "month">("all")
  const [earningsPage, setEarningsPage] = useState(0)
  const [settlementStatus, setSettlementStatus] = useState<"pending" | "paid" | "overdue" | "none" | null>(null)
  const [settlementSummary, setSettlementSummary] = useState<any>(null)
  const [settlements, setSettlements] = useState<DriverSettlement[]>([])
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [showConfirmDeactivate, setShowConfirmDeactivate] = useState(false)

  const EARNINGS_PER_PAGE = 5

  useEffect(() => {
    if (!open || !driverId) return

    const fetchDriverDetails = async () => {
      setIsLoading(true)
      setEarningsPage(0)
      try {
        const [detailsResponse, settlementResponse] = await Promise.all([
          fetch(`/api/admin/drivers/${driverId}`),
          fetch(`/api/admin/drivers/${driverId}/settlements`),
        ])

        if (detailsResponse.ok) {
          const data = await detailsResponse.json()
          setDriver(data.driver)
        }

        if (settlementResponse.ok) {
          const settlement = await settlementResponse.json()
          setSettlementStatus(settlement.status)
          setSettlementSummary(settlement.summary || null)
          setSettlements(settlement.settlements || [])
        }
      } catch (error) {
        console.error("Failed to fetch driver details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDriverDetails()
  }, [open, driverId])

  if (!driver && isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Driver Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!driver) return null

  const totalEarnings = driver.earnings_per_day.reduce((sum, day) => sum + day.amount, 0)

  // Filter earnings based on time filter
  const filteredEarnings = timeFilter === "month"
    ? driver.earnings_per_day.filter(earning => {
        const earnDate = new Date(earning.date)
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return earnDate >= thirtyDaysAgo
      })
    : driver.earnings_per_day

  const filteredTotal = filteredEarnings.reduce((sum, day) => sum + day.amount, 0)

  // Pagination
  const totalPages = Math.ceil(filteredEarnings.length / EARNINGS_PER_PAGE)
  const paginatedEarnings = filteredEarnings.slice(
    earningsPage * EARNINGS_PER_PAGE,
    (earningsPage + 1) * EARNINGS_PER_PAGE
  )

  const handleDeactivateDriver = async () => {
    if (!driverId) return
    
    setIsDeactivating(true)
    try {
      const response = await fetch(`/api/admin/drivers/${driverId}/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      
      if (response.ok) {
        // Refresh settlement status
        const settlementRes = await fetch(`/api/admin/drivers/${driverId}/settlements`)
        if (settlementRes.ok) {
          const settlement = await settlementRes.json()
          setSettlementStatus(settlement.status)
        }
        setShowConfirmDeactivate(false)
      }
    } catch (error) {
      console.error("Failed to deactivate driver:", error)
    } finally {
      setIsDeactivating(false)
    }
  }

  const handleApproveDriver = async () => {
    if (!driverId) return

    setIsApproving(true)
    try {
      const response = await fetch(`/api/admin/drivers/${driverId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Failed to approve driver")
      setDriver((current) => (current ? { ...current, verified: true } : current))
    } catch (error) {
      console.error("Failed to approve driver:", error)
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[92dvh] overflow-y-auto p-4 md:p-6">
          <DialogHeader className="space-y-2 mb-2">
            <DialogTitle className="text-xl md:text-2xl flex items-center gap-2 flex-wrap">
              {driver.first_name} {driver.last_name}
              {driver.verified && <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {driver.verified ? "Verified" : "Pending"} • {driver.vehicle_type} • {driver.plate_number}
            </DialogDescription>
            {settlementStatus && (
              <div className="pt-1">
                <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                  settlementStatus === 'paid' || settlementStatus === 'none'
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : settlementStatus === 'overdue'
                      ? 'bg-red-500/20 text-red-500'
                    : 'bg-amber-500/20 text-amber-500'
                }`}>
                  Settlement: {settlementStatus.charAt(0).toUpperCase() + settlementStatus.slice(1)}
                </span>
              </div>
            )}
            {!driver.verified && (
              <button
                onClick={handleApproveDriver}
                disabled={isApproving}
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Approve Driver
              </button>
            )}
          </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* Personal Info - Compact */}
          <div className="space-y-2">
            {/* Profile Card */}
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-3">
                <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
                  <User className="h-3 w-3" /> Personal
                </h3>
                <div className="space-y-1 text-xs">
                  <p className="font-medium text-foreground">{driver.email}</p>
                  <p className="text-muted-foreground">{driver.phone_number}</p>
                  <p className="text-muted-foreground">
                    {new Date(driver.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Stats - Compact */}
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-3">
                <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
                  <Star className="h-3 w-3" /> Performance
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating:</span>
                    <span className="font-medium">{driver.avg_rating.toFixed(1)}⭐</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rides:</span>
                    <span className="font-medium">{driver.rides_completed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-3">
                <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
                  <FileCheck className="h-3 w-3" /> Credentials
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      className={`rounded-md border p-2 ${driver.license_picture_url ? "text-primary hover:bg-primary/10" : "pointer-events-none text-muted-foreground opacity-60"}`}
                      href={driver.license_picture_url || "#"}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Driver license
                    </a>
                    <a
                      className={`rounded-md border p-2 ${driver.vehicle_picture_url ? "text-primary hover:bg-primary/10" : "pointer-events-none text-muted-foreground opacity-60"}`}
                      href={driver.vehicle_picture_url || "#"}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Vehicle photo
                    </a>
                  </div>
                  <div className="rounded-md bg-background/50 p-2">
                    <p><span className="text-muted-foreground">Union:</span> {driver.union_name || "Not provided"}</p>
                    <p><span className="text-muted-foreground">Zones:</span> {driver.operating_zones?.length ? driver.operating_zones.join(", ") : "Not provided"}</p>
                    <p><span className="text-muted-foreground">Bank:</span> {driver.bank_name || "Not provided"}</p>
                    <p><span className="text-muted-foreground">Account:</span> {driver.account_name || "Not provided"} {driver.bank_account_number ? `(${driver.bank_account_number})` : ""}</p>
                    <p><span className="text-muted-foreground">Emergency:</span> {driver.emergency_contact || "Not provided"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settlement Details */}
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-3">
                <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Settlements
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <p className="text-muted-foreground">Due</p>
                    <p className="font-semibold text-amber-600">
                      ₦{Number(settlementSummary?.totalDue || 0).toLocaleString("en-US")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Paid</p>
                    <p className="font-semibold text-emerald-600">
                      ₦{Number(settlementSummary?.totalPaid || 0).toLocaleString("en-US")}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {settlements.length > 0 ? settlements.slice(0, 6).map((settlement) => (
                    <div key={settlement.id} className="border-b border-primary/10 pb-2 last:border-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {new Date(settlement.settlement_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          settlement.settlement_status === "paid"
                            ? "bg-emerald-500/20 text-emerald-600"
                            : settlement.settlement_status === "overdue"
                              ? "bg-red-500/20 text-red-600"
                              : "bg-amber-500/20 text-amber-600"
                        }`}>
                          {settlement.settlement_status}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                        <span>{Number(settlement.total_rides || 0)} rides</span>
                        <span>Fee ₦{Number(settlement.total_platform_fees || 0).toLocaleString("en-US")}</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground">No settlement records yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Earnings Section */}
          <div className="space-y-2">
            {/* Total Earnings */}
            <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <h3 className="font-semibold text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Total Earnings
                  </h3>
                  <div className="flex gap-1 text-xs">
                    <button
                      onClick={() => {
                        setTimeFilter("all")
                        setEarningsPage(0)
                      }}
                      className={`px-1.5 py-0.5 rounded text-xs transition ${
                        timeFilter === "all"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setTimeFilter("month")
                        setEarningsPage(0)
                      }}
                      className={`px-1.5 py-0.5 rounded text-xs transition ${
                        timeFilter === "month"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      30d
                    </button>
                  </div>
                </div>
                <p className="text-2xl font-bold text-primary">
                  ₦{filteredTotal.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Accepted & completed rides</p>
              </CardContent>
            </Card>

            {/* Earnings Per Day with Pagination */}
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-3">
                <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Daily Earnings
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {paginatedEarnings.length > 0 ? (
                    paginatedEarnings.map((earning, idx) => (
                      <div key={idx} className="p-2 rounded bg-background/50 hover:bg-background/80 transition">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-foreground">{earning.date}</span>
                          <span className="text-primary font-medium">
                            ₦{earning.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{earning.rides} ride{earning.rides !== 1 ? 's' : ''}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-xs text-muted-foreground">No data</p>
                    </div>
                  )}
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-primary/10">
                    <button
                      disabled={earningsPage === 0}
                      onClick={() => setEarningsPage(Math.max(0, earningsPage - 1))}
                      className="text-xs px-2 py-1 rounded bg-background/50 hover:bg-background/80 disabled:opacity-50"
                    >
                      ←
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {earningsPage + 1} / {totalPages}
                    </span>
                    <button
                      disabled={earningsPage >= totalPages - 1}
                      onClick={() => setEarningsPage(Math.min(totalPages - 1, earningsPage + 1))}
                      className="text-xs px-2 py-1 rounded bg-background/50 hover:bg-background/80 disabled:opacity-50"
                    >
                      →
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-3">
                <h3 className="font-semibold mb-2 text-sm">{timeFilter === "all" ? "All" : "30d"} Summary</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Days:</span>
                    <span className="font-medium">{filteredEarnings.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg/Day:</span>
                    <span className="font-medium text-primary">
                      ₦{filteredEarnings.length > 0 ? (filteredTotal / filteredEarnings.length).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Rides:</span>
                    <span className="font-medium">{filteredEarnings.reduce((sum, day) => sum + day.rides, 0)}</span>
                  </div>
                  {settlementStatus === "pending" && (
                    <button
                      onClick={() => setShowConfirmDeactivate(true)}
                      disabled={isDeactivating}
                      className="w-full mt-2 px-2 py-1 text-xs bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded transition disabled:opacity-50"
                    >
                      {isDeactivating ? "Deactivating..." : "Deactivate Driver"}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Deactivation Confirmation Dialog */}
    <AlertDialog open={showConfirmDeactivate} onOpenChange={setShowConfirmDeactivate}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Deactivate Driver
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will suspend <span className="font-semibold">{driver.first_name} {driver.last_name}</span> from accepting new rides until their settlement is paid. This action can be reversed after payment.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeactivateDriver}
            disabled={isDeactivating}
            className="bg-red-500 hover:bg-red-600"
          >
            {isDeactivating ? "Deactivating..." : "Deactivate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
