"use client"

import { useEffect, useMemo, useState } from "react"
import { Archive, Download, Loader2, Search, ShieldAlert, UserX, Users } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type DeletedAccount = {
  id: string
  original_user_id: string
  role: string | null
  previous_status: string | null
  masked_email: string | null
  masked_phone: string | null
  email_hash: string | null
  phone_hash: string | null
  account_created_at: string | null
  deleted_at: string
  deletion_reason: string | null
  metadata?: Record<string, unknown> | null
}

type Stats = {
  total: number
  riders: number
  drivers: number
  admins: number
}

function formatDate(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString()
}

function downloadCsv(rows: DeletedAccount[]) {
  const headers = ["Original User ID", "Role", "Previous Status", "Masked Email", "Masked Phone", "Deleted At", "Reason"]
  const csvRows = rows.map((row) => [
    row.original_user_id,
    row.role || "",
    row.previous_status || "",
    row.masked_email || "",
    row.masked_phone || "",
    row.deleted_at || "",
    row.deletion_reason || "",
  ])
  const csv = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "charter-keke-deleted-accounts.csv"
  link.click()
  URL.revokeObjectURL(url)
}

export default function DeletedAccountsPage() {
  const [rows, setRows] = useState<DeletedAccount[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, riders: 0, drivers: 0, admins: 0 })
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("all")
  const [loading, setLoading] = useState(true)
  const [purging, setPurging] = useState(false)
  const [migrationRequired, setMigrationRequired] = useState(false)

  const loadDeletedAccounts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: "200" })
      if (search.trim()) params.set("search", search.trim())
      if (role !== "all") params.set("role", role)

      const response = await fetch(`/api/admin/deleted-accounts?${params}`, {
        credentials: "include",
        cache: "no-store",
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || "Failed to load deleted accounts")

      setRows(data.deletedAccounts || [])
      setStats(data.stats || { total: 0, riders: 0, drivers: 0, admins: 0 })
      setMigrationRequired(Boolean(data.migrationRequired))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load deleted accounts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadDeletedAccounts, 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role])

  const purgeDeletedUsers = async () => {
    setPurging(true)
    try {
      const response = await fetch("/api/admin/deleted-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "purge_deleted_users", limit: 200 }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Failed to purge deleted users")
      toast.success(`Purged ${data.purged?.length || 0} deleted user row(s)`, {
        description: data.blocked?.length ? `${data.blocked.length} row(s) are still blocked by related records.` : undefined,
      })
      await loadDeletedAccounts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to purge deleted users")
    } finally {
      setPurging(false)
    }
  }

  const cards = useMemo(() => [
    { label: "Deleted accounts", value: stats.total, icon: UserX, tone: "text-primary" },
    { label: "Riders", value: stats.riders, icon: Users, tone: "text-emerald-500" },
    { label: "Drivers", value: stats.drivers, icon: Archive, tone: "text-amber-500" },
    { label: "Admins", value: stats.admins, icon: ShieldAlert, tone: "text-red-500" },
  ], [stats])

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-background pb-24">
      <main className="min-w-0 pt-16 lg:pt-0">
        <div className="mx-auto w-full max-w-[1500px] min-w-0 space-y-6 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary">
                <Archive className="h-4 w-4" />
                HR Records
              </div>
              <h1 className="mt-4 break-words text-2xl font-bold md:text-3xl">Deleted Accounts</h1>
              <p className="mt-2 max-w-2xl break-words text-sm text-muted-foreground">
                Audit permanently deleted rider, driver, and admin accounts. Contact details are masked and hashed so deleted users are not reachable from this ledger.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
              <Button variant="outline" className="border-primary/20 bg-transparent" onClick={purgeDeletedUsers} disabled={purging}>
                {purging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}
                Purge User Rows
              </Button>
              <Button variant="outline" className="border-primary/20 bg-transparent" onClick={() => downloadCsv(rows)} disabled={!rows.length}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {migrationRequired ? (
            <Card className="border-amber-500/30 bg-amber-500/10">
              <CardContent className="p-4 text-sm text-amber-700 dark:text-amber-200">
                Run the account deletion hardening SQL migration first. The deleted accounts ledger table is not available yet.
              </CardContent>
            </Card>
          ) : null}

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.label} className="min-w-0 border-primary/10 bg-card/50">
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className={`break-words text-2xl font-bold ${card.tone}`}>{card.value}</p>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                    </div>
                    <Icon className={`h-6 w-6 shrink-0 ${card.tone}`} />
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="min-w-0 border-primary/10 bg-card/50">
            <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-lg">Deletion Ledger</CardTitle>
              <div className="flex min-w-0 flex-col gap-3 md:w-[560px] md:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search masked contact, user id, or hash..."
                    className="pl-10"
                  />
                </div>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  aria-label="Filter deleted accounts by role"
                >
                  <option value="all">All roles</option>
                  <option value="user">Riders</option>
                  <option value="driver">Drivers</option>
                  <option value="admin">Admins</option>
                  <option value="super_admin">Super admins</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading deleted accounts...
                </div>
              ) : rows.length ? (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <Table className="min-w-[920px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Previous Status</TableHead>
                          <TableHead>Deleted</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>
                              <div className="max-w-[340px] space-y-1">
                                <p className="break-all font-medium">{row.masked_email || "No email"}</p>
                                <p className="break-all text-xs text-muted-foreground">{row.masked_phone || "No phone"}</p>
                                <p className="break-all text-xs text-muted-foreground">User ID: {row.original_user_id}</p>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{row.role || "unknown"}</Badge></TableCell>
                            <TableCell>{row.previous_status || "-"}</TableCell>
                            <TableCell>{formatDate(row.deleted_at)}</TableCell>
                            <TableCell>{row.deletion_reason || "user_requested"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-3 p-3 md:hidden">
                    {rows.map((row) => (
                      <Card key={row.id} className="border-primary/10">
                        <CardContent className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-all font-semibold">{row.masked_email || "No email"}</p>
                              <p className="break-all text-sm text-muted-foreground">{row.masked_phone || "No phone"}</p>
                            </div>
                            <Badge variant="outline" className="shrink-0">{row.role || "unknown"}</Badge>
                          </div>
                          <div className="grid gap-2 text-sm">
                            <p className="break-all"><span className="text-muted-foreground">User ID:</span> {row.original_user_id}</p>
                            <p><span className="text-muted-foreground">Previous status:</span> {row.previous_status || "-"}</p>
                            <p><span className="text-muted-foreground">Deleted:</span> {formatDate(row.deleted_at)}</p>
                            <p><span className="text-muted-foreground">Reason:</span> {row.deletion_reason || "user_requested"}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">No deleted accounts found.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
