"use client"

import { useEffect, useState } from "react"
import { Gift, Plus, Edit, Trash2, Users, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

type CashbackProgram = {
  id: string
  name: string
  description: string
  program_type: string
  discount_percentage: number
  max_discount_amount: number | null
  min_order_amount: number
  valid_after_rides: number
  valid_for_rides_count: number
  expiry_days: number | null
  start_date: string | null
  end_date: string | null
  terms: string | null
  image_url: string | null
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

type CashbackStats = {
  totalUsers: number
  totalCashbackEarned: number
  totalCashbackUsed: number
}

export function AdminCashbackConsole() {
  const [programs, setPrograms] = useState<CashbackProgram[]>([])
  const [stats, setStats] = useState<CashbackStats>({ totalUsers: 0, totalCashbackEarned: 0, totalCashbackUsed: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<CashbackProgram | null>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    programType: "first_ride",
    discountPercentage: 10,
    maxDiscountAmount: 500,
    minOrderAmount: 0,
    validAfterRides: 0,
    validForRidesCount: 1,
    expiryDays: 30,
    startDate: "",
    endDate: "",
    terms: "",
    imageUrl: "",
    priority: 0,
    isActive: true,
  })

  async function load() {
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch("/api/admin/cashback", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || "Could not load cashback programs")
      setPrograms(payload.programs || [])
      setStats(payload.stats || { totalUsers: 0, totalCashbackEarned: 0, totalCashbackUsed: 0 })
    } catch (error: any) {
      setMessage(error?.message || "Could not load cashback programs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const url = editingProgram ? `/api/admin/cashback?id=${editingProgram.id}` : "/api/admin/cashback"
      const method = editingProgram ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          programType: form.programType,
          discountPercentage: form.discountPercentage,
          maxDiscountAmount: form.maxDiscountAmount,
          minOrderAmount: form.minOrderAmount,
          validAfterRides: form.validAfterRides,
          validForRidesCount: form.validForRidesCount,
          expiryDays: form.expiryDays,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          terms: form.terms,
          imageUrl: form.imageUrl,
          priority: form.priority,
        }),
      })
      
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || "Could not save cashback program")
      
      setMessage(editingProgram ? "Cashback program updated successfully" : "Cashback program created successfully")
      setDialogOpen(false)
      setEditingProgram(null)
      resetForm()
      await load()
    } catch (error: any) {
      setMessage(error?.message || "Could not save cashback program")
    } finally {
      setSaving(false)
    }
  }

  async function deleteProgram(id: string) {
    if (!confirm("Are you sure you want to delete this cashback program?")) return
    
    try {
      const response = await fetch(`/api/admin/cashback?id=${id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) throw new Error("Could not delete cashback program")
      
      setMessage("Cashback program deleted successfully")
      await load()
    } catch (error: any) {
      setMessage(error?.message || "Could not delete cashback program")
    }
  }

  function openEditDialog(program: CashbackProgram) {
    setEditingProgram(program)
    setForm({
      name: program.name,
      description: program.description,
      programType: program.program_type,
      discountPercentage: program.discount_percentage,
      maxDiscountAmount: program.max_discount_amount || 500,
      minOrderAmount: program.min_order_amount,
      validAfterRides: program.valid_after_rides,
      validForRidesCount: program.valid_for_rides_count,
      expiryDays: program.expiry_days || 30,
      startDate: program.start_date || "",
      endDate: program.end_date || "",
      terms: program.terms || "",
      imageUrl: program.image_url || "",
      priority: program.priority,
      isActive: program.is_active,
    })
    setDialogOpen(true)
  }

  function resetForm() {
    setForm({
      name: "",
      description: "",
      programType: "first_ride",
      discountPercentage: 10,
      maxDiscountAmount: 500,
      minOrderAmount: 0,
      validAfterRides: 0,
      validForRidesCount: 1,
      expiryDays: 30,
      startDate: "",
      endDate: "",
      terms: "",
      imageUrl: "",
      priority: 0,
      isActive: true,
    })
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingProgram(null)
    resetForm()
  }

  const formatMoney = (value: number) => `₦${value.toLocaleString()}`

  return (
    <main className="min-h-screen bg-[#f8f5ef] px-4 py-6 text-[#24150f] md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#c96b1c]">Operations</p>
            <h1 className="font-serif text-4xl font-bold text-[#9f3b12]">Cashback Management</h1>
            <p className="mt-2 max-w-3xl text-sm text-[#6b5a50]">
              Manage customer cashback programs including first ride bonuses and spin wheel rewards.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingProgram(null); }} className="bg-[#ff8a00] text-black hover:bg-[#f59e0b]">
                <Plus className="mr-2 h-4 w-4" />
                New Program
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProgram ? "Edit Cashback Program" : "Create Cashback Program"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Program Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="First Ride Bonus"
                    />
                  </div>
                  <div>
                    <Label htmlFor="programType">Program Type</Label>
                    <Select value={form.programType} onValueChange={(value) => setForm({ ...form, programType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first_ride">First Ride Bonus</SelectItem>
                        <SelectItem value="spin_wheel">Spin Wheel Reward</SelectItem>
                        <SelectItem value="referral">Referral Bonus</SelectItem>
                        <SelectItem value="special">Special Promotion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Get 10% off your first ride"
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      value={form.discountPercentage}
                      onChange={(e) => setForm({ ...form, discountPercentage: Number(e.target.value) })}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxDiscountAmount">Max Discount (₦)</Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      value={form.maxDiscountAmount}
                      onChange={(e) => setForm({ ...form, maxDiscountAmount: Number(e.target.value) })}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minOrderAmount">Min Order Amount (₦)</Label>
                    <Input
                      id="minOrderAmount"
                      type="number"
                      value={form.minOrderAmount}
                      onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="validAfterRides">Valid After Rides</Label>
                    <Input
                      id="validAfterRides"
                      type="number"
                      value={form.validAfterRides}
                      onChange={(e) => setForm({ ...form, validAfterRides: Number(e.target.value) })}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="validForRidesCount">Valid For Rides Count</Label>
                    <Input
                      id="validForRidesCount"
                      type="number"
                      value={form.validForRidesCount}
                      onChange={(e) => setForm({ ...form, validForRidesCount: Number(e.target.value) })}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiryDays">Expiry Days</Label>
                    <Input
                      id="expiryDays"
                      type="number"
                      value={form.expiryDays}
                      onChange={(e) => setForm({ ...form, expiryDays: Number(e.target.value) })}
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    value={form.terms}
                    onChange={(e) => setForm({ ...form, terms: e.target.value })}
                    placeholder="Terms and conditions for this cashback program"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://example.com/cashback-image.png"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active</Label>
                  <Switch
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button onClick={save} disabled={saving} className="bg-[#ff8a00] text-black hover:bg-[#f59e0b]">
                    {saving ? "Saving..." : editingProgram ? "Update Program" : "Create Program"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {message ? <div className="rounded-lg border border-[#f5c78b] bg-[#fff7ed] px-4 py-3 text-sm font-semibold text-[#8a3a0b]">{message}</div> : null}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-[#efd8c3] bg-white p-5 shadow-sm">
            <Users className="mb-3 h-6 w-6 text-[#ff8a00]" />
            <p className="text-sm text-[#6b5a50]">Total Users</p>
            <p className="mt-2 text-3xl font-black">{stats.totalUsers}</p>
            <p className="text-xs text-[#8b7468]">Users with cashback stats</p>
          </div>
          <div className="rounded-lg border border-[#efd8c3] bg-white p-5 shadow-sm">
            <DollarSign className="mb-3 h-6 w-6 text-[#00a896]" />
            <p className="text-sm text-[#6b5a50]">Total Earned</p>
            <p className="mt-2 text-3xl font-black">{formatMoney(stats.totalCashbackEarned)}</p>
            <p className="text-xs text-[#8b7468]">Total cashback earned</p>
          </div>
          <div className="rounded-lg border border-[#efd8c3] bg-white p-5 shadow-sm">
            <Gift className="mb-3 h-6 w-6 text-[#2563eb]" />
            <p className="text-sm text-[#6b5a50]">Total Used</p>
            <p className="mt-2 text-3xl font-black">{formatMoney(stats.totalCashbackUsed)}</p>
            <p className="text-xs text-[#8b7468]">Total cashback redeemed</p>
          </div>
        </section>

        <section className="rounded-lg border border-[#efd8c3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Cashback Programs</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-[#8b7468]">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Discount</th>
                  <th className="py-2">Valid After</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Created</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((program) => (
                  <tr key={program.id} className="border-t border-[#f4e6da]">
                    <td className="py-3 font-semibold">{program.name}</td>
                    <td className="capitalize">{program.program_type.replace('_', ' ')}</td>
                    <td>{program.discount_percentage}%{program.max_discount_amount ? ` (max ${formatMoney(program.max_discount_amount)})` : ''}</td>
                    <td>{program.valid_after_rides} rides</td>
                    <td>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        program.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {program.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(program.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(program)}
                          className="h-8 px-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteProgram(program.id)}
                          className="h-8 px-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && !programs.length ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#8b7468]">No cashback programs found. Create one to get started.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}