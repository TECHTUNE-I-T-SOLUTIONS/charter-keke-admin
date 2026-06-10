"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { AlertTriangle, CheckCircle2, Loader2, MapPin, Phone, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

type SosAlert = {
  id: string
  user_name?: string | null
  user_role?: string | null
  user_email?: string | null
  user_phone?: string | null
  status: string
  latitude?: number | null
  longitude?: number | null
  full_address?: string | null
  active_ride_id?: string | null
  active_ride_status?: string | null
  active_ride_note?: string | null
  driver_name?: string | null
  driver_phone?: string | null
  device_name?: string | null
  device_brand?: string | null
  device_model?: string | null
  os_name?: string | null
  os_version?: string | null
  created_at: string
}

export default function AdminSosPage() {
  const [alerts, setAlerts] = useState<SosAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const summary = useMemo(
    () => ({
      open: alerts.filter((alert) => alert.status === "open").length,
      acknowledged: alerts.filter((alert) => alert.status === "acknowledged").length,
      resolved: alerts.filter((alert) => alert.status === "resolved").length,
    }),
    [alerts]
  )

  const loadAlerts = async () => {
    try {
      const response = await fetch("/api/admin/sos", { cache: "no-store", credentials: "include" })
      const result = await response.json()
      if (!response.ok) throw new Error(result?.error || "Failed to load SOS alerts")
      setAlerts(result.alerts || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load SOS alerts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAlerts()
    const channel = supabase
      .channel("admin-sos-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, () => {
        void loadAlerts()
      })
      .subscribe()

    const interval = setInterval(() => void loadAlerts(), 15000)
    return () => {
      clearInterval(interval)
      void supabase.removeChannel(channel)
    }
  }, [])

  const updateStatus = async (alertId: string, status: string) => {
    try {
      setUpdatingId(alertId)
      const response = await fetch("/api/admin/sos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ alertId, status }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result?.error || "Failed to update SOS alert")
      setAlerts((current) => current.map((alert) => (alert.id === alertId ? result.alert : alert)))
      toast.success("SOS alert updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update SOS alert")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <main className="min-h-screen pt-16 lg:pt-0 pb-24">
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Safety console</p>
            <h1 className="font-serif text-3xl font-bold text-foreground">SOS Alerts</h1>
            <p className="mt-1 text-muted-foreground">Realtime emergency signals from riders and drivers.</p>
          </div>
          <Button onClick={() => void loadAlerts()} variant="outline">Refresh</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Metric title="Open" value={summary.open} icon={<ShieldAlert className="h-5 w-5" />} tone="text-red-500" />
          <Metric title="Acknowledged" value={summary.acknowledged} icon={<AlertTriangle className="h-5 w-5" />} tone="text-amber-500" />
          <Metric title="Resolved" value={summary.resolved} icon={<CheckCircle2 className="h-5 w-5" />} tone="text-emerald-500" />
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading SOS alerts...
          </div>
        ) : (
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="border-primary/10">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="flex flex-wrap items-center gap-2">
                      {alert.user_name || "Unknown user"}
                      <Badge variant={alert.status === "open" ? "destructive" : "outline"}>{alert.status.replace(/_/g, " ")}</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {alert.user_role || "user"} • {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {alert.status === "open" ? (
                      <Button size="sm" onClick={() => updateStatus(alert.id, "acknowledged")} disabled={updatingId === alert.id}>Acknowledge</Button>
                    ) : null}
                    {alert.status !== "resolved" ? (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(alert.id, "resolved")} disabled={updatingId === alert.id}>Resolve</Button>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-3">
                    <Info icon={<MapPin className="h-4 w-4" />} label="Location" value={alert.full_address || "Address unavailable"} />
                    {alert.latitude && alert.longitude ? (
                      <a className="text-sm font-medium text-primary hover:underline" href={`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`} target="_blank" rel="noreferrer">
                        Open map coordinates
                      </a>
                    ) : null}
                    <Info label="Ride context" value={alert.active_ride_id ? `${alert.active_ride_note || "Active ride"} (${alert.active_ride_status})` : "No active ride found"} />
                    <Info label="Driver" value={alert.driver_name ? `${alert.driver_name}${alert.driver_phone ? ` • ${alert.driver_phone}` : ""}` : "No assigned driver"} />
                  </div>
                  <div className="space-y-3 rounded-lg bg-muted/40 p-4">
                    <Info icon={<Phone className="h-4 w-4" />} label="User contact" value={[alert.user_phone, alert.user_email].filter(Boolean).join(" • ") || "No contact"} />
                    <Info label="Device" value={[alert.device_name, alert.device_brand, alert.device_model].filter(Boolean).join(" • ") || "Unknown device"} />
                    <Info label="OS" value={[alert.os_name, alert.os_version].filter(Boolean).join(" ") || "Unknown OS"} />
                  </div>
                </CardContent>
              </Card>
            ))}
            {!alerts.length ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">No SOS alerts yet.</CardContent>
              </Card>
            ) : null}
          </div>
        )}
      </div>
    </main>
  )
}

function Metric({ title, value, icon, tone }: { title: string; value: number; icon: React.ReactNode; tone: string }) {
  return (
    <Card className="border-primary/10">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-black">{value}</p>
        </div>
        <div className={tone}>{icon}</div>
      </CardContent>
    </Card>
  )
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="break-words text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
