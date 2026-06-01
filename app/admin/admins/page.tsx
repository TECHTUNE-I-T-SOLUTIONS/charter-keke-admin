"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Mail, Phone, Shield, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type AdminRow = {
  id: string
  user_id: string
  admin_level: string
  department: string
  crm_enabled: boolean
  permissions?: Record<string, unknown>
  created_at?: string
  updated_at?: string
  users?: {
    id?: string
    first_name?: string
    last_name?: string
    email?: string
    phone_number?: string
    role?: string
    status?: string
  }
}

const departments = [
  "general",
  "support",
  "operations",
  "billing",
  "finance",
  "technical",
  "engineering",
  "product",
  "trust_safety",
  "rider_management",
  "driver_management",
  "hr",
]

const adminLevels = [
  { value: "support", label: "Support Admin" },
  { value: "ops", label: "Operations Admin" },
  { value: "finance", label: "Finance Admin" },
  { value: "super", label: "Superadmin" },
]

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  adminLevel: "support",
  department: "support",
  crmEnabled: true,
}

function label(value?: string | null) {
  return String(value || "general").replace(/_/g, " ")
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  const headers = Object.keys(rows[0] || { empty: "" })
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [reviewMessage, setReviewMessage] = useState("")
  const [isReviewing, setIsReviewing] = useState(false)

  const fetchAdmins = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/admins", { credentials: "include", cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Failed to load admins")
      setAdmins(data.admins || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load admins")
      setAdmins([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const stats = useMemo(() => ({
    total: admins.length,
    super: admins.filter((admin) => ["super", "super_admin", "super-admin", "superadmin"].includes(admin.admin_level)).length,
    crm: admins.filter((admin) => admin.crm_enabled).length,
  }), [admins])

  const handleCreateAdmin = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Failed to create admin")
      toast.success("Admin created")
      setIsCreateOpen(false)
      setForm(emptyForm)
      await fetchAdmins()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create admin")
    } finally {
      setIsSaving(false)
    }
  }

  const updateReviewStatus = async (reviewStatus: "approved" | "rejected" | "pending_review") => {
    if (!selectedAdmin) return
    setIsReviewing(true)
    try {
      const response = await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          adminId: selectedAdmin.id,
          reviewStatus,
          reviewMessage,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Failed to update admin")
      toast.success(data?.message || "Admin updated")
      setSelectedAdmin(data.admin)
      setReviewMessage("")
      await fetchAdmins()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update admin")
    } finally {
      setIsReviewing(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary">
            <Shield className="h-4 w-4" />
            Admin Management
          </div>
          <h1 className="mt-4 text-3xl font-bold">Admins and Departments</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Create admin accounts, assign access levels, and control departmental visibility.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadCsv("charter-keke-admins.csv", admins.map((admin) => ({
            name: `${admin.users?.first_name || ""} ${admin.users?.last_name || ""}`.trim(),
            email: admin.users?.email,
            phone: admin.users?.phone_number,
            level: admin.admin_level,
            department: admin.department,
            crm_enabled: admin.crm_enabled,
            status: admin.users?.status,
          })))}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Create Admin
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total admins</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-2xl font-bold text-primary">{stats.super}</p><p className="text-sm text-muted-foreground">Superadmins</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-2xl font-bold text-emerald-600">{stats.crm}</p><p className="text-sm text-muted-foreground">CRM enabled</p></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading admins...</CardContent></Card>
        ) : admins.length ? (
          admins.map((admin) => (
            <button key={admin.id} type="button" onClick={() => setSelectedAdmin(admin)} className="text-left">
              <Card className="h-full transition hover:border-primary/50 hover:shadow-md">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">
                        {[admin.users?.first_name, admin.users?.last_name].filter(Boolean).join(" ") || "Admin"}
                      </h2>
                      <p className="text-sm text-muted-foreground">{admin.users?.email || admin.user_id}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{admin.admin_level}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="rounded-md bg-muted px-2 py-1 capitalize">{label(admin.department)}</span>
                    <span className="rounded-md bg-muted px-2 py-1">{admin.crm_enabled ? "CRM enabled" : "No CRM"}</span>
                  </div>
                  {admin.permissions?.status ? (
                    <span className="inline-flex w-fit rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-600">
                      {String(admin.permissions.status).replace(/_/g, " ")}
                    </span>
                  ) : null}
                </CardContent>
              </Card>
            </button>
          ))
        ) : (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">No admin records found.</CardContent></Card>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[92dvh] overflow-hidden p-0">
          <DialogHeader>
            <div className="px-5 pt-5 md:px-6 md:pt-6">
              <DialogTitle>Create Admin</DialogTitle>
              <DialogDescription>Add the user account and linked admin access row in one step.</DialogDescription>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto px-5 pb-5 md:px-6 md:pb-6" style={{ maxHeight: "calc(92dvh - 96px)" }}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>First name</Label><Input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></div>
              <div className="space-y-2"><Label>Last name</Label><Input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
              <div className="space-y-2"><Label>Temporary password</Label><Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div>
              <div className="space-y-2">
                <Label>Admin level</Label>
                <Select value={form.adminLevel} onValueChange={(value) => setForm({ ...form, adminLevel: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{adminLevels.map((level) => <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={form.department} onValueChange={(value) => setForm({ ...form, department: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{departments.map((department) => <SelectItem key={department} value={department}>{label(department)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>CRM access</Label>
                <Switch checked={form.crmEnabled} onCheckedChange={(crmEnabled) => setForm({ ...form, crmEnabled })} />
              </div>
            </div>
            <Button className="mt-4 w-full md:w-auto" onClick={handleCreateAdmin} disabled={isSaving}>{isSaving ? "Creating..." : "Create Admin"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAdmin} onOpenChange={(open) => !open && setSelectedAdmin(null)}>
        <DialogContent className="max-w-2xl max-h-[92dvh] overflow-hidden p-0">
          <DialogHeader className="border-b px-5 py-4 md:px-6">
            <DialogTitle className="pr-8">{[selectedAdmin?.users?.first_name, selectedAdmin?.users?.last_name].filter(Boolean).join(" ") || "Admin details"}</DialogTitle>
            <DialogDescription>Full account and admin access details.</DialogDescription>
          </DialogHeader>
          {selectedAdmin && (
            <div className="overflow-y-auto px-5 py-4 md:px-6" style={{ maxHeight: "calc(92dvh - 86px)" }}>
              <div className="grid gap-3 text-sm">
                <Card><CardHeader><CardTitle className="text-base">Identity</CardTitle></CardHeader><CardContent className="space-y-2">
                  <p className="flex items-start gap-2 break-all"><Mail className="mt-0.5 h-4 w-4 shrink-0" /> {selectedAdmin.users?.email || "No email"}</p>
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {selectedAdmin.users?.phone_number || "No phone"}</p>
                  <p className="break-all">User ID: {selectedAdmin.user_id}</p>
                  <p>Status: {selectedAdmin.users?.status || "unknown"}</p>
                </CardContent></Card>
                <Card><CardHeader><CardTitle className="text-base">Access</CardTitle></CardHeader><CardContent className="grid gap-2">
                  <p>Admin level: <span className="font-semibold">{selectedAdmin.admin_level}</span></p>
                  <p>Department: <span className="font-semibold capitalize">{label(selectedAdmin.department)}</span></p>
                  <p>CRM: <span className="font-semibold">{selectedAdmin.crm_enabled ? "Enabled" : "Disabled"}</span></p>
                  <p>Review status: <span className="font-semibold capitalize">{String(selectedAdmin.permissions?.status || "approved").replace(/_/g, " ")}</span></p>
                  {selectedAdmin.permissions?.request_reason ? (
                    <div className="rounded-md border bg-muted/40 p-3">
                      <p className="font-semibold">Request reason</p>
                      <p className="mt-1 text-muted-foreground">{String(selectedAdmin.permissions.request_reason)}</p>
                      {selectedAdmin.permissions?.request_date ? (
                        <p className="mt-2 text-xs text-muted-foreground">Requested {new Date(String(selectedAdmin.permissions.request_date)).toLocaleString()}</p>
                      ) : null}
                    </div>
                  ) : null}
                  <pre className="max-h-44 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs">{JSON.stringify(selectedAdmin.permissions || {}, null, 2)}</pre>
                  <div className="space-y-2 rounded-md border p-3">
                    <Label>Review message</Label>
                    <Textarea
                      value={reviewMessage}
                      onChange={(event) => setReviewMessage(event.target.value)}
                      placeholder="Optional message to store with this admin review..."
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => updateReviewStatus("approved")} disabled={isReviewing}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateReviewStatus("rejected")} disabled={isReviewing}>Reject</Button>
                      <Button size="sm" variant="outline" onClick={() => updateReviewStatus("pending_review")} disabled={isReviewing}>Mark Pending</Button>
                    </div>
                  </div>
                </CardContent></Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
