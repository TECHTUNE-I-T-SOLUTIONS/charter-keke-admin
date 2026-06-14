"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertTriangle, Bell, Filter, Info, MapPin, RefreshCcw, Search, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const TYPE_LABELS: Record<string, string> = {
  admin_event: "Admin Event",
  info: "Info",
  warning: "Warning",
  error: "Error",
  crm: "CRM",
}

const PAGE_SIZE = 40

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

function stringifyMetadata(metadata: any) {
  if (!metadata) return ""
  if (typeof metadata === "string") return metadata
  try {
    return JSON.stringify(metadata)
  } catch {
    return ""
  }
}

function normalizeText(value: unknown) {
  return String(value || "").toLowerCase()
}

export default function AdminNotifications() {
  const router = useRouter()
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const requestIdRef = useRef(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<{ cursorCreatedAt: string; cursorId: string } | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [readFilter, setReadFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")

  const fetchPage = async ({ append }: { append: boolean }) => {
    const requestId = ++requestIdRef.current
    try {
      if (append) setLoadingMore(true)
      else setLoading(true)

      const searchParams = new URLSearchParams({ limit: String(PAGE_SIZE) })
      if (search.trim()) searchParams.set("q", search.trim())
      if (typeFilter !== "all") searchParams.set("type", typeFilter)
      if (readFilter !== "all") searchParams.set("read", readFilter)
      if (departmentFilter !== "all") searchParams.set("department", departmentFilter)
      if (append && cursor) {
        searchParams.set("cursorCreatedAt", cursor.cursorCreatedAt)
        searchParams.set("cursorId", cursor.cursorId)
      }

      const response = await fetch(`/api/admin/notifications?${searchParams.toString()}`, {
        credentials: "include",
        cache: "no-store",
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Failed to load notifications")
      if (requestId !== requestIdRef.current) return

      const nextItems = Array.isArray(data.notifications) ? data.notifications : []
      setNotifications((current) => (append ? [...current, ...nextItems] : nextItems))
      setCursor(data.nextCursor || null)
      setHasMore(Boolean(data.hasMore))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load notifications")
      if (!append) setNotifications([])
      setHasMore(false)
      setCursor(null)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setCursor(null)
      setHasMore(true)
      void fetchPage({ append: false })
    }, 250)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, readFilter, departmentFilter])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting || loading || loadingMore || !hasMore || !cursor) return
        void fetchPage({ append: true })
      },
      { rootMargin: "400px 0px" }
    )

    const target = loadMoreRef.current
    if (target) observer.observe(target)

    return () => observer.disconnect()
  }, [loading, loadingMore, hasMore, cursor])

  const enriched = useMemo(() => {
    return notifications.map((notification) => {
      const recipientName = notification.recipient_user
        ? [notification.recipient_user.first_name, notification.recipient_user.last_name].filter(Boolean).join(" ")
        : ""
      const searchable = [
        notification.title,
        notification.body,
        notification.type,
        notification.recipient_department,
        notification.action_url,
        recipientName,
        notification.recipient_user?.email,
        stringifyMetadata(notification.metadata),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return {
        ...notification,
        recipientName,
        searchable,
        isRead: Boolean(notification.read_at),
      }
    })
  }, [notifications])

  const stats = useMemo(() => {
    return {
      total: enriched.length,
      unread: enriched.filter((item) => !item.isRead).length,
      routed: enriched.filter((item) => Boolean(item.action_url)).length,
    }
  }, [enriched])

  const uniqueTypes = useMemo(() => Array.from(new Set(enriched.map((item) => item.type).filter(Boolean))).sort(), [enriched])
  const uniqueDepartments = useMemo(
    () => Array.from(new Set(enriched.map((item) => item.recipient_department).filter(Boolean))).sort(),
    [enriched]
  )

  const openNotification = (notification: any) => {
    router.push(`/admin/notifications/${notification.id}`)
  }

  const handleRefresh = () => {
    setCursor(null)
    setHasMore(true)
    void fetchPage({ append: false })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Browse admin notifications as they load, then jump to the related page.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Loaded {stats.total}</Badge>
          <Badge variant="outline">Unread {stats.unread}</Badge>
          <Badge variant="outline">Linked {stats.routed}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, body, metadata, recipient..."
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>{TYPE_LABELS[type] || type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Read state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {uniqueDepartments.map((department) => (
                  <SelectItem key={department} value={department}>{department}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>New notifications load as you scroll. Search and filters reset the stream.</span>
          </div>
        </CardContent>
      </Card>

      {loading && notifications.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Loading notifications...</CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">No notifications matched the current filters.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {enriched.map((notification) => {
            const Icon = iconFor(notification.type)
            return (
              <Card
                key={notification.id}
                className={`cursor-pointer border transition-colors hover:border-primary/50 ${notification.isRead ? "opacity-85" : "border-primary/30"}`}
                onClick={() => openNotification(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{notification.title}</h3>
                          <Badge variant={notification.isRead ? "secondary" : "default"}>{notification.isRead ? "Read" : "Unread"}</Badge>
                          <Badge variant="outline">{TYPE_LABELS[notification.type] || notification.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{notification.body}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {notification.recipient_department ? <span>Department: {notification.recipient_department}</span> : null}
                          {notification.recipientName ? <span>Recipient: {notification.recipientName}</span> : null}
                          {notification.recipient_user?.email ? <span>Email: {notification.recipient_user.email}</span> : null}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>Created {formatDateTime(notification.created_at)}</span>
                          <span>Updated {formatDateTime(notification.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {notification.action_url ? <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" /> Routed</Badge> : null}
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openNotification(notification) }}>
                        View details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <div ref={loadMoreRef} className="flex items-center justify-center py-4 text-sm text-muted-foreground">
            {loadingMore ? "Loading more notifications..." : hasMore ? "Scroll to load more" : "You’ve reached the end"}
          </div>
        </div>
      )}
    </div>
  )
}
