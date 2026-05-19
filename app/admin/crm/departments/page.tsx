"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Building2,
  Plus,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Tags,
  BadgeAlert,
  CheckCircle2,
  X,
  Mail,
  ChevronRight
} from "lucide-react"

interface Department {
  id: string
  department_key: string
  department_name: string
  description: string | null
  email_alias: string | null
  route_priority: number
  is_active: boolean
  created_at: string
}

export default function CrmDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Form states
  const [departmentKey, setDepartmentKey] = useState("")
  const [departmentName, setDepartmentName] = useState("")
  const [description, setDescription] = useState("")
  const [emailAlias, setEmailAlias] = useState("")
  const [routePriority, setRoutePriority] = useState("100")

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/crm/departments")
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to load departments")
      setDepartments(data.departments || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load departments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDepartments()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!departmentKey.trim() || !departmentName.trim()) {
      toast.error("Department key and name are required")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/admin/crm/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentKey: departmentKey.trim().toLowerCase(),
          departmentName: departmentName.trim(),
          description: description.trim() || null,
          emailAlias: emailAlias.trim().toLowerCase() || null,
          routePriority: parseInt(routePriority, 10) || 100,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to create department")

      toast.success(`Department "${data.department.department_name}" created successfully!`)
      
      // Reset form
      setDepartmentKey("")
      setDepartmentName("")
      setDescription("")
      setEmailAlias("")
      setRoutePriority("100")
      setIsCreateOpen(false)
      
      // Refresh list
      void fetchDepartments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create department")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto h-full">
      {/* Upper Title Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-800/10 dark:bg-amber-500/5 px-3 py-1 text-xs text-amber-800 dark:text-amber-400 backdrop-blur">
            <Building2 className="h-3.5 w-3.5" />
            CRM Department Configuration
          </div>
          <h1 className="mt-3 text-3xl font-serif font-bold text-foreground">
            Operational Departments
          </h1>
          <p className="mt-1 text-muted-foreground text-sm max-w-2xl">
            Configure auto-routing targets, routing priorities, and outbound aliases. Inbound support emails will be dispatched dynamically based on these settings.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-md shadow-amber-500/10 gap-2 h-11 px-5"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Department
        </Button>
      </div>

      {/* Main List Layout */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-2" />
          <p className="text-muted-foreground text-sm">Syncing operations queues...</p>
        </div>
      ) : departments.length === 0 ? (
        <Card className="border-dashed border-primary/20 bg-background dark:bg-slate-950/20 p-8 text-center">
          <ShieldAlert className="h-12 w-12 mx-auto text-amber-500/50 mb-3" />
          <h3 className="text-lg font-semibold">No Departments Active</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
            Departments define ticket ownership, administrative focus groups, and Namecheap support aliases. Define one now to start routing tickets.
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            variant="outline"
            className="mt-4 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            Create Your First Department
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {departments.map((dept, idx) => (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Card className="bg-background dark:bg-slate-950/40 backdrop-blur-md border-primary/10 shadow-xl hover:border-amber-500/20 transition-all group overflow-hidden relative">
                  {/* Decorative glow bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/80 to-yellow-600/30" />
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-lg font-semibold truncate group-hover:text-amber-400 transition-colors">
                          {dept.department_name}
                        </CardTitle>
                        <span className="inline-block mt-1 font-mono text-[10px] tracking-wider bg-amber-500/10 dark:bg-slate-900 border border-primary/10 text-muted-foreground px-2 py-0.5 rounded uppercase">
                          {dept.department_key}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground dark:text-emerald-500" />
                        <span className="text-[10px] text-muted-foreground dark:text-emerald-500 font-bold uppercase tracking-wider">
                          Active
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-xs leading-relaxed min-h-[40px]">
                      {dept.description || "No description provided for this operational queue."}
                    </p>

                    <div className="space-y-2 bg-slate-200 dark:bg-slate-900/60 p-3 rounded-lg border border-primary/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-amber-500" />
                          Alias email
                        </span>
                        <span className="font-semibold text-foreground truncate max-w-[180px]">
                          {dept.email_alias || "support@charterkeke.com"}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Tags className="h-3.5 w-3.5 text-amber-500" />
                          Priority rank
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-bold rounded text-[10px]">
                          {dept.route_priority}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Slide-over Create Form Modal Overlay */}
      <AnimatePresence>
        {isCreateOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="fixed inset-0 z-50 bg-black backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:max-w-lg md:mx-auto z-50 rounded-2xl bg-background dark:bg-slate-950/90 border border-amber-500/25 p-6 shadow-2xl backdrop-blur-xl shadow-black/80"
            >
              <div className="flex items-center justify-between pb-4 border-b border-primary/10">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-amber-500" />
                  <h2 className="text-xl font-serif font-bold text-foreground">
                    New Priority Department
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                >
                  <X className="h-4.5 w-4.5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dept-name">Department Name</Label>
                  <Input
                    id="dept-name"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    placeholder="e.g. Finance & Billings"
                    className="bg-slate-100 dark:bg-slate-900 border-primary/10 text-sm focus-visible:ring-amber-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="dept-key">Department Key</Label>
                    <Input
                      id="dept-key"
                      value={departmentKey}
                      onChange={(e) => setDepartmentKey(e.target.value)}
                      placeholder="e.g. billing"
                      className="bg-slate-100 dark:bg-slate-900 border-primary/10 text-sm font-mono focus-visible:ring-amber-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="dept-priority">Routing Priority</Label>
                    <Input
                      id="dept-priority"
                      type="number"
                      value={routePriority}
                      onChange={(e) => setRoutePriority(e.target.value)}
                      placeholder="e.g. 100"
                      className="bg-slate-100 dark:bg-slate-900 border-primary/10 text-sm font-mono focus-visible:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dept-email">Custom Support Alias Email</Label>
                  <Input
                    id="dept-email"
                    type="email"
                    value={emailAlias}
                    onChange={(e) => setEmailAlias(e.target.value)}
                    placeholder="billing@charterkeke.com"
                    className="bg-slate-100 dark:bg-slate-900 border-primary/10 text-sm focus-visible:ring-amber-500"
                  />
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5 leading-normal">
                    Assigned incoming support messages to this alias automatically route here.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dept-description">Description</Label>
                  <Textarea
                    id="dept-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain the operational boundaries and core focus of this department queue..."
                    className="bg-slate-100 dark:bg-slate-900 border-primary/10 text-xs min-h-[80px] focus-visible:ring-amber-500"
                  />
                </div>

                <div className="pt-3 border-t border-primary/10 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateOpen(false)}
                    className="h-10 hover:bg-slate-900/60"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-md shadow-amber-500/10 px-5 h-10"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      "Create Department"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
