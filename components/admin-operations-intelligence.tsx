"use client"

import { useEffect, useMemo, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AdminBottomNavigation } from "@/components/admin-bottom-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Activity,
  AlertTriangle,
  Car,
  CreditCard,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react"

type PageKind = "operations" | "locations" | "drivers" | "mobile" | "moderation"

const pageCopy: Record<PageKind, { title: string; subtitle: string }> = {
  operations: {
    title: "Operations Command",
    subtitle: "Live overview of demand, fulfilment, revenue, driver readiness, and risk.",
  },
  locations: {
    title: "Location Intelligence",
    subtitle: "Pickup, destination, and corridor performance across the last 30 days.",
  },
  drivers: {
    title: "Driver Intelligence",
    subtitle: "Driver acceptance, completion, activity, verification, and moderation queues.",
  },
  mobile: {
    title: "Mobile Traffic",
    subtitle: "App activity signals from rides, push subscriptions, and usage trends.",
  },
  moderation: {
    title: "Moderation Center",
    subtitle: "Operational issues needing admin review: drivers, settlements, and CRM queues.",
  },
}

const formatCurrency = (value: number) => `₦${Number(value || 0).toLocaleString("en-US")}`

function MetricCard({ label, value, note, icon: Icon }: any) {
  return (
    <Card className="border-primary/10 bg-card shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/12 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
      </CardContent>
    </Card>
  )
}

function RankedTable({ title, rows, columns }: { title: string; rows: any[]; columns: { key: string; label: string; format?: (value: any, row: any) => string }[] }) {
  return (
    <Card className="border-primary/10 bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              {columns.map((column) => (
                <th key={column.key} className="px-2 py-2 font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, index) => (
              <tr key={`${row.id || row.name}-${index}`} className="border-b border-border/60 last:border-0">
                {columns.map((column) => (
                  <td key={column.key} className="px-2 py-3">
                    {column.format ? column.format(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} className="px-2 py-8 text-center text-muted-foreground">
                  No data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

function ChartCard({ title, data, dataKey, color = "var(--primary)" }: { title: string; data: any[]; dataKey: string; color?: string }) {
  return (
    <Card className="border-primary/10 bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={76} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function OperationsIntelligenceContent({ page }: { page: PageKind }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await fetch("/api/admin/operations-intelligence", { cache: "no-store" })
      const next = await response.json()
      if (!response.ok) throw new Error(next.error || "Failed to load intelligence")
      setData(next)
    } catch (err: any) {
      setError(err?.message || "Failed to load intelligence")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const summary = data?.summary || {}
  const daily = data?.mobile?.daily || []
  const title = pageCopy[page]

  const primaryTables = useMemo(() => {
    if (!data) return null

    if (page === "locations") {
      return (
        <>
          <ChartCard title="Top Pickup Demand" data={data.demand.pickup.slice(0, 8)} dataKey="bookings" />
          <ChartCard title="Low Acceptance Pickup Areas" data={data.demand.lowAcceptance.slice(0, 8)} dataKey="nonAcceptanceRate" color="#111111" />
          <RankedTable
            title="Pickup Areas"
            rows={data.demand.pickup}
            columns={[
              { key: "name", label: "Pickup" },
              { key: "bookings", label: "Bookings" },
              { key: "accepted", label: "Accepted" },
              { key: "nonAcceptanceRate", label: "Not accepted", format: (v) => `${v}%` },
              { key: "revenue", label: "Gross", format: formatCurrency },
            ]}
          />
          <RankedTable
            title="Top Corridors"
            rows={data.demand.corridors}
            columns={[
              { key: "name", label: "Route" },
              { key: "bookings", label: "Bookings" },
              { key: "acceptanceRate", label: "Accepted", format: (v) => `${v}%` },
              { key: "revenue", label: "Gross", format: formatCurrency },
            ]}
          />
        </>
      )
    }

    if (page === "drivers") {
      return (
        <>
          <ChartCard title="Top Drivers by Accepted Rides" data={data.drivers.topAccepted.slice(0, 8)} dataKey="accepted" />
          <RankedTable
            title="Driver Performance"
            rows={data.drivers.topAccepted}
            columns={[
              { key: "name", label: "Driver" },
              { key: "status", label: "Status" },
              { key: "accepted", label: "Accepted" },
              { key: "completed", label: "Completed" },
              { key: "completionRate", label: "Completion", format: (v) => `${v}%` },
              { key: "revenue", label: "Earnings", format: formatCurrency },
            ]}
          />
          <RankedTable
            title="Needs Review"
            rows={data.drivers.needsReview}
            columns={[
              { key: "name", label: "Driver" },
              { key: "plateNumber", label: "Plate" },
              { key: "verified", label: "Verified", format: (v) => (v ? "Yes" : "No") },
              { key: "rating", label: "Rating" },
              { key: "completionRate", label: "Completion", format: (v) => `${v}%` },
            ]}
          />
        </>
      )
    }

    if (page === "mobile") {
      return (
        <>
          <ChartCard title="Active Devices by Platform" data={data.mobile.devicesByPlatform} dataKey="devices" />
          <Card className="border-primary/10 bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Daily Mobile Activity Proxy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="bookings" stroke="#f28c00" fill="#f28c0033" />
                    <Area type="monotone" dataKey="accepted" stroke="#111111" fill="#1111111f" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )
    }

    if (page === "moderation") {
      return (
        <>
          <ChartCard title="CRM Tickets by Status" data={data.moderation.ticketsByStatus} dataKey="count" />
          <RankedTable
            title="Pending Driver Verification"
            rows={data.moderation.pendingDrivers}
            columns={[
              { key: "name", label: "Driver" },
              { key: "plateNumber", label: "Plate" },
              { key: "status", label: "Availability" },
              { key: "lastSeen", label: "Last activity", format: (v) => (v ? new Date(v).toLocaleString() : "N/A") },
            ]}
          />
          <RankedTable
            title="Overdue Remittances"
            rows={data.moderation.overdueSettlements}
            columns={[
              { key: "driver_id", label: "Driver ID" },
              { key: "settlement_date", label: "Date" },
              { key: "total_platform_fees", label: "Due", format: formatCurrency },
              { key: "payment_due_date", label: "Due date", format: (v) => (v ? new Date(v).toLocaleDateString() : "N/A") },
            ]}
          />
        </>
      )
    }

    return (
      <>
        <ChartCard title="Top Pickup Demand" data={data.demand.pickup.slice(0, 8)} dataKey="bookings" />
        <ChartCard title="Driver Acceptance Leaders" data={data.drivers.topAccepted.slice(0, 8)} dataKey="accepted" color="#111111" />
        <RankedTable
          title="Operational Hotspots"
          rows={data.demand.lowAcceptance}
          columns={[
            { key: "name", label: "Area" },
            { key: "bookings", label: "Bookings" },
            { key: "accepted", label: "Accepted" },
            { key: "nonAcceptanceRate", label: "Not accepted", format: (v) => `${v}%` },
            { key: "platformFees", label: "Platform fees", format: formatCurrency },
          ]}
        />
      </>
    )
  }, [data, daily, page])

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 pt-16 lg:pt-0">
        <div className="space-y-6 p-4 md:p-6 lg:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Charter Keke Admin
              </div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">{title.title}</h1>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{title.subtitle}</p>
            </div>
            <Button onClick={loadData} variant="outline" className="gap-2 border-primary/20">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Card className="border-destructive/20 bg-card">
              <CardContent className="flex items-center gap-3 p-6 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {error}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="30-day bookings" value={summary.rides || 0} note={`${summary.acceptanceRate || 0}% accepted`} icon={MapPin} />
                <MetricCard label="Active drivers" value={summary.activeDrivers || 0} note={`${summary.verifiedDrivers || 0} verified drivers`} icon={Car} />
                <MetricCard label="Platform fees" value={formatCurrency(summary.platformFees || 0)} note={`${formatCurrency(summary.grossRevenue || 0)} gross ride value`} icon={CreditCard} />
                <MetricCard label="Active devices" value={summary.activeDevices || 0} note={`${summary.openTickets || 0} open support tickets`} icon={Smartphone} />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="border-primary/10 bg-card shadow-sm">
                  <CardContent className="flex items-center gap-3 p-4">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">Fulfilment health</p>
                      <p className="text-xs text-muted-foreground">{summary.completedRides || 0} completed, {summary.cancelledRides || 0} cancelled</p>
                    </div>
                    <Badge className="ml-auto bg-primary text-primary-foreground">{summary.cancellationRate || 0}% cancelled</Badge>
                  </CardContent>
                </Card>
                <Card className="border-primary/10 bg-card shadow-sm">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">Marketplace size</p>
                      <p className="text-xs text-muted-foreground">{summary.riders || 0} riders, {summary.drivers || 0} drivers</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-primary/10 bg-card shadow-sm">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Activity className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">Remittance risk</p>
                      <p className="text-xs text-muted-foreground">{summary.overdueSettlements || 0} overdue, {formatCurrency(summary.overdueAmount || 0)} due</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">{primaryTables}</div>
            </>
          )}
        </div>
      </main>
      <AdminBottomNavigation />
    </div>
  )
}

export function AdminOperationsIntelligence({ page }: { page: PageKind }) {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <OperationsIntelligenceContent page={page} />
    </ProtectedRoute>
  )
}
