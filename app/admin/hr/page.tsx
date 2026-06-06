"use client"

import Link from "next/link"
import { Archive, Shield, UserPlus, Users, Workflow } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const workflows = [
  {
    title: "Admin Onboarding",
    description: "Create admins, assign departments, and control CRM/operations access.",
    href: "/admin/admins",
    icon: UserPlus,
  },
  {
    title: "Driver Onboarding",
    description: "Coordinate driver verification, documentation, training, and activation.",
    href: "/admin/drivers",
    icon: Users,
  },
  {
    title: "Department Routing",
    description: "Use CRM departments to route HR, support, finance, safety, and operations work.",
    href: "/admin/crm/departments",
    icon: Workflow,
  },
  {
    title: "Deleted Accounts",
    description: "Review permanent account deletion records without exposing deleted users to notifications.",
    href: "/admin/hr/deleted-accounts",
    icon: Archive,
  },
]

export default function HrDashboardPage() {
  return (
    <div className="space-y-6 p-6 pb-24">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary">
          <Shield className="h-4 w-4" />
          Human Resources
        </div>
        <h1 className="mt-4 text-3xl font-bold">HR Management</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Human Resources manages admin onboarding, internal team access, department assignments, and people operations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workflows.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.title} className="border-primary/15">
              <CardHeader>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <Button asChild className="w-full">
                  <Link href={item.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
