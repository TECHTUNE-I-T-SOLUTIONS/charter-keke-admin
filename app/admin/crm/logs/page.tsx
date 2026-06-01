"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ArrowRight, Clock, Database, ExternalLink, FileText, History, Mail, MessageSquare, RefreshCw, Search, Shield, StickyNote, User } from "lucide-react"

type CrmLog = {
  id: string
  eventId: string
  action: string
  entityType: string
  entityId?: string | null
  ticketId?: string | null
  summary: string
  details?: Record<string, unknown>
  actor?: { name?: string; email?: string; role?: string } | null
  actionUrl?: string
  createdAt: string
  source: string
}

function iconFor(source: string) {
  if (source === "internal_note") return StickyNote
  if (source === "ticket_message") return MessageSquare
  if (source === "email") return Mail
  if (source === "audit") return Shield
  return FileText
}

export default function CrmLogsPage() {
  const [logs, setLogs] = useState<CrmLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedLog, setSelectedLog] = useState<CrmLog | null>(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/crm/logs?limit=180", { credentials: "include", cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Failed to load CRM logs")
      setLogs(data.logs || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load CRM logs")
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return logs
    return logs.filter((log) => (
      log.action.toLowerCase().includes(q) ||
      log.entityType.toLowerCase().includes(q) ||
      log.summary.toLowerCase().includes(q) ||
      log.actor?.name?.toLowerCase().includes(q) ||
      log.actor?.email?.toLowerCase().includes(q) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(q)
    ))
  }, [logs, search])

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/5 px-3 py-1 text-xs text-amber-500 backdrop-blur">
            <History className="h-3.5 w-3.5" />
            CRM Activity Trail
          </div>
          <h1 className="mt-3 text-3xl font-serif font-bold text-foreground">Activity & Event Logs</h1>
          <p className="mt-1 text-muted-foreground text-sm max-w-2xl">
            Internal notes, ticket replies, routing changes, email events, and audit records are merged into one clickable trail.
          </p>
        </div>

        <Button onClick={fetchLogs} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Logs
        </Button>
      </div>

      <Card className="border-primary/10 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes, ticket IDs, admins, emails, status..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Database className="h-3.5 w-3.5 text-amber-500" />
            <span>{filteredLogs.length} events</span>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mb-2" />
          <p className="text-muted-foreground text-sm">Loading CRM activity...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card className="border-dashed border-primary/20 py-12 text-center text-muted-foreground text-sm">
          No CRM activity matched this filter.
        </Card>
      ) : (
        <div className="relative border-l border-primary/10 ml-4 space-y-5">
          {filteredLogs.map((log, index) => {
            const Icon = iconFor(log.source)
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.5) }}
                className="relative pl-6"
              >
                <div className="absolute -left-[11px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-amber-500/80 bg-background text-amber-500">
                  <Icon className="h-2.5 w-2.5" />
                </div>

                <Card className="transition hover:border-amber-500/40 hover:shadow-md">
                  <CardContent className="p-4 space-y-3">
                    <button type="button" onClick={() => setSelectedLog(log)} className="w-full text-left">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{log.action}</p>
                            <Badge variant="outline">{log.entityType}</Badge>
                            <Badge variant="secondary">{log.source.replace(/_/g, " ")}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{log.summary || "No summary available"}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </button>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-semibold text-foreground">{log.actor?.name || "System"}</span>
                        {log.actor?.email ? <span>({log.actor.email})</span> : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedLog(log)}>
                          Details
                        </Button>
                        {log.actionUrl ? (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={log.actionUrl}>
                              Open
                              <ExternalLink className="ml-2 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[92dvh] overflow-hidden p-0">
          <DialogHeader className="border-b px-5 py-4 md:px-6">
            <DialogTitle className="pr-8">{selectedLog?.action || "Activity details"}</DialogTitle>
            <DialogDescription>{selectedLog?.summary}</DialogDescription>
          </DialogHeader>
          {selectedLog ? (
            <div className="space-y-4 overflow-y-auto px-5 py-4 text-sm md:px-6" style={{ maxHeight: "calc(92dvh - 96px)" }}>
              <div className="grid gap-2 rounded-lg border p-3">
                <p>Entity: <span className="font-semibold">{selectedLog.entityType}</span></p>
                <p>Event ID: <span className="font-mono text-xs">{selectedLog.eventId}</span></p>
                {selectedLog.ticketId ? <p>Ticket ID: <span className="font-mono text-xs">{selectedLog.ticketId}</span></p> : null}
                <p>Time: {new Date(selectedLog.createdAt).toLocaleString()}</p>
                <p>Actor: {selectedLog.actor?.name || "System"} {selectedLog.actor?.email ? `(${selectedLog.actor.email})` : ""}</p>
              </div>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-xs">{JSON.stringify(selectedLog.details || {}, null, 2)}</pre>
              {selectedLog.actionUrl ? (
                <Button asChild>
                  <Link href={selectedLog.actionUrl}>
                    Open Related Record
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
