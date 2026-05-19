"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Mail,
  RefreshCw,
  Inbox,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Link,
  ChevronRight
} from "lucide-react"

interface EmailAccount {
  id: string
  display_name: string
  email_address: string
  provider: string
  is_active: boolean
  last_synced_at: string | null
  created_at: string
}

export default function CrmEmailsPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("crm_email_accounts")
        .select("id, display_name, email_address, provider, is_active, last_synced_at, created_at")
        .order("created_at", { ascending: true })

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      toast.error("Failed to load email configurations")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchAccounts()
  }, [])

  const triggerSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    const toastId = toast.loading("Connecting to support servers & syncing messages...")
    
    try {
      const response = await fetch("/api/admin/crm/email/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 15, runOutbound: true }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Sync failed")

      toast.success("Synchronized successfully!", { id: toastId })
      setSyncResult(data)
      void fetchAccounts() // Refresh last_synced_at timestamp
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Synchronization failed", { id: toastId })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto h-full">
      {/* Upper Title Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/5 px-3 py-1 text-xs text-amber-400 backdrop-blur">
            <Mail className="h-3.5 w-3.5" />
            Connected Support Mailboxes
          </div>
          <h1 className="mt-3 text-3xl font-serif font-bold text-foreground">
            Email Configurations
          </h1>
          <p className="mt-1 text-muted-foreground text-sm max-w-2xl">
            Manage linked operational email accounts, trigger real-time IMAP mailbox ingestion, and verify connected alias routing logic.
          </p>
        </div>

        <Button
          onClick={triggerSync}
          disabled={syncing}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-md shadow-amber-500/10 gap-2 h-11 px-5"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing Mailboxes..." : "Sync Inboxes Now"}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
        {/* Left Side: Accounts List and Sync Results */}
        <div className="space-y-6">
          {/* Linked Inboxes Card */}
          <Card className="bg-background dark:g-slate-950/40 backdrop-blur-md border-primary/10 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-200 to-yellow-200 dark:bg-gradient-to-r dark:from-amber-500/80 dark:to-yellow-600/30" />
            <CardHeader className="pb-3 border-b border-primary/5">
              <CardTitle className="text-lg font-semibold">Active Mailboxes</CardTitle>
              <CardDescription>Accounts scanned periodically by the automated ticket ingest parser.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
                </div>
              ) : accounts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No active IMAP mailboxes configured in database. General routing applies.
                </div>
              ) : (
                <div className="divide-y divide-primary/5">
                  {accounts.map((account) => (
                    <div key={account.id} className="p-4 flex items-center justify-between gap-4 hover:bg-primary/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                          <Inbox className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{account.display_name}</p>
                          <p className="text-xs text-muted-foreground">{account.email_address}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div className="hidden sm:block">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3 text-amber-500/80" />
                            Last Synced
                          </p>
                          <p className="text-xs text-foreground mt-0.5">
                            {account.last_synced_at ? new Date(account.last_synced_at).toLocaleString() : "Never"}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-bold tracking-wider">
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sync Results Telemetry */}
          <AnimatePresence>
            {syncResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-4"
              >
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Latest Ingestion Sync Log
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="bg-emerald-200 dark:bg-emerald-500/5 border-emerald-500/20">
                    <CardContent className="p-4 flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-emerald-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Synced</p>
                        <p className="text-2xl font-bold text-emerald-400">{syncResult.inbound?.syncedCount ?? 0}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-amber-200 dark:bg-amber-500/5 border-amber-500/20">
                    <CardContent className="p-4 flex items-center gap-3">
                      <HelpCircle className="h-8 w-8 text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Skipped / Duplicated</p>
                        <p className="text-2xl font-bold text-amber-400">{syncResult.inbound?.skippedCount ?? 0}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-rose-100 dark:bg-rose-500/5 border-rose-500/20">
                    <CardContent className="p-4 flex items-center gap-3">
                      <AlertTriangle className="h-8 w-8 text-rose-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Failed</p>
                        <p className="text-2xl font-bold text-rose-400">{syncResult.inbound?.failedCount ?? 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Details list of synced/skipped messages */}
                {(syncResult.inbound?.synced?.length > 0 || syncResult.inbound?.skipped?.length > 0) && (
                  <Card className="bg-slate-200/40 dark:bg-slate-950/40 border-primary/10 p-4">
                    <CardTitle className="text-sm font-semibold mb-3">Sync Operation Details</CardTitle>
                    <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 font-mono text-[11px] leading-relaxed">
                      {syncResult.inbound?.synced?.map((item: any, idx: number) => (
                        <div key={idx} className="text-emerald-400 flex items-start gap-2 bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                          <span className="font-bold flex-shrink-0">[SYNCED]</span>
                          <span className="truncate">UID {item.uid}: Created support ticket ID {item.ticketId}</span>
                        </div>
                      ))}
                      {syncResult.inbound?.skipped?.map((item: any, idx: number) => (
                        <div key={idx} className="text-amber-400 flex items-start gap-2 bg-amber-500/5 p-2 rounded border border-amber-500/10">
                          <span className="font-bold flex-shrink-0">[SKIPPED]</span>
                          <span className="truncate">UID {item.uid}: {item.reason}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Alias Reference Panel */}
        <div className="space-y-6">
          <Card className="bg-background dark:bg-slate-950/40 backdrop-blur-md border-primary/10 shadow-xl overflow-hidden relative">
            <CardHeader className="pb-3 border-b border-primary/5">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-amber-400">
                <Link className="h-4.5 w-4.5" />
                Namecheap SMTP/IMAP
              </CardTitle>
              <CardDescription>Official Lagos customer operations email forwarding architecture.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs leading-relaxed text-muted-foreground">
              <p>
                Lagos customer support operations utilize a consolidated inbound forwarding strategy on Namecheap Private Email hosting:
              </p>
              
              <div className="space-y-2">
                {[
                  { alias: "billing@", target: "support@", dept: "Billing" },
                  { alias: "safety@", target: "support@", dept: "Trust & Safety" },
                  { alias: "operations@", target: "support@", dept: "Operations" },
                  { alias: "riders@", target: "support@", dept: "Rider Management" },
                ].map((row, idx) => (
                  <div key={idx} className="bg-slate-200 dark:bg-slate-900 border border-primary/5 p-2 rounded flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-foreground font-mono">{row.alias}</span>
                      <span className="text-[10px] block text-muted-foreground">Routes to {row.dept}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <span className="font-bold text-foreground font-mono">{row.target}</span>
                      <span className="text-[10px] block text-primary">Unified Inbox</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-primary/5 p-3 border border-primary/10 text-foreground space-y-1">
                <p className="font-bold text-xs text-primary dark:text-amber-500">Auto-Routing Logic</p>
                <p className="text-[11px] leading-normal text-muted-foreground">
                  The parser reads the envelope headers to resolve the target forwarding alias (`billing@`, `safety@`, etc.), resolving and routing the ticket to the correct department queue instantly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
