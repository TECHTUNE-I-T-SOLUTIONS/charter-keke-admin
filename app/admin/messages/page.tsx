"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { CheckCircle2, MessageCircle, Paperclip, Send } from "lucide-react"

type TicketStatus = "open" | "in_progress" | "resolved" | "closed"

type Ticket = {
  id: string
  user_id: string
  subject: string
  description: string
  category: string
  priority: "low" | "normal" | "high" | "urgent"
  status: TicketStatus
  assigned_to?: string | null
  related_ride_id?: string | null
  created_at: string
  updated_at: string
  resolved_at?: string | null
  resolution_note?: string | null
  users?: {
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
    profile_picture_url?: string | null
  }
}

type TicketMessage = {
  id: string
  ticket_id: string
  sender_id: string
  message: string
  created_at: string
  sender_type?: "user" | "assistant" | "support" | "admin" | "system" | string | null
  sender_label?: string | null
  department_key?: string | null
  attachment_url?: string | null
  attachment_name?: string | null
  attachment_mime_type?: string | null
  users?: {
    id: string
    first_name: string
    last_name: string
    role: string
    profile_picture_url?: string | null
  }
}

function statusVariant(status: TicketStatus) {
  if (status === "open") return "secondary" as const
  if (status === "in_progress") return "default" as const
  if (status === "resolved") return "outline" as const
  return "destructive" as const
}

function isImageAttachment(url?: string | null, mimeType?: string | null) {
  if (mimeType?.startsWith("image/")) return true
  return /\.(png|jpe?g|gif|webp|avif)$/i.test(String(url || "").split("?")[0])
}

function displayName(person?: { first_name?: string | null; last_name?: string | null }) {
  return `${person?.first_name || ""} ${person?.last_name || ""}`.trim()
}

function getMessagePresentation(msg: TicketMessage) {
  const role = String(msg.users?.role || "").toLowerCase()
  const senderType = String(msg.sender_type || "").toLowerCase()
  const isAssistant = senderType === "assistant"
  const isAdmin = senderType === "admin" || senderType === "support" || role === "admin" || role === "super_admin"
  const isCustomer = !isAssistant && !isAdmin
  const senderName =
    msg.sender_label ||
    (isAssistant ? "Dapo - Charter Keke assistant" : displayName(msg.users)) ||
    (isAdmin ? "Charter Keke support" : "Customer")

  return { isAssistant, isAdmin, isCustomer, senderName }
}

function AdminMessagesContent() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [search, setSearch] = useState("")
  const [resolutionNote, setResolutionNote] = useState("")
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<{ url: string; name?: string | null } | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) || null,
    [tickets, selectedTicketId]
  )

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return tickets
    return tickets.filter((t) =>
      [t.subject, t.description, t.users?.first_name, t.users?.last_name, t.users?.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query))
    )
  }, [tickets, search])

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/support/tickets?includeClosed=true&limit=100", {
        cache: "no-store",
        credentials: "include",
      })
      const data = await res.json()
      if (res.status === 401) {
        throw new Error("Your admin session expired. Please log in again.")
      }
      if (!res.ok) throw new Error(data?.error || "Failed to fetch tickets")
      setTickets(data.tickets || [])

      if (!selectedTicketId && data.tickets?.length) {
        setSelectedTicketId(data.tickets[0].id)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load tickets")
    } finally {
      setLoadingTickets(false)
    }
  }

  const fetchTicketThread = async (ticketId: string, silent = false) => {
    if (!ticketId) return
    try {
      if (!silent) setLoadingMessages(true)
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        cache: "no-store",
        credentials: "include",
      })
      const data = await res.json()
      if (res.status === 401) {
        throw new Error("Your admin session expired. Please log in again.")
      }
      if (!res.ok) throw new Error(data?.error || "Failed to load messages")
      setMessages(data.messages || [])
      if (data.ticket?.resolution_note) setResolutionNote(data.ticket.resolution_note)
    } catch (error) {
      if (!silent) toast.error(error instanceof Error ? error.message : "Failed to load thread")
    } finally {
      if (!silent) setLoadingMessages(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    if (!selectedTicketId) return
    fetchTicketThread(selectedTicketId)
  }, [selectedTicketId])

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(() => {
      fetchTickets()
      if (selectedTicketId) fetchTicketThread(selectedTicketId, true)
    }, 4000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [selectedTicketId])

  const uploadAttachment = async (ticketId: string) => {
    if (!attachment) return null

    const formData = new FormData()
    formData.append("file", attachment)
    formData.append("ticketId", ticketId)

    const res = await fetch("/api/support/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || "Failed to upload image")
    return data
  }

  const sendMessage = async () => {
    if (!selectedTicket) return
    if (!newMessage.trim() && !attachment) return

    try {
      setSending(true)
      const uploaded = await uploadAttachment(selectedTicket.id)

      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newMessage.trim(),
          messageType: uploaded ? "image" : "text",
          attachmentUrl: uploaded?.url,
          attachmentName: uploaded?.name,
          attachmentMimeType: uploaded?.mimeType,
          attachmentSize: uploaded?.size,
          attachments: uploaded
            ? [
                {
                  url: uploaded.url,
                  path: uploaded.path,
                  name: uploaded.name,
                  mimeType: uploaded.mimeType,
                  size: uploaded.size,
                },
              ]
            : [],
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to send message")

      setNewMessage("")
      setAttachment(null)
      await fetchTicketThread(selectedTicket.id, true)
      await fetchTickets()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const updateTicketStatus = async (status: TicketStatus) => {
    if (!selectedTicket) return
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolutionNote }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to update ticket")
      toast.success(`Ticket marked ${status.replace("_", " ")}`)
      setStatusDialogOpen(false)
      await fetchTickets()
      await fetchTicketThread(selectedTicket.id, true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status")
    }
  }

  return (
    <>
    <div className="flex min-h-screen bg-background pb-24">
      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl md:text-3xl font-serif font-bold">Support Messages</h1>
            <p className="text-muted-foreground mt-1">Realtime support tickets from riders and drivers.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
            <Card className="lg:col-span-1 min-h-0">
              <CardContent className="p-4 h-full flex flex-col gap-3">
                <Input
                  placeholder="Search tickets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-2">
                    {loadingTickets ? (
                      <p className="text-sm text-muted-foreground">Loading tickets...</p>
                    ) : filteredTickets.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No tickets found.</p>
                    ) : (
                      filteredTickets.map((ticket) => {
                        const active = ticket.id === selectedTicketId
                        return (
                          <button
                            key={ticket.id}
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className={`w-full text-left p-3 rounded-md border transition ${
                              active ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <p className="font-medium line-clamp-1">{ticket.subject}</p>
                              <Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {(ticket.users?.first_name || "").trim()} {(ticket.users?.last_name || "").trim()} • {ticket.category}
                            </p>
                          </button>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 min-h-0">
              <CardContent className="p-4 h-full flex flex-col gap-3">
                {!selectedTicket ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="h-10 w-10 mx-auto mb-2" />
                      Select a ticket to view conversation.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{selectedTicket.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedTicket.users?.first_name} {selectedTicket.users?.last_name} • {selectedTicket.users?.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant(selectedTicket.status)}>{selectedTicket.status}</Badge>
                        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">Update Status</Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[92dvh] overflow-y-auto">
                            <DialogTitle>Update Ticket Status</DialogTitle>
                            <div className="space-y-3 mt-2">
                              <Textarea
                                placeholder="Resolution note (optional)"
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                              />
                              <div className="flex flex-wrap gap-2">
                                <Button variant="secondary" onClick={() => updateTicketStatus("in_progress")}>In Progress</Button>
                                <Button variant="outline" onClick={() => updateTicketStatus("resolved")}>Resolved</Button>
                                <Button variant="destructive" onClick={() => updateTicketStatus("closed")}>Closed</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <Separator />

                    <ScrollArea className="flex-1 min-h-[260px]">
                      <div className="space-y-3 pr-2">
                        {loadingMessages ? (
                          <p className="text-sm text-muted-foreground">Loading messages...</p>
                        ) : messages.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No messages yet.</p>
                        ) : (
                          messages.map((msg) => {
                            const { isAssistant, isAdmin, isCustomer, senderName } = getMessagePresentation(msg)
                            return (
                              <div key={msg.id} className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
                                <div
                                  className={`max-w-[80%] rounded-md border px-3 py-2 ${
                                    isAssistant
                                      ? "border-amber-300 bg-amber-50 text-amber-950"
                                      : isAdmin
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-card"
                                  }`}
                                >
                                  <p className="text-xs opacity-80 mb-1">{senderName}</p>
                                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                  {msg.attachment_url ? (
                                    isImageAttachment(msg.attachment_url, msg.attachment_mime_type) ? (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewImage({ url: msg.attachment_url!, name: msg.attachment_name })}
                                        className="mt-2 block overflow-hidden rounded-lg border bg-black/10 text-left"
                                      >
                                        <img
                                          src={msg.attachment_url}
                                          alt={msg.attachment_name || "Support attachment"}
                                          className="h-40 w-full max-w-[280px] object-cover"
                                        />
                                        <span className="block max-w-[280px] truncate px-2 py-1 text-xs opacity-80">
                                          {msg.attachment_name || "Open image"}
                                        </span>
                                      </button>
                                    ) : (
                                      <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="block mt-2 underline text-xs">
                                        {msg.attachment_name || "View attachment"}
                                      </a>
                                    )
                                  ) : null}
                                  <p className="text-[10px] opacity-70 mt-1">
                                    {new Date(msg.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </ScrollArea>

                    {selectedTicket.status === "resolved" ? (
                      <div className="rounded-md border border-emerald-300 bg-emerald-50 text-emerald-900 p-3 text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Waiting for user confirmation or closure.
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type response..."
                      />
                      <div className="flex items-center justify-between gap-3">
                        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                          <Paperclip className="h-4 w-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                          />
                          {attachment ? attachment.name : "Attach image"}
                        </label>
                        <Button onClick={sendMessage} disabled={sending || (!newMessage.trim() && !attachment)}>
                          <Send className="h-4 w-4 mr-2" />
                          {sending ? "Sending..." : "Send"}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
    <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
      <DialogContent className="max-w-5xl border-border/60 bg-black p-0 text-white">
        <DialogTitle className="sr-only">{previewImage?.name || "Support image"}</DialogTitle>
        <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold">
          {previewImage?.name || "Support image"}
        </div>
        {previewImage?.url ? (
          <img src={previewImage.url} alt={previewImage.name || "Support image"} className="max-h-[82dvh] w-full object-contain" />
        ) : null}
      </DialogContent>
    </Dialog>
    </>
  )
}

export default function AdminMessagesPage() {
  return <AdminMessagesContent />
}
