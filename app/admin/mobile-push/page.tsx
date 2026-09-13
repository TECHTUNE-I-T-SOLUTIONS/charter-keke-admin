"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, ImageIcon, Send, Users, RefreshCcw, Link2, ChevronRight, Search, Smartphone, ShieldCheck, Megaphone } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ScreenMap = Record<string, string>

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
  metadata?: Record<string, any>
}

type UserRow = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  role?: string
}

const DEFAULT_IMAGE_OPTIONS = [
  { value: "default", label: "Use website logo", url: "/charter keke.png" },
  { value: "none", label: "No image", url: "" },
] as const

type ImageMode = "default" | "none" | "custom" | "upload"

const CATEGORY_OPTIONS = [
  { value: "mobile_campaign", label: "Mobile campaign" },
  { value: "ride_update", label: "Ride update" },
  { value: "ride_request", label: "Ride request" },
  { value: "ride_accepted", label: "Ride accepted" },
  { value: "ride_completed", label: "Ride completed" },
  { value: "support_message", label: "Support message" },
  { value: "payment_received", label: "Payment received" },
  { value: "remittance_reminder", label: "Remittance reminder" },
] as const

const TARGETS = [
  { value: "all", label: "Everyone" },
  { value: "riders", label: "Riders" },
  { value: "drivers", label: "Drivers" },
  { value: "selected", label: "Selected people" },
] as const

const ACTION_TYPES = [
  { value: "campaign", label: "Generic campaign" },
  { value: "ride_update", label: "Ride update" },
  { value: "ride_request", label: "New ride request" },
  { value: "ride_accepted", label: "Ride accepted" },
  { value: "support_message", label: "Support reply" },
  { value: "payment_received", label: "Payment received" },
  { value: "remittance_reminder", label: "Remittance reminder" },
] as const

export default function MobilePushPage() {
  const router = useRouter()
  const [screens, setScreens] = useState<ScreenMap>({})
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedTarget, setSelectedTarget] = useState<(typeof TARGETS)[number]["value"]>("all")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [customUrl, setCustomUrl] = useState("")
  const [screenKey, setScreenKey] = useState("")
  const [ctaLabel, setCtaLabel] = useState("Open")
  const [categoryId, setCategoryId] = useState<(typeof CATEGORY_OPTIONS)[number]["value"]>("mobile_campaign")
  const [actionType, setActionType] = useState<(typeof ACTION_TYPES)[number]["value"]>("campaign")
  const [badgeText, setBadgeText] = useState("")
  const [imageMode, setImageMode] = useState<ImageMode>("default")
  const [recipientSearch, setRecipientSearch] = useState("")
  const [recipientResults, setRecipientResults] = useState<UserRow[]>([])
  const [selectedUsers, setSelectedUsers] = useState<UserRow[]>([])
  const [enableActionButtons, setEnableActionButtons] = useState(false)

  const selectedUserIds = useMemo(() => selectedUsers.map((user) => user.id), [selectedUsers])
  const screenOptions = useMemo(() => Object.entries(screens), [screens])
  const defaultImageUrl = useMemo(() => {
    if (imageMode === "default") return "/charter keke.png"
    if (imageMode === "none") return ""
    return imageUrl
  }, [imageMode, imageUrl])

  const handleImageUpload = async (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageMode("custom")
      setImageUrl(String(reader.result || ""))
    }
    reader.readAsDataURL(file)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [screenRes, campaignRes] = await Promise.all([
        fetch("/api/admin/mobile-push?mode=screens", { credentials: "include" }),
        fetch("/api/admin/mobile-push?limit=20", { credentials: "include" }),
      ])
      const screenData = await screenRes.json().catch(() => ({}))
      const campaignData = await campaignRes.json().catch(() => ({}))
      if (!screenRes.ok) throw new Error(screenData?.error || "Failed to load screen routes")
      if (!campaignRes.ok) throw new Error(campaignData?.error || "Failed to load campaigns")
      setScreens(screenData?.screens || {})
      setCampaigns(Array.isArray(campaignData?.campaigns) ? campaignData.campaigns : [])
    } catch (error: any) {
      toast.error(error?.message || "Failed to load mobile push data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (selectedTarget !== "selected" || recipientSearch.trim().length < 2) {
        setRecipientResults([])
        return
      }
      try {
        const response = await fetch(`/api/admin/users?search=${encodeURIComponent(recipientSearch.trim())}&limit=10`, {
          credentials: "include",
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data?.error || "Failed to search users")
        setRecipientResults(Array.isArray(data?.users) ? data.users : [])
      } catch (error: any) {
        toast.error(error?.message || "Failed to search users")
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [recipientSearch, selectedTarget])

  const toggleSelectedUser = (user: UserRow) => {
    setSelectedUsers((current) =>
      current.some((item) => item.id === user.id)
        ? current.filter((item) => item.id !== user.id)
        : [...current, user]
    )
  }

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required")
      return
    }

    if (selectedTarget === "selected" && selectedUsers.length === 0) {
      toast.error("Select at least one person")
      return
    }

    try {
      setSending(true)
      const response = await fetch("/api/admin/mobile-push", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            message,
          target: selectedTarget,
          selectedUserIds,
          screenKey,
          customUrl,
            imageUrl: defaultImageUrl,
            ctaLabel: enableActionButtons ? ctaLabel : null,
            categoryId,
            actionType,
          badgeText,
          enableActionButtons,
          sendNow: true,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Failed to send push campaign")
      toast.success(`Sent to ${data.recipientCount || 0} recipients`)
      setTitle("")
      setMessage("")
      setImageUrl("")
      setImageMode("default")
      setCustomUrl("")
      setScreenKey("")
      setCtaLabel("Open")
      setBadgeText("")
      setSelectedUsers([])
      setRecipientResults([])
      await loadData()
    } catch (error: any) {
      toast.error(error?.message || "Failed to send push campaign")
    } finally {
      setSending(false)
    }
  }

  const destinationPreview = customUrl || (screenKey ? screens[screenKey] : "/rider/booking")

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 p-4 md:p-6 mt-16 mb-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <Badge variant="outline" className="w-fit gap-2">
              <Smartphone className="h-3.5 w-3.5" /> Mobile Push Center
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">Push notifications for riders and drivers</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Compose in-app push campaigns, pick a destination screen, target riders, drivers, or selected users, and resend from the history list.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/notifications"><Bell className="mr-2 h-4 w-4" /> Admin alerts</Link>
            </Button>
            <Button variant="outline" onClick={loadData}><RefreshCcw className="mr-2 h-4 w-4" /> Refresh</Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> Create campaign</CardTitle>
              <CardDescription>Send a push with a title, message, optional image, and a screen destination.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ride offer, support update, announcement..." />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Message</Label>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write the push text here..." rows={5} />
                </div>
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Select value={selectedTarget} onValueChange={(value: any) => setSelectedTarget(value)}>
                    <SelectTrigger><SelectValue placeholder="Choose audience" /></SelectTrigger>
                    <SelectContent>
                      {TARGETS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Action type</Label>
                  <Select value={actionType} onValueChange={(value: any) => setActionType(value)}>
                    <SelectTrigger><SelectValue placeholder="Choose action" /></SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Destination screen</Label>
                  <Select value={screenKey || "default"} onValueChange={(value) => setScreenKey(value === "default" ? "" : value)}>
                    <SelectTrigger><SelectValue placeholder="Select a screen" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Use custom URL or default</SelectItem>
                      {screenOptions.map(([key, value]) => <SelectItem key={key} value={key}>{key} ({value})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Custom URL</Label>
                  <Input value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="/rider/ride-details?rideId=..." />
                </div>
                <div className="space-y-2">
                  <Label>CTA label</Label>
                  <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Open ride" />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Select value={imageMode} onValueChange={(value: any) => setImageMode(value)}>
                    <SelectTrigger><SelectValue placeholder="Choose an image source" /></SelectTrigger>
                    <SelectContent>
                      {DEFAULT_IMAGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                      <SelectItem value="custom">Custom image URL</SelectItem>
                      <SelectItem value="upload">Upload image</SelectItem>
                    </SelectContent>
                  </Select>
                  {imageMode === "custom" ? (
                    <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="mt-2" />
                  ) : null}
                  {imageMode === "upload" ? (
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => void handleImageUpload(e.target.files?.[0])}
                      className="mt-2"
                    />
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Category ID</Label>
                  <Select value={categoryId} onValueChange={(value: any) => setCategoryId(value)}>
                    <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Badge text</Label>
                  <Input value={badgeText} onChange={(e) => setBadgeText(e.target.value)} placeholder="New" />
                </div>
                <div className="space-y-2">
                  <Label>Enable action buttons</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableActionButtons"
                      checked={enableActionButtons}
                      onChange={(e) => setEnableActionButtons(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="enableActionButtons" className="text-sm">
                      Add action button (uses CTA label and destination)
                    </label>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" /> Selected people</div>
                {selectedTarget === "selected" ? (
                  <div className="space-y-3">
                    <Input value={recipientSearch} onChange={(e) => setRecipientSearch(e.target.value)} placeholder="Search users by name, email, phone..." />
                    <ScrollArea className="h-40 rounded-xl border">
                      <div className="p-2">
                        {recipientResults.length === 0 ? (
                          <p className="p-3 text-sm text-muted-foreground">Search for a rider or driver to add them.</p>
                        ) : recipientResults.map((user) => {
                          const selected = selectedUsers.some((item) => item.id === user.id)
                          return (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => toggleSelectedUser(user)}
                              className={cn(
                                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
                                selected ? "bg-primary/10 text-foreground" : "hover:bg-muted"
                              )}
                            >
                              <span>
                                <span className="font-medium">{user.first_name} {user.last_name}</span>
                                <span className="ml-2 text-xs text-muted-foreground">{user.email}</span>
                              </span>
                              <span className="text-xs uppercase text-muted-foreground">{user.role}</span>
                            </button>
                          )
                        })}
                      </div>
                    </ScrollArea>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((user) => (
                        <Badge key={user.id} variant="secondary" className="gap-2">
                          {user.first_name} {user.last_name}
                          <button type="button" onClick={() => toggleSelectedUser(user)} className="text-xs">x</button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {selectedTarget === "all" ? "All active riders and drivers will receive this push." : `All active ${selectedTarget} will receive this push.`}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold"><Link2 className="h-4 w-4" /> Destination preview</div>
                <p className="mt-2 break-all text-muted-foreground">{destinationPreview || "/rider/booking"}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl border p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><ImageIcon className="h-4 w-4" /> Image preview</div>
                  {defaultImageUrl ? (
                    <img src={defaultImageUrl} alt="Notification preview" className="h-44 w-full rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-44 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                      No image attached yet
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Smartphone className="h-4 w-4" /> Mobile preview</div>
                  <div className="rounded-3xl bg-zinc-950 p-4 text-white shadow-lg">
                    <div className="mb-3 flex items-center justify-between text-[11px] text-white/60">
                      <span>Charter Keke</span>
                      <span>{badgeText || "Notification"}</span>
                    </div>
                    <div className="text-base font-semibold">{title || "Notification title"}</div>
                    <div className="mt-2 text-sm text-white/80">{message || "Your notification message will appear here."}</div>
                    {defaultImageUrl ? (
                      <img
                        src={defaultImageUrl}
                        alt="Notification preview"
                        className="mt-4 h-36 w-full rounded-2xl object-cover"
                      />
                    ) : null}
                    {enableActionButtons && ctaLabel ? (
                      <div className="mt-4 flex gap-2">
                        <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{ctaLabel}</div>
                      </div>
                    ) : ctaLabel ? (
                      <div className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{ctaLabel}</div>
                    ) : null}
                    <div className="mt-4 flex items-center gap-2 text-[10px] text-white/40">
                      <span>Category: {categoryId}</span>
                      <span>•</span>
                      <span>Type: {actionType}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleSend} disabled={sending} className="min-w-40">
                  {sending ? "Sending..." : <><Send className="mr-2 h-4 w-4" /> Send push</>}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Available to super admins and departments like support, general, product, and riders.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Route library</CardTitle>
                <CardDescription>Prefilled mobile destinations the admin team can reuse.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                {screenOptions.slice(0, 8).map(([key, route]) => (
                  <div key={key} className="flex items-center justify-between rounded-xl border px-3 py-2">
                    <span className="font-medium">{key}</span>
                    <span className="max-w-[55%] truncate text-muted-foreground">{route}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" /> Campaign history</CardTitle>
                <CardDescription>Review, inspect, and resend past mobile push campaigns.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading campaigns...</p>
                ) : campaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No campaigns yet.</p>
                ) : (
                  <div className="space-y-3">
                    {campaigns.map((campaign) => (
                      <button
                        key={campaign.id}
                        type="button"
                        onClick={() => router.push(`/admin/mobile-push/${campaign.id}`)}
                        className="w-full rounded-2xl border p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{campaign.title}</div>
                            <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{campaign.body}</div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="outline">{campaign.target_audience}</Badge>
                          <Badge variant="outline">{campaign.status}</Badge>
                          <Badge variant="outline">{campaign.recipient_count} recipients</Badge>
                          <Badge variant="outline">{campaign.delivered_count} delivered</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
