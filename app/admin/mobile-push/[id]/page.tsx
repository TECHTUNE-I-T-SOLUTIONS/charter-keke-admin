"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, RefreshCcw, Users, ImageIcon, Eye, Send } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Campaign = {
  id: string
  title: string
  body: string
  target_audience: string
  recipient_count: number
  delivered_count: number
  status: string
  image_url?: string | null
  action_url?: string | null
  cta_label?: string | null
  category_id?: string | null
  created_at: string
  sent_at?: string | null
  last_sent_at?: string | null
  opened_count?: number
  recipients?: Array<{ id: string; user_id: string; status: string; sent_at?: string | null; read_at?: string | null; users?: { id: string; first_name?: string; last_name?: string; email?: string; phone_number?: string; role?: string } }>
}

export default function MobilePushCampaignDetailsPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [resending, setResending] = useState(false)
  const [resendFailedOnly, setResendFailedOnly] = useState(false)

  const stats = useMemo(() => {
    const recipients = Array.isArray(campaign?.recipients) ? campaign.recipients : []
    const sent = recipients.filter((recipient) => ["sent", "opened", "read"].includes(String(recipient.status || "").toLowerCase())).length
    const opened = recipients.filter((recipient) => ["opened", "read"].includes(String(recipient.status || "").toLowerCase()) || Boolean(recipient.read_at)).length
    const failed = recipients.filter((recipient) => String(recipient.status || "").toLowerCase() === "failed").length
    const pending = recipients.filter((recipient) => String(recipient.status || "").toLowerCase() === "pending").length
    return { sent, opened, failed, pending }
  }, [campaign])

  const loadCampaign = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/mobile-push/${params.id}`, { credentials: "include" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Failed to load campaign")
      setCampaign(data?.campaign || null)
    } catch (error: any) {
      toast.error(error?.message || "Failed to load campaign")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCampaign()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const resendCampaign = async () => {
    try {
      setResending(true)
      const response = await fetch(`/api/admin/mobile-push/${params.id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ failedOnly: resendFailedOnly, force: !resendFailedOnly }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Failed to resend campaign")
      toast.success(`Resent to ${data?.deliveredCount || 0} recipients`)
      await loadCampaign()
    } catch (error: any) {
      toast.error(error?.message || "Failed to resend campaign")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/mobile-push"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
          </Button>
          <Button onClick={resendCampaign} disabled={resending || loading}>
            {resending ? "Resending..." : <><RefreshCcw className="mr-2 h-4 w-4" /> Resend campaign</>}
          </Button>
        </div>

        {loading ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading campaign...</CardContent></Card>
        ) : !campaign ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Campaign not found.</CardContent></Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{campaign.title}</CardTitle>
                <CardDescription>Mobile push campaign details and delivery status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">{campaign.body}</p>
                {campaign.image_url ? (
                  <div className="overflow-hidden rounded-2xl border">
                    <img src={campaign.image_url} alt={campaign.title} className="h-56 w-full object-cover" />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{campaign.target_audience}</Badge>
                  <Badge variant="outline">{campaign.status}</Badge>
                  <Badge variant="outline">{campaign.recipient_count} recipients</Badge>
                  <Badge variant="outline">{campaign.delivered_count} delivered</Badge>
                  <Badge variant="outline">{campaign.opened_count ?? stats.opened} opened</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoRow label="Action URL" value={campaign.action_url || "—"} />
                  <InfoRow label="CTA label" value={campaign.cta_label || "—"} />
                  <InfoRow label="Category" value={campaign.category_id || "—"} />
                  <InfoRow label="Created" value={new Date(campaign.created_at).toLocaleString()} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /> Delivery stats</CardTitle>
                <CardDescription>Track what was delivered, opened, failed, or still pending.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-4">
                  <StatCard label="Delivered" value={String(stats.sent)} />
                  <StatCard label="Opened" value={String(stats.opened)} />
                  <StatCard label="Failed" value={String(stats.failed)} />
                  <StatCard label="Pending" value={String(stats.pending)} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button variant="outline" onClick={() => setResendFailedOnly((current) => !current)}>
                    {resendFailedOnly ? "Resending failed only" : "Switch to failed only"}
                  </Button>
                  <Button onClick={resendCampaign} disabled={resending || loading}>
                    {resending ? "Resending..." : <><Send className="mr-2 h-4 w-4" /> {resendFailedOnly ? "Resend failed only" : "Resend campaign"}</>}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Recipient delivery</CardTitle>
                <CardDescription>Status of the individual users included in this campaign.</CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(campaign.recipients) && campaign.recipients.length > 0 ? (
                  <div className="space-y-2">
                    {campaign.recipients.map((recipient) => (
                      <div key={recipient.id} className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm">
                        <span className="font-medium">
                          {recipient.users ? `${recipient.users.first_name || ""} ${recipient.users.last_name || ""}`.trim() || recipient.users.email || recipient.user_id : recipient.user_id}
                        </span>
                        <Badge variant="outline">{recipient.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recipient rows were loaded for this campaign yet.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 break-all text-sm font-medium">{value}</div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  )
}
