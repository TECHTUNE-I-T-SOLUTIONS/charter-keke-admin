"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, BadgeCheck, Ban, Car, CheckCircle, FileText, Loader2, ShieldCheck, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type DriverDetail = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  vehicle_type: string
  plate_number: string
  operating_zones: string[]
  guarantor_name: string
  guarantor_phone: string
  guarantor_address: string
  bank_name: string
  bank_code: string
  bank_account_number: string
  account_name: string
  emergency_contact: string
  identity_type: string
  nin_number: string
  identity_last4: string
  identity_document_url: string
  identity_verified: boolean
  identity_verification_status: string
  identity_verification_reason: string
  identity_verified_at: string | null
  vehicle_picture_url: string
  license_picture_url: string
  verified: boolean
  avg_rating: number
  rides_completed: number
  total_earnings: number
  created_at: string
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-lg border border-orange-100/70 bg-background/50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">{value || "Not provided"}</p>
    </div>
  )
}

function DocumentLink({ label, href }: { label: string; href?: string }) {
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
    >
      <FileText className="h-4 w-4" />
      {label}
    </a>
  ) : (
    <span className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground">
      <FileText className="h-4 w-4" />
      {label} missing
    </span>
  )
}

export default function AdminDriverDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [driver, setDriver] = useState<DriverDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadDriver = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/drivers/${params.id}`)
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Failed to load driver")
      setDriver(data.driver)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load driver")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDriver()
  }, [params.id])

  const runAction = async (label: string, url: string, body?: Record<string, unknown>) => {
    try {
      setActionLoading(label)
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || `${label} failed`)
      toast.success(`${label} complete`)
      await loadDriver()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${label} failed`)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!driver) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <Button variant="outline" onClick={() => router.push("/admin/drivers")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p className="mt-6 text-muted-foreground">Driver not found.</p>
      </div>
    )
  }

  const busy = (name: string) => actionLoading === name

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 pb-24 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Button variant="ghost" className="mb-2 -ml-3" onClick={() => router.push("/admin/drivers")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Drivers
          </Button>
          <h1 className="text-2xl font-black text-foreground md:text-3xl">
            {driver.first_name} {driver.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {driver.vehicle_type || "Keke"} • {driver.plate_number || "No plate"} • {driver.verified ? "Approved" : "Pending approval"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => runAction("Verify NIN", `/api/admin/drivers/${driver.id}/identity`, { action: "verify" })}
            disabled={!!actionLoading}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {busy("Verify NIN") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Verify NIN
          </Button>
          <Button
            onClick={() => runAction("Approve Driver", `/api/admin/drivers/${driver.id}/approve`)}
            disabled={!!actionLoading}
            className="bg-primary text-primary-foreground"
          >
            {busy("Approve Driver") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
            Approve
          </Button>
          <Button
            variant="outline"
            onClick={() => runAction("Reject NIN", `/api/admin/drivers/${driver.id}/identity`, { action: "fail" })}
            disabled={!!actionLoading}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Mark NIN Failed
          </Button>
          <Button
            variant="destructive"
            onClick={() => runAction("Deactivate Driver", `/api/admin/drivers/${driver.id}/deactivate`)}
            disabled={!!actionLoading}
          >
            <Ban className="mr-2 h-4 w-4" />
            Deactivate
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4" /> Driver Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Email" value={driver.email} />
            <DetailRow label="Phone" value={driver.phone_number} />
            <DetailRow label="Vehicle" value={driver.vehicle_type} />
            <DetailRow label="Plate Number" value={driver.plate_number} />
            <DetailRow label="Operating Zones" value={driver.operating_zones?.join(", ")} />
            <DetailRow label="Emergency Contact" value={driver.emergency_contact} />
            <DetailRow label="Bank" value={driver.bank_name} />
            <DetailRow label="Account" value={`${driver.account_name || "No name"} ${driver.bank_account_number ? `(${driver.bank_account_number})` : ""}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" /> Identity Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`rounded-xl border p-4 ${driver.identity_verified ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
              <div className="flex items-center gap-2 font-bold">
                {driver.identity_verified ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-amber-600" />}
                {driver.identity_verification_status || "not_started"}
              </div>
              {driver.identity_verification_reason && <p className="mt-2 text-sm text-muted-foreground">{driver.identity_verification_reason}</p>}
            </div>
            <DetailRow label="Identity Type" value="NIN" />
            <DetailRow label="NIN Number" value={driver.nin_number} />
            <DetailRow label="NIN Last 4" value={driver.identity_last4} />
            <div className="flex flex-wrap gap-2">
              <DocumentLink label="View NIN Document" href={driver.identity_document_url} />
              <DocumentLink label="View Driver License" href={driver.license_picture_url} />
              <DocumentLink label="View Vehicle Photo" href={driver.vehicle_picture_url} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guarantor</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <DetailRow label="Name" value={driver.guarantor_name} />
          <DetailRow label="Phone" value={driver.guarantor_phone} />
          <DetailRow label="Address" value={driver.guarantor_address} />
        </CardContent>
      </Card>
    </div>
  )
}
