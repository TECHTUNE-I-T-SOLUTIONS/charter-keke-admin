"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  History,
  Search,
  User,
  Shield,
  Clock,
  ArrowRight,
  Database,
  RefreshCw,
  Sliders,
  FileText
} from "lucide-react"

interface AuditLog {
  id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  changes: any | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  users: {
    first_name: string
    last_name: string
    email: string
    role: string
  } | null
}

export default function CrmLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchLogs = async () => {
    try {
      setLoading(true)
      // Fetch audit logs with admin user details
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          id,
          action,
          entity_type,
          entity_id,
          changes,
          ip_address,
          user_agent,
          created_at,
          users:user_id (
            first_name,
            last_name,
            email,
            role
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error
      setLogs((data as any) || [])
    } catch (error) {
      toast.error("Failed to load operational logs")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchLogs()
  }, [])

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      log.action.toLowerCase().includes(q) ||
      (log.entity_type && log.entity_type.toLowerCase().includes(q)) ||
      (log.users && `${log.users.first_name} ${log.users.last_name}`.toLowerCase().includes(q)) ||
      (log.users?.email && log.users.email.toLowerCase().includes(q))
    );
  })

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto h-full">
      {/* Upper Title Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/5 px-3 py-1 text-xs text-amber-400 backdrop-blur">
            <History className="h-3.5 w-3.5" />
            CRM Security Audit Trail
          </div>
          <h1 className="mt-3 text-3xl font-serif font-bold text-foreground">
            Activity & Event Logs
          </h1>
          <p className="mt-1 text-muted-foreground text-sm max-w-2xl">
            View administrative actions, status transitions, department handoffs, and customer correspondence histories in real time.
          </p>
        </div>

        <Button
          onClick={fetchLogs}
          variant="outline"
          className="border-primary/10 bg-slate-200/60 dark:bg-slate-900/60 dark:hover:bg-slate-900 hover:bg-slate-400 text-foreground gap-2 h-10 px-4"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Audit Logs
        </Button>
      </div>

      {/* Search Input Bar */}
      <Card className="bg-slate-350/40 dark:bg-slate-950/40 border-primary/10 shadow-lg p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, entity type, admin, or email..."
            className="pl-9 bg-slate-200/40 dark:bg-slate-900 border-primary/10 text-sm focus-visible:ring-amber-500"
          />
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Database className="h-3.5 w-3.5 text-amber-500" />
          <span>Active Log Stream: {filteredLogs.length} events resolved</span>
        </div>
      </Card>

      {/* Dynamic Timeline Stream */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mb-2" />
          <p className="text-muted-foreground text-sm">Syncing security trail...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card className="border-dashed border-primary/20 bg-background shadow-lg dark:bg-slate-950/20 py-12 text-center text-muted-foreground text-sm">
          No matching operational logs identified.
        </Card>
      ) : (
        <div className="relative border-l border-primary/10 ml-4 space-y-6">
          {filteredLogs.map((log, idx) => {
            const adminName = log.users ? `${log.users.first_name} ${log.users.last_name}` : "System Trigger"
            const email = log.users?.email || "system@charterkeke.com"
            const role = log.users?.role || "engine"

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.6) }}
                className="relative pl-6 group"
              >
                {/* Bullet Icon */}
                <div className="absolute -left-[11px] top-1.5 h-5.5 w-5.5 rounded-full bg-slate-950 border-2 border-amber-500/80 flex items-center justify-center text-amber-500 shadow-md group-hover:scale-110 transition-transform">
                  {log.entity_type === "support_ticket" ? (
                    <FileText className="h-2.5 w-2.5" />
                  ) : log.entity_type === "admin" ? (
                    <Shield className="h-2.5 w-2.5" />
                  ) : (
                    <Sliders className="h-2.5 w-2.5" />
                  )}
                </div>

                <div className="bg-background dark:bg-slate-950/40 hover:bg-slate-950/65 transition-all p-4 rounded-xl border border-primary/10 shadow-lg space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm group-hover:text-amber-400 transition-colors">
                        {log.action}
                      </span>
                      {log.entity_type && (
                        <span className="bg-primary/5 border border-primary/10 text-muted-foreground px-1.5 py-0.5 rounded text-[10px] font-mono uppercase">
                          {log.entity_type}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-amber-500/80" />
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="h-3.5 w-3.5 text-amber-500/80" />
                      <span className="font-semibold text-foreground">{adminName}</span>
                      <span className="text-muted-foreground">({email})</span>
                      <span className="text-[10px] bg-slate-900 border border-primary/5 text-amber-400 font-bold uppercase tracking-wider px-1 py-0.2 rounded">
                        {role}
                      </span>
                    </div>
                  </div>

                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <div className="p-3 bg-slate-900/60 border border-primary/5 rounded-lg space-y-1 font-mono text-[10.5px] leading-relaxed">
                      <p className="font-sans text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">State Modifications</p>
                      {Object.entries(log.changes).map(([field, change]: any) => {
                        const fromVal = typeof change === "object" ? JSON.stringify(change.from) : change.from
                        const toVal = typeof change === "object" ? JSON.stringify(change.to) : change.to
                        
                        return (
                          <div key={field} className="flex flex-wrap items-center gap-2 py-0.5">
                            <span className="text-amber-400 font-bold">{field}</span>
                            <span className="text-muted-foreground line-through bg-slate-950 px-1 py-0.2 rounded">{String(fromVal ?? "null")}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="text-emerald-400 bg-slate-950 px-1 py-0.2 rounded">{String(toVal ?? "null")}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {log.ip_address && (
                    <p className="text-[10px] text-muted-foreground/60 font-mono">
                      Telemetry: IP {log.ip_address} • User-Agent: {log.user_agent || "Direct API Agent"}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
