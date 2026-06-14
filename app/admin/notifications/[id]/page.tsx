"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, ExternalLink, Bell, AlertTriangle, XCircle, Info, Clock3, User, Hash, MapPinned } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

function formatDateTime(value?: string | null) {
  if (!value) return "Unknown"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function iconFor(type: string) {
  if (type === "info") return Info
  if (type === "warning") return AlertTriangle
  if (type === "error") return XCircle
  return Bell
}

function valueOrDash(value: unknown) {
  if (value === null || value === undefined || value === "") return "-"
  if (typeof value === "object") return JSON.stringify(value, null, 2)
  return String(value)
}

export default function AdminNotificationDetails() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = useMemo(() => String(params?.id || ""), [params?.id])
  const [notification, setNotification] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/notifications?id=${encodeURIComponent(id)}`, {
          credentials: "include",
          cache: "no-store",
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data?.error || "Failed to load notification")
        setNotification(data.notification || null)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load notification")
        setNotification(null)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [id])

  useEffect(() => {
    if (!notification?.id || notification.read_at) return
    const markRead = async () => {
      try {
        await fetch("/api/admin/notifications", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notification.id }),
        })
      } catch {
        // Non-blocking. We still show the record.
      }
    }
    void markRead()
  }, [notification?.id, notification?.read_at])

  const Icon = notification ? iconFor(notification.type) : Bell

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" asChild>
          <Link href="/admin/notifications">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to notifications
          </Link>
        </Button>
        {notification?.action_url ? (
          <Button asChild>
            <a href={notification.action_url} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Open target
            </a>
          </Button>
        ) : null}
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Loading notification...</CardContent>
        </Card>
      ) : !notification ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Notification not found.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold">{notification.title}</h1>
                    <Badge variant={notification.read_at ? "secondary" : "default"}>{notification.read_at ? "Read" : "Unread"}</Badge>
                    <Badge variant="outline">{notification.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notification.body}</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <DetailRow icon={Hash} label="ID" value={notification.id} />
                <DetailRow icon={User} label="Recipient user" value={notification.recipient_user_id} />
                <DetailRow icon={MapPinned} label="Department" value={notification.recipient_department} />
                <DetailRow icon={Clock3} label="Created" value={formatDateTime(notification.created_at)} />
                <DetailRow icon={Clock3} label="Updated" value={formatDateTime(notification.updated_at)} />
                <DetailRow icon={Clock3} label="Read at" value={formatDateTime(notification.read_at)} />
                <DetailRow icon={Bell} label="Type" value={notification.type} />
                <DetailRow icon={ExternalLink} label="Action URL" value={notification.action_url} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold">Recipient info</h2>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> {notification.recipient_user ? `${notification.recipient_user.first_name || ""} ${notification.recipient_user.last_name || ""}`.trim() || "-" : "-"}</p>
                  <p><span className="text-muted-foreground">Email:</span> {notification.recipient_user?.email || "-"}</p>
                  <p><span className="text-muted-foreground">Role:</span> {notification.recipient_user?.role || "-"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold">Metadata</h2>
                <pre className="max-h-[360px] overflow-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap break-words">
                  {JSON.stringify(notification.metadata || {}, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h2 className="font-semibold">Raw fields</h2>
                <div className="space-y-2 text-sm">
                  {Object.entries(notification).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-[140px_1fr] gap-3">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="break-words whitespace-pre-wrap">{valueOrDash(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: unknown }) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium break-words whitespace-pre-wrap">{valueOrDash(value)}</div>
    </div>
  )
}
