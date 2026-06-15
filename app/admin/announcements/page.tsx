"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import {
  Megaphone,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  ShieldAlert,
  Loader2,
  Pin,
  MapPin,
  Calendar
} from "lucide-react"

interface Announcement {
  id: string
  title: string
  content: string
  category: "service_update" | "traffic_alert" | "milestone" | "notice"
  severity: "info" | "warning" | "critical" | "success"
  affected_zones: string[]
  is_pinned: boolean
  created_at: string
  created_by: string | null
}

export default function AnnouncementsAdminPage() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formCategory, setFormCategory] = useState<"service_update" | "traffic_alert" | "milestone" | "notice">("notice")
  const [formSeverity, setFormSeverity] = useState<"info" | "warning" | "critical" | "success">("info")
  const [formZones, setFormZones] = useState("")
  const [formIsPinned, setFormIsPinned] = useState(false)

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("status_updates")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (err: any) {
      setError(err.message || "Failed to load announcements")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchAnnouncements()
    }
  }, [user])

  const openCreateForm = () => {
    setEditingId(null)
    setFormTitle("")
    setFormContent("")
    setFormCategory("notice")
    setFormSeverity("info")
    setFormZones("")
    setFormIsPinned(false)
    setIsFormOpen(true)
  }

  const openEditForm = (item: Announcement) => {
    setEditingId(item.id)
    setFormTitle(item.title)
    setFormContent(item.content)
    setFormCategory(item.category)
    setFormSeverity(item.severity)
    setFormZones(item.affected_zones ? item.affected_zones.join(", ") : "")
    setFormIsPinned(item.is_pinned || false)
    setIsFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle || !formContent) return
    setSubmitting(true)

    const zonesArray = formZones
      ? formZones.split(",").map((z) => z.trim()).filter((z) => z.length > 0)
      : []

    const payload = {
      title: formTitle,
      content: formContent,
      category: formCategory,
      severity: formSeverity,
      affected_zones: zonesArray,
      is_pinned: formIsPinned,
      created_by: user?.id || null
    }

    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from("status_updates")
          .update(payload)
          .eq("id", editingId)
        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase
          .from("status_updates")
          .insert([payload])
        if (error) throw error
      }

      setIsFormOpen(false)
      fetchAnnouncements()
    } catch (err: any) {
      alert(err.message || "Failed to save announcement")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return
    try {
      const { error } = await supabase
        .from("status_updates")
        .delete()
        .eq("id", id)

      if (error) throw error
      fetchAnnouncements()
    } catch (err: any) {
      alert(err.message || "Failed to delete announcement")
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <ShieldAlert className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-primary animate-pulse" />
            Announcements & Status
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Publish status updates, traffic alerts, milestones, and notices to the status website and push to users.
          </p>
        </div>

        {!isFormOpen && (
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/95 transition shadow-sm hover:shadow cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            Create Announcement
          </button>
        )}
      </div>

      {/* Editor Form Modal Panel */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 rounded-2xl bg-card border border-primary/20 shadow-md relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              <h3 className="font-bold text-lg font-serif">
                {editingId ? "Edit Announcement" : "New Announcement"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. System Maintenance Scheduled"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Content / Details
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Describe the announcement details clearly..."
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition resize-y"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e: any) => setFormCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition"
                    >
                      <option value="notice">Notice</option>
                      <option value="service_update">Service Update</option>
                      <option value="traffic_alert">Traffic Alert</option>
                      <option value="milestone">Milestone</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">
                      Severity / Type
                    </label>
                    <select
                      value={formSeverity}
                      onChange={(e: any) => setFormSeverity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition"
                    >
                      <option value="info">Info (Blue)</option>
                      <option value="success">Success (Green)</option>
                      <option value="warning">Warning (Amber)</option>
                      <option value="critical">Critical (Red)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Affected Zones (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ikeja, Lekki, Victoria Island (Leave empty for all)"
                    value={formZones}
                    onChange={(e) => setFormZones(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="is_pinned"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="h-5 w-5 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                  <label htmlFor="is_pinned" className="text-sm font-medium text-foreground select-none cursor-pointer flex items-center gap-1.5">
                    <Pin className="h-4 w-4 text-primary" />
                    Pin to top of Status Dashboard
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-border mt-4">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-2.5 bg-muted border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-muted/80 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/95 transition shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {editingId ? "Update" : "Publish"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcements List / Admin Panel */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-muted/20">
          <h3 className="font-bold text-foreground font-serif">Published Announcements</h3>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium">Fetching announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-60" />
            <p className="font-medium">No announcements published yet.</p>
            <p className="text-xs mt-1">Click the create button above to publish your first update.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:bg-muted/10 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="mt-1 shrink-0">{getSeverityIcon(item.severity)}</div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-base text-foreground flex items-center gap-1.5">
                        {item.title}
                        {item.is_pinned && <Pin className="h-3.5 w-3.5 text-primary fill-primary" />}
                      </h4>
                      <span className="text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full capitalize">
                        {item.category.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-sm mt-2 whitespace-pre-wrap">
                      {item.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                      {item.affected_zones && item.affected_zones.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          Zones: {item.affected_zones.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-start shrink-0">
                  <button
                    onClick={() => openEditForm(item)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition cursor-pointer border border-border/50"
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition cursor-pointer border border-destructive/20"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
