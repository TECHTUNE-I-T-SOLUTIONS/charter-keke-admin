"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { CRM_DEPARTMENTS, normalizeEmailAddress } from "@/lib/crm"
import { supabase } from "@/lib/supabase"
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  Clock3,
  Mail,
  MessageSquare,
  Mic,
  PanelLeftClose,
  PanelRightClose,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
  Users,
} from "lucide-react"

type CrmTicket = {
  id: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  assigned_to?: string | null
  source_channel?: string | null
  source_email?: string | null
  source_name?: string | null
  external_thread_id?: string | null
  external_message_id?: string | null
  routing_reason?: string | null
  routing_confidence?: number | null
  created_at: string
  updated_at: string
  last_message_at?: string | null
  users?: { id: string; first_name: string; last_name: string; email: string; role: string }
  admins?: {
    id: string
    user_id: string
    department?: string | null
    users?: { id: string; first_name: string; last_name: string; email: string; role: string }
  }
  departments?: { id: string; department_key: string; department_name: string; email_alias?: string | null }
}

type CrmMessage = {
  id: string
  message: string
  created_at: string
  is_internal?: boolean
  message_type?: string
  attachment_url?: string | null
  attachment_name?: string | null
  attachment_mime_type?: string | null
  attachment_size?: number | null
  users?: { first_name?: string | null; last_name?: string | null; role?: string | null; email?: string | null }
}

type CrmNote = {
  id: string
  note: string
  visibility: string
  created_at: string
  admins?: { users?: { first_name?: string | null; last_name?: string | null; email?: string | null } }
  departments?: { department_name?: string | null; department_key?: string | null }
}

type CrmSummary = {
  openTickets: number
  inProgressTickets: number
  escalatedTickets: number
  resolvedTickets: number
  queuedInboundEmails: number
  internalNotes: number
  emailAccounts: number
}

type CrmDetail = {
  ticket: CrmTicket | null
  messages: CrmMessage[]
  notes: CrmNote[]
  emailMessages: Array<Record<string, unknown>>
}

const statusVariants: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  open: "secondary",
  in_progress: "default",
  escalated: "destructive",
  resolved: "outline",
  closed: "outline",
}

const statusOrder = ["open", "in_progress", "escalated", "resolved", "closed"]

function displayName(person?: { first_name?: string | null; last_name?: string | null }) {
  const firstName = person?.first_name || ""
  const lastName = person?.last_name || ""
  return `${firstName} ${lastName}`.trim() || "Unknown"
}

function departmentLabel(departmentKey?: string | null) {
  return CRM_DEPARTMENTS.find((department) => department.key === departmentKey)?.label || "General"
}

function formatDepartmentEmail(departmentKey?: string | null) {
  return CRM_DEPARTMENTS.find((department) => department.key === departmentKey)?.emailAlias || "support@charterkeke.com"
}

export default function AdminCrmPage() {
  const { user } = useAuth()
  const [adminDept, setAdminDept] = useState<string>("general")

  useEffect(() => {
    if (!user?.id) return
    const fetchAdminDept = async () => {
      try {
        const { data } = await supabase
          .from("admins")
          .select("department")
          .eq("user_id", user.id)
          .single()
        if (data?.department) {
          setAdminDept(data.department)
        }
      } catch (error) {
        console.error("Failed to fetch admin department:", error)
      }
    }
    void fetchAdminDept()
  }, [user?.id])

  const [adminsList, setAdminsList] = useState<any[]>([])

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const { data, error } = await supabase
          .from("admins")
          .select(`
            id,
            department,
            users:user_id (
              first_name,
              last_name,
              email
            )
          `)
        if (error) throw error
        setAdminsList(data || [])
      } catch (error) {
        console.error("Failed to fetch admins list:", error)
      }
    }
    void fetchAdmins()
  }, [])

  const [summary, setSummary] = useState<CrmSummary>({
    openTickets: 0,
    inProgressTickets: 0,
    escalatedTickets: 0,
    resolvedTickets: 0,
    queuedInboundEmails: 0,
    internalNotes: 0,
    emailAccounts: 0,
  })
  const [departments, setDepartments] = useState<Array<Record<string, unknown>>>([])
  const [tickets, setTickets] = useState<CrmTicket[]>([])
  const [detail, setDetail] = useState<CrmDetail>({ ticket: null, messages: [], notes: [], emailMessages: [] })
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeQueue, setActiveQueue] = useState<string>("open")
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [messageDraft, setMessageDraft] = useState("")
  const [noteDraft, setNoteDraft] = useState("")
  const [noteVisibility, setNoteVisibility] = useState("internal")
  const [statusDraft, setStatusDraft] = useState("in_progress")
  const [priorityDraft, setPriorityDraft] = useState("normal")
  const [departmentDraft, setDepartmentDraft] = useState("")
  const [assignedToDraft, setAssignedToDraft] = useState("")

  const selectedTicket = detail.ticket

  const isDeptMismatch = useMemo(() => {
    if (!selectedTicket || (user as any)?.role === "super_admin" || adminDept === "general") return false
    const ticketDept = selectedTicket.departments?.department_key || selectedTicket.category || "general"
    return ticketDept !== adminDept
  }, [selectedTicket, (user as any)?.role, adminDept])

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase()
    return tickets.filter((ticket) => {
      const ticketDepartment = ticket.departments?.department_key || ticket.category || "general"
      const matchesQueue =
        activeQueue === "all" ||
        (activeQueue === "assigned" ? !!ticket.assigned_to : activeQueue === "email" ? ticket.source_channel === "email" : ticket.status === activeQueue)

      if (!matchesQueue) return false

      if (!query) return true

      const haystack = [
        ticket.subject,
        ticket.description,
        ticket.source_email,
        ticket.source_name,
        ticket.users?.first_name,
        ticket.users?.last_name,
        ticket.users?.email,
        ticketDepartment,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [activeQueue, search, tickets])

  const loadSummary = async () => {
    const response = await fetch("/api/admin/crm", { cache: "no-store", credentials: "include" })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.error || "Failed to load CRM summary")
    setSummary(data.summary)
    setDepartments(data.departments || [])
  }

  const loadTickets = async (ticketId?: string | null) => {
    const response = await fetch("/api/admin/crm/tickets?includeClosed=true&limit=100", {
      cache: "no-store",
      credentials: "include",
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.error || "Failed to load CRM tickets")

    setTickets(data.tickets || [])

    const nextTicketId = ticketId || selectedTicketId || data.tickets?.[0]?.id || null
    if (nextTicketId) {
      setSelectedTicketId(nextTicketId)
      await loadTicket(nextTicketId)
    } else {
      setDetail({ ticket: null, messages: [], notes: [], emailMessages: [] })
    }
  }

  const loadTicket = async (ticketId: string) => {
    const response = await fetch(`/api/admin/crm/tickets/${ticketId}`, {
      cache: "no-store",
      credentials: "include",
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.error || "Failed to load CRM ticket")

    setDetail({
      ticket: data.ticket || null,
      messages: data.messages || [],
      notes: data.notes || [],
      emailMessages: data.emailMessages || [],
    })

    const selectedDepartment = data.ticket?.departments?.department_key || data.ticket?.category || "general"
    setDepartmentDraft(selectedDepartment)
    setPriorityDraft(data.ticket?.priority || "normal")
    setStatusDraft(data.ticket?.status || "in_progress")
    setAssignedToDraft(data.ticket?.assigned_to || "")
  }

  const refresh = async (ticketId?: string | null) => {
    try {
      setLoading(true)
      await Promise.all([loadSummary(), loadTickets(ticketId)])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load CRM data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  useEffect(() => {
    if (!selectedTicketId) return
    void loadTicket(selectedTicketId).catch((error) => {
      toast.error(error instanceof Error ? error.message : "Failed to refresh ticket")
    })
  }, [selectedTicketId])

  useEffect(() => {
    const channel = supabase
      .channel("crm-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => {
        void refresh(selectedTicketId)
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_messages" }, () => {
        void refresh(selectedTicketId)
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_internal_notes" }, () => {
        void refresh(selectedTicketId)
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_email_messages" }, () => {
        void refresh(selectedTicketId)
      })
      .subscribe()

    const interval = setInterval(() => {
      void refresh(selectedTicketId)
    }, 15000)

    return () => {
      clearInterval(interval)
      void supabase.removeChannel(channel)
    }
  }, [selectedTicketId])

  const updateTicket = async (payload: Record<string, unknown>) => {
    if (!selectedTicketId) return
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/crm/tickets/${selectedTicketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || "Failed to update ticket")
      toast.success("Ticket updated")
      await refresh(selectedTicketId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update ticket")
    } finally {
      setSaving(false)
    }
  }

  const sendMessage = async () => {
    if (!selectedTicketId || !messageDraft.trim()) return
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/crm/tickets/${selectedTicketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: messageDraft, isInternal: false }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || "Failed to send message")
      setMessageDraft("")
      toast.success("Message sent")
      await refresh(selectedTicketId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message")
    } finally {
      setSaving(false)
    }
  }

  const addNote = async () => {
    if (!selectedTicketId || !noteDraft.trim()) return
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/crm/tickets/${selectedTicketId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ note: noteDraft, visibility: noteVisibility }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || "Failed to add note")
      setNoteDraft("")
      toast.success("Internal note saved")
      await refresh(selectedTicketId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add note")
    } finally {
      setSaving(false)
    }
  }

  const selectedQueueCount = filteredTickets.length

  return (
    <div className="mx-auto w-full p-4 md:p-6 lg:p-8 space-y-6 h-screen overflow-y-auto min-w-0">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    CRM Management
                  </div>
                  <h1 className="mt-3 text-3xl md:text-4xl font-serif font-bold">Customer Operations Console</h1>
                  <p className="mt-1 max-w-3xl text-muted-foreground">
                    Ticket inbox, email routing, internal notes, and department coordination in one workspace.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="xl:hidden bg-background/50 backdrop-blur">
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Queues
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[92vw] sm:max-w-md">
                      <SheetHeader>
                        <SheetTitle>Queues and tickets</SheetTitle>
                      </SheetHeader>
                      <div className="p-4 pt-0">
                        <CrmLeftRail
                          search={search}
                          setSearch={setSearch}
                          activeQueue={activeQueue}
                          setActiveQueue={setActiveQueue}
                          selectedQueueCount={selectedQueueCount}
                          tickets={filteredTickets}
                          selectedTicketId={selectedTicketId}
                          onSelectTicket={setSelectedTicketId}
                          loading={loading}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="xl:hidden bg-background/50 backdrop-blur">
                        <Tags className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[92vw] sm:max-w-md">
                      <SheetHeader>
                        <SheetTitle>Ticket details</SheetTitle>
                      </SheetHeader>
                      <div className="p-4 pt-0">
                        <CrmRightRail
                          selectedTicket={selectedTicket}
                          departments={departments}
                          adminsList={adminsList}
                          statusDraft={statusDraft}
                          setStatusDraft={setStatusDraft}
                          priorityDraft={priorityDraft}
                          setPriorityDraft={setPriorityDraft}
                          departmentDraft={departmentDraft}
                          setDepartmentDraft={setDepartmentDraft}
                          assignedToDraft={assignedToDraft}
                          setAssignedToDraft={setAssignedToDraft}
                          updateTicket={updateTicket}
                          addNote={addNote}
                          noteDraft={noteDraft}
                          setNoteDraft={setNoteDraft}
                          noteVisibility={noteVisibility}
                          setNoteVisibility={setNoteVisibility}
                          saving={saving}
                          notes={detail.notes}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/admin/messages">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Open classic support inbox
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
                {[
                  { label: "Open", value: summary.openTickets, icon: ClipboardList, tone: "from-amber-500/90 to-amber-300/80" },
                  { label: "In Progress", value: summary.inProgressTickets, icon: Clock3, tone: "from-sky-500/90 to-cyan-300/80" },
                  { label: "Escalated", value: summary.escalatedTickets, icon: ShieldCheck, tone: "from-rose-500/90 to-rose-300/80" },
                  { label: "Resolved", value: summary.resolvedTickets, icon: MessageSquare, tone: "from-emerald-500/90 to-emerald-300/80" },
                  { label: "Queued Email", value: summary.queuedInboundEmails, icon: Mail, tone: "from-violet-500/90 to-violet-300/80" },
                  { label: "Internal Notes", value: summary.internalNotes, icon: Users, tone: "from-zinc-500/90 to-zinc-300/80" },
                  { label: "Mailboxes", value: summary.emailAccounts, icon: MessageSquare, tone: "from-cyan-500/90 to-cyan-300/80" },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <Card key={item.label} className="border-border/60 bg-background/55 backdrop-blur-xl shadow-xl shadow-black/10">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                          <p className="mt-1 text-2xl font-semibold">{item.value}</p>
                        </div>
                        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white", item.tone)}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </motion.div>

            <div className="grid min-h-[72vh] grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_360px] gap-4">
              <aside className={cn("hidden xl:flex flex-col rounded-3xl border border-border/60 bg-background/50 backdrop-blur-xl shadow-2xl shadow-black/10 overflow-hidden", leftCollapsed && "xl:w-20") }>
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <div className={cn("transition-all", leftCollapsed && "xl:hidden") }>
                    <p className="text-sm font-semibold">Queues</p>
                    <p className="text-xs text-muted-foreground">Department and status filters</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setLeftCollapsed((value) => !value)}>
                    {leftCollapsed ? <ChevronRight className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    <div className={cn("space-y-2", leftCollapsed && "xl:hidden") }>
                      <div className="relative">
                        <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search CRM tickets" className="pl-9 bg-background/70" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { key: "open", label: "Open" },
                        { key: "in_progress", label: "In Progress" },
                        { key: "escalated", label: "Escalated" },
                        { key: "resolved", label: "Resolved" },
                        { key: "closed", label: "Closed" },
                        { key: "assigned", label: "Assigned" },
                        { key: "email", label: "Email Inbox" },
                        { key: "all", label: "All Tickets" },
                      ].map((queue) => (
                        <button
                          key={queue.key}
                          onClick={() => setActiveQueue(queue.key)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition",
                            activeQueue === queue.key
                              ? "border-primary/30 bg-primary/10 text-foreground shadow-sm"
                              : "border-border/60 bg-background/45 text-muted-foreground hover:border-primary/20 hover:text-foreground"
                          )}
                        >
                          <span className={cn("font-medium", leftCollapsed && "xl:hidden")}>{queue.label}</span>
                          <ChevronDown className={cn("h-4 w-4 transition-transform", activeQueue === queue.key && "rotate-180")} />
                        </button>
                      ))}
                    </div>

                    <Separator />

                    <div className={cn("space-y-2", leftCollapsed && "xl:hidden") }>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Departments</p>
                      {departments.map((department) => (
                        <div key={String(department.id)} className="flex items-center justify-between rounded-2xl border border-border/60 px-3 py-2 bg-background/40">
                          <div>
                            <p className="text-sm font-medium">{String(department.department_name || department.department_key)}</p>
                            <p className="text-xs text-muted-foreground">{String(department.email_alias || formatDepartmentEmail(String(department.department_key)))} </p>
                          </div>
                          <Badge variant="outline">{String(department.route_priority ?? 100)}</Badge>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className={cn("space-y-3", leftCollapsed && "xl:hidden") }>
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Ticket Inbox</p>
                        <span className="text-xs text-muted-foreground">{selectedQueueCount}</span>
                      </div>

                      {loading ? (
                        <p className="text-sm text-muted-foreground">Loading tickets...</p>
                      ) : filteredTickets.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No CRM tickets in this queue.</p>
                      ) : (
                        filteredTickets.map((ticket) => {
                          const active = ticket.id === selectedTicketId
                          const departmentKey = ticket.departments?.department_key || ticket.category || "general"
                          return (
                            <button
                              key={ticket.id}
                              onClick={() => setSelectedTicketId(ticket.id)}
                              className={cn(
                                "w-full rounded-2xl border p-3 text-left transition",
                                active ? "border-primary/40 bg-primary/10 shadow-md" : "border-border/60 bg-background/45 hover:border-primary/20"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{ticket.subject}</p>
                                  <p className="mt-1 text-xs text-muted-foreground truncate">
                                    {displayName(ticket.users)} • {ticket.source_channel || "in-app"}
                                  </p>
                                </div>
                                <Badge variant={statusVariants[ticket.status] || "secondary"}>{ticket.status}</Badge>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                <span>{departmentLabel(departmentKey)}</span>
                                <span>{new Date(ticket.last_message_at || ticket.updated_at).toLocaleString()}</span>
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </aside>

              <section className="rounded-3xl border border-border/60 bg-background/55 backdrop-blur-xl shadow-2xl shadow-black/10 overflow-hidden min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Current ticket</p>
                    <h2 className="truncate text-xl font-semibold">{selectedTicket?.subject || "Select a ticket"}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedTicket ? `${displayName(selectedTicket.users)} • ${normalizeEmailAddress(selectedTicket.source_email || selectedTicket.users?.email) || "No email"}` : "Choose a ticket from the inbox to start managing it."}
                    </p>
                  </div>

                  {selectedTicket ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariants[selectedTicket.status] || "secondary"}>{selectedTicket.status}</Badge>
                      <Badge variant="outline">{selectedTicket.source_channel || "in-app"}</Badge>
                      <Badge variant="outline">{departmentLabel(selectedTicket.departments?.department_key || selectedTicket.category)}</Badge>
                    </div>
                  ) : null}
                </div>

                {!selectedTicket ? (
                  <div className="flex min-h-[60vh] items-center justify-center p-8">
                    <div className="max-w-md text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <MessageSquare className="h-8 w-8" />
                      </div>
                      <h3 className="text-2xl font-semibold">No ticket selected</h3>
                      <p className="mt-2 text-muted-foreground">
                        Use the inbox to open a ticket, then route it, reply to the customer, and add internal notes.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid min-h-[60vh] grid-rows-[auto_minmax(0,1fr)_auto]">
                    {isDeptMismatch && (
                      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-center gap-2.5 text-amber-400">
                        <AlertCircle className="h-4.5 w-4.5 text-amber-500 flex-shrink-0 animate-pulse" />
                        <p className="text-xs font-semibold uppercase tracking-wider">
                          Operational Notice: This ticket belongs to the <span className="underline">{departmentLabel(selectedTicket.departments?.department_key || selectedTicket.category)}</span> department. Your assigned department is <span className="underline">{departmentLabel(adminDept)}</span>.
                        </p>
                      </div>
                    )}
                    <div className="grid gap-4 border-b border-border/60 p-4 lg:grid-cols-3">
                      <Card className="bg-background/60 border-border/60">
                        <CardContent className="p-4 space-y-2">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Customer</p>
                          <p className="font-semibold">{displayName(selectedTicket.users)}</p>
                          <p className="text-sm text-muted-foreground">{selectedTicket.users?.email || selectedTicket.source_email || "No email"}</p>
                          <p className="text-xs text-muted-foreground">{selectedTicket.users?.role || "user"}</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-background/60 border-border/60">
                        <CardContent className="p-4 space-y-2">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Routing</p>
                          <p className="font-semibold">{departmentLabel(selectedTicket.departments?.department_key || selectedTicket.category)}</p>
                          <p className="text-sm text-muted-foreground">{selectedTicket.routing_reason || "Auto-routed from subject and email alias."}</p>
                          <p className="text-xs text-muted-foreground">Confidence {Number(selectedTicket.routing_confidence || 0).toFixed(0)}%</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-background/60 border-border/60">
                        <CardContent className="p-4 space-y-2">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Email Alias</p>
                          <p className="font-semibold">{formatDepartmentEmail(selectedTicket.departments?.department_key || selectedTicket.category)}</p>
                          <p className="text-sm text-muted-foreground">{selectedTicket.external_thread_id || "No email thread yet"}</p>
                          <p className="text-xs text-muted-foreground">{selectedTicket.source_name || "Inbound customer message"}</p>
                        </CardContent>
                      </Card>
                    </div>

                    <ScrollArea className="min-h-0">
                      <div className="space-y-6 p-4">
                        <div className="space-y-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Conversation thread</p>
                          <div className="flex flex-col gap-4">
                            {detail.messages.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No messages yet.</p>
                            ) : (
                              detail.messages.map((message) => {
                                const isAdmin = message.users?.role === "admin" || message.users?.role === "super_admin" || !!message.is_internal
                                const senderName = displayName(message.users)
                                return (
                                  <div
                                    key={message.id}
                                    className={cn(
                                      "flex flex-col max-w-[80%] rounded-2xl px-4 py-3 border shadow-md transition-all duration-200",
                                      isAdmin
                                        ? "self-end bg-amber-500/10 border-amber-500/25 text-foreground rounded-tr-none"
                                        : "self-start bg-slate-900/50 border-border/50 text-foreground rounded-tl-none"
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-6 mb-1.5 border-b border-primary/5 pb-1">
                                      <span className={cn("font-bold text-xs", isAdmin ? "text-amber-400" : "text-sky-400")}>
                                        {senderName}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground/60 font-mono">
                                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="whitespace-pre-wrap text-sm leading-6">{message.message}</p>
                                    {message.attachment_url ? (
                                      <a
                                        href={message.attachment_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-2 inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2"
                                      >
                                        Open attachment
                                      </a>
                                    ) : null}
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Internal notes</p>
                            <Badge variant="outline">Visible to staff only</Badge>
                          </div>
                          {detail.notes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No internal notes yet.</p>
                          ) : (
                            detail.notes.map((note) => (
                              <div key={note.id} className="rounded-2xl border border-border/60 bg-background/55 p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-medium">{note.departments?.department_name || "Department note"}</p>
                                  <p className="text-xs text-muted-foreground">{new Date(note.created_at).toLocaleString()}</p>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{note.note}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </ScrollArea>

                    <div className="border-t border-border/60 bg-background/70 p-4">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant={selectedTicket?.status === "open" ? "default" : "outline"}
                              className={selectedTicket?.status === "open" ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold" : ""}
                              onClick={() => updateTicket({ status: "open" })}
                              disabled={saving}
                            >
                              Open
                            </Button>
                            <Button
                              size="sm"
                              variant={selectedTicket?.status === "in_progress" ? "default" : "outline"}
                              className={selectedTicket?.status === "in_progress" ? "bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold" : ""}
                              onClick={() => updateTicket({ status: "in_progress" })}
                              disabled={saving}
                            >
                              In Progress
                            </Button>
                            <Button
                              size="sm"
                              variant={selectedTicket?.status === "escalated" ? "default" : "outline"}
                              className={selectedTicket?.status === "escalated" ? "bg-rose-500 hover:bg-rose-600 text-white font-bold" : ""}
                              onClick={() => updateTicket({ status: "escalated" })}
                              disabled={saving}
                            >
                              Escalated
                            </Button>
                            <Button
                              size="sm"
                              variant={selectedTicket?.status === "resolved" ? "default" : "outline"}
                              className={selectedTicket?.status === "resolved" ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold" : ""}
                              onClick={() => updateTicket({ status: "resolved" })}
                              disabled={saving}
                            >
                              Resolved
                            </Button>
                            <Button
                              size="sm"
                              variant={selectedTicket?.status === "closed" ? "default" : "outline"}
                              className={selectedTicket?.status === "closed" ? "bg-zinc-600 hover:bg-zinc-700 text-white font-bold" : ""}
                              onClick={() => updateTicket({ status: "closed" })}
                              disabled={saving}
                            >
                              Closed
                            </Button>
                          </div>

                          <Textarea
                            placeholder="Reply to the customer or add an internal update to the thread..."
                            value={messageDraft}
                            onChange={(event) => setMessageDraft(event.target.value)}
                            className="min-h-[110px] bg-background/60"
                          />

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              Replies stay attached to the selected CRM ticket and sync through Supabase Realtime.
                            </div>
                            <Button onClick={sendMessage} disabled={saving || !messageDraft.trim()}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Send Message
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4 rounded-2xl border border-border/60 bg-slate-950/40 p-4 shadow-xl">
                          <div className="space-y-1.5">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Assign Department</p>
                            <select
                              aria-label="Ticket department assignment"
                              value={departmentDraft}
                              onChange={(event) => setDepartmentDraft(event.target.value)}
                              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-foreground focus-visible:ring-amber-500"
                            >
                              {departments.map((dept: any) => (
                                <option key={dept.id} value={dept.department_key}>
                                  {dept.department_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Assign Operator</p>
                            <select
                              aria-label="Assign admin to ticket"
                              value={assignedToDraft || ""}
                              onChange={(event) => setAssignedToDraft(event.target.value)}
                              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-foreground focus-visible:ring-amber-500"
                            >
                              <option value="">Unassigned</option>
                              {adminsList.map((admin) => {
                                const name = admin.users ? `${admin.users.first_name} ${admin.users.last_name}` : "Unknown Admin"
                                return (
                                  <option key={admin.id} value={admin.id}>
                                    {name} ({admin.department || "general"})
                                  </option>
                                )
                              })}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Priority</p>
                            <select
                              aria-label="Ticket priority"
                              value={priorityDraft}
                              onChange={(event) => setPriorityDraft(event.target.value)}
                              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-foreground focus-visible:ring-amber-500"
                            >
                              <option value="low">Low</option>
                              <option value="normal">Normal</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>

                          <Button
                            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2 rounded-xl"
                            onClick={() => {
                              const matchedDept = departments.find((d: any) => d.department_key === departmentDraft)
                              updateTicket({
                                departmentId: matchedDept ? matchedDept.id : null,
                                assignedTo: assignedToDraft || null,
                                priority: priorityDraft
                              })
                            }}
                            disabled={saving}
                          >
                            Update Ticket Settings
                          </Button>

                          <Separator />

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Mic className="h-4 w-4 text-primary" />
                              <p className="text-sm font-medium">Internal note</p>
                            </div>
                            <Textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Add internal context, department handoff, or investigation notes..." className="min-h-[120px] bg-background/60" />
                            <select aria-label="Internal note visibility" value={noteVisibility} onChange={(event) => setNoteVisibility(event.target.value)} className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm">
                              <option value="internal">Internal</option>
                              <option value="department">Department</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                            <Button variant="secondary" onClick={addNote} disabled={saving || !noteDraft.trim()} className="w-full">
                              Save Internal Note
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <aside className={cn("hidden xl:flex flex-col rounded-3xl border border-border/60 bg-background/50 backdrop-blur-xl shadow-2xl shadow-black/10 overflow-hidden", rightCollapsed && "xl:w-20") }>
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <div className={cn("transition-all", rightCollapsed && "xl:hidden") }>
                    <p className="text-sm font-semibold">Details</p>
                    <p className="text-xs text-muted-foreground">Metadata and internal notes</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setRightCollapsed((value) => !value)}>
                    {rightCollapsed ? <ChevronLeft className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    <div className={cn("space-y-3", rightCollapsed && "xl:hidden") }>
                      <Card className="bg-background/60 border-border/60">
                        <CardContent className="p-4 space-y-2">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Routing summary</p>
                          <p className="font-semibold">{selectedTicket ? departmentLabel(selectedTicket.departments?.department_key || selectedTicket.category) : "No ticket selected"}</p>
                          <p className="text-sm text-muted-foreground">{selectedTicket?.routing_reason || "Ready for auto-assignment."}</p>
                          <p className="text-xs text-muted-foreground">Alias: {selectedTicket ? formatDepartmentEmail(selectedTicket.departments?.department_key || selectedTicket.category) : "support@charterkeke.com"}</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-background/60 border-border/60">
                        <CardContent className="p-4 space-y-2">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Assignment</p>
                          <p className="font-semibold">{selectedTicket?.admins?.users ? displayName(selectedTicket.admins.users) : "Unassigned"}</p>
                          <p className="text-sm text-muted-foreground">{selectedTicket?.admins?.department || "general"}</p>
                          <p className="text-xs text-muted-foreground">Assigned to admin id {selectedTicket?.assigned_to || "pending"}</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-background/60 border-border/60">
                        <CardContent className="p-4 space-y-2">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Email details</p>
                          <p className="font-semibold">{normalizeEmailAddress(selectedTicket?.source_email || selectedTicket?.users?.email) || "unknown@charterkeke.com"}</p>
                          <p className="text-sm text-muted-foreground">{selectedTicket?.source_name || "Incoming email"}</p>
                          <p className="text-xs text-muted-foreground">Thread {selectedTicket?.external_thread_id || "not yet synced"}</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-background/60 border-border/60">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Internal notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {detail.notes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No notes yet.</p>
                          ) : (
                            detail.notes.slice(0, 4).map((note) => (
                              <div key={note.id} className="rounded-2xl border border-border/60 p-3">
                                <p className="text-xs text-muted-foreground">{new Date(note.created_at).toLocaleString()}</p>
                                <p className="mt-2 text-sm">{note.note}</p>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </ScrollArea>
              </aside>
            </div>
          </div>
  )
}

function CrmLeftRail({
  search,
  setSearch,
  activeQueue,
  setActiveQueue,
  selectedQueueCount,
  tickets,
  selectedTicketId,
  onSelectTicket,
  loading,
}: {
  search: string
  setSearch: (value: string) => void
  activeQueue: string
  setActiveQueue: (value: string) => void
  selectedQueueCount: number
  tickets: CrmTicket[]
  selectedTicketId: string | null
  onSelectTicket: (ticketId: string) => void
  loading: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search CRM tickets" className="pl-9 bg-background/70" />
      </div>

      <div className="space-y-2">
        {[
          { key: "open", label: "Open" },
          { key: "in_progress", label: "In Progress" },
          { key: "escalated", label: "Escalated" },
          { key: "resolved", label: "Resolved" },
          { key: "closed", label: "Closed" },
          { key: "assigned", label: "Assigned" },
          { key: "email", label: "Email Inbox" },
          { key: "all", label: "All Tickets" },
        ].map((queue) => (
          <button
            key={queue.key}
            onClick={() => setActiveQueue(queue.key)}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition",
              activeQueue === queue.key
                ? "border-primary/30 bg-primary/10 text-foreground shadow-sm"
                : "border-border/60 bg-background/45 text-muted-foreground hover:border-primary/20 hover:text-foreground"
            )}
          >
            <span className="font-medium">{queue.label}</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", activeQueue === queue.key && "rotate-180")} />
          </button>
        ))}
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Ticket Inbox</p>
          <span className="text-xs text-muted-foreground">{selectedQueueCount}</span>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            No CRM tickets in this queue.
          </div>
        ) : (
          tickets.map((ticket) => {
            const active = ticket.id === selectedTicketId
            return (
              <button
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className={cn(
                  "w-full rounded-2xl border p-3 text-left transition",
                  active ? "border-primary/40 bg-primary/10 shadow-md" : "border-border/60 bg-background/45 hover:border-primary/20"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{ticket.subject}</p>
                    <p className="mt-1 text-xs text-muted-foreground truncate">{displayName(ticket.users)} • {ticket.source_channel || "in-app"}</p>
                  </div>
                  <Badge variant={statusVariants[ticket.status] || "secondary"}>{ticket.status}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{departmentLabel(ticket.departments?.department_key || ticket.category)}</span>
                  <span>{new Date(ticket.last_message_at || ticket.updated_at).toLocaleString()}</span>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

function CrmRightRail({
  selectedTicket,
  departments,
  adminsList,
  statusDraft,
  setStatusDraft,
  priorityDraft,
  setPriorityDraft,
  departmentDraft,
  setDepartmentDraft,
  assignedToDraft,
  setAssignedToDraft,
  updateTicket,
  addNote,
  noteDraft,
  setNoteDraft,
  noteVisibility,
  setNoteVisibility,
  saving,
  notes,
}: {
  selectedTicket: CrmTicket | null
  departments: Array<Record<string, unknown>>
  adminsList: any[]
  statusDraft: string
  setStatusDraft: (value: string) => void
  priorityDraft: string
  setPriorityDraft: (value: string) => void
  departmentDraft: string
  setDepartmentDraft: (value: string) => void
  assignedToDraft: string
  setAssignedToDraft: (value: string) => void
  updateTicket: (payload: Record<string, unknown>) => void
  addNote: () => void
  noteDraft: string
  setNoteDraft: (value: string) => void
  noteVisibility: string
  setNoteVisibility: (value: string) => void
  saving: boolean
  notes: CrmNote[]
}) {
  return (
    <div className="space-y-4">
      <Card className="bg-background/60 border-border/60">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Routing summary</p>
          <p className="font-semibold">{selectedTicket ? departmentLabel(selectedTicket.departments?.department_key || selectedTicket.category) : "No ticket selected"}</p>
          <p className="text-sm text-muted-foreground">{selectedTicket?.routing_reason || "Ready for auto-assignment."}</p>
          <p className="text-xs text-muted-foreground">Alias: {selectedTicket ? formatDepartmentEmail(selectedTicket.departments?.department_key || selectedTicket.category) : "support@charterkeke.com"}</p>
        </CardContent>
      </Card>

      <Card className="bg-background/60 border-border/60">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Assignment</p>
          <p className="font-semibold">{selectedTicket?.admins?.users ? displayName(selectedTicket.admins.users) : "Unassigned"}</p>
          <p className="text-sm text-muted-foreground">{selectedTicket?.admins?.department || "general"}</p>
          <p className="text-xs text-muted-foreground">Assigned admin id {selectedTicket?.assigned_to || "pending"}</p>
        </CardContent>
      </Card>

      <Card className="bg-background/60 border-border/60">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Ticket controls</p>
          
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">Department</p>
            <select
              aria-label="Ticket department assignment"
              value={departmentDraft}
              onChange={(event) => setDepartmentDraft(event.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-foreground focus-visible:ring-amber-500"
            >
              {departments.map((dept: any) => (
                <option key={dept.id} value={dept.department_key}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">Assigned Operator</p>
            <select
              aria-label="Assign admin to ticket"
              value={assignedToDraft || ""}
              onChange={(event) => setAssignedToDraft(event.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-foreground focus-visible:ring-amber-500"
            >
              <option value="">Unassigned</option>
              {adminsList.map((admin) => {
                const name = admin.users ? `${admin.users.first_name} ${admin.users.last_name}` : "Unknown Admin"
                return (
                  <option key={admin.id} value={admin.id}>
                    {name} ({admin.department || "general"})
                  </option>
                )
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Status</p>
              <select
                aria-label="Ticket status"
                value={statusDraft}
                onChange={(event) => setStatusDraft(event.target.value)}
                className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-foreground focus-visible:ring-amber-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Priority</p>
              <select
                aria-label="Ticket priority"
                value={priorityDraft}
                onChange={(event) => setPriorityDraft(event.target.value)}
                className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-foreground focus-visible:ring-amber-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2 rounded-xl"
            onClick={() => {
              const matchedDept = departments.find((d: any) => d.department_key === departmentDraft)
              updateTicket({
                departmentId: matchedDept ? matchedDept.id : null,
                status: statusDraft,
                priority: priorityDraft,
                assignedTo: assignedToDraft || null
              })
            }}
            disabled={saving}
          >
            Update Ticket Settings
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-background/60 border-border/60">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Internal note</p>
          <Textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Add internal context, department handoff, or investigation notes..." className="min-h-[120px] bg-background/60" />
          <select aria-label="Internal note visibility" value={noteVisibility} onChange={(event) => setNoteVisibility(event.target.value)} className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm">
            <option value="internal">Internal</option>
            <option value="department">Department</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <Button variant="secondary" onClick={addNote} disabled={saving || !noteDraft.trim()} className="w-full">
            Save Internal Note
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-background/60 border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Latest notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
              No internal notes yet.
            </div>
          ) : (
            notes.slice(0, 5).map((note) => (
              <div key={note.id} className="rounded-2xl border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">{new Date(note.created_at).toLocaleString()}</p>
                <p className="mt-2 text-sm leading-6">{note.note}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}