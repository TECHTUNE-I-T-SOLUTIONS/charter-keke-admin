"use client"

import { useEffect, useState } from "react"
import { Shield, UserPlus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type AdminRow = {
  id: string
  user_id: string
  admin_level: string
  department: string
  crm_enabled: boolean
  users?: {
    first_name?: string
    last_name?: string
    email?: string
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
  "hr",
]

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch("/api/admin/admins", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data?.error || "Failed to load admins")
        if (mounted) setAdmins(data.admins || [])
      })
      .catch(() => {
        if (mounted) setAdmins([])
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary">
            <Shield className="h-4 w-4" />
            Admin Management
          </div>
          <h1 className="mt-4 text-3xl font-bold">Admins and Departments</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Superadmins and HR can manage admin roles, departments, and CRM access from here.
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Create Admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Admin Access Template</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Email address" />
          <Select defaultValue="admin">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="super_admin">Superadmin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="sub_admin">Subadmin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="support">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {departments.map((department) => (
                <SelectItem key={department} value={department}>
                  {department.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button>Create Invite</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Loading admins...</CardContent>
          </Card>
        ) : admins.length ? (
          admins.map((admin) => (
            <Card key={admin.id}>
              <CardContent className="space-y-3 p-5">
                <div>
                  <h2 className="font-semibold">
                    {[admin.users?.first_name, admin.users?.last_name].filter(Boolean).join(" ") || "Admin"}
                  </h2>
                  <p className="text-sm text-muted-foreground">{admin.users?.email || admin.user_id}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-primary">{admin.admin_level || "admin"}</span>
                  <span className="rounded-md bg-muted px-2 py-1 capitalize">{(admin.department || "general").replace(/_/g, " ")}</span>
                  <span className="rounded-md bg-muted px-2 py-1">{admin.crm_enabled ? "CRM" : "No CRM"}</span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">No admin records found.</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
