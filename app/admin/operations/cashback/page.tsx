"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Gift, Users, TrendingUp, Calendar, DollarSign, RefreshCw, Plus, Edit, Trash2, Eye, CheckCircle, XCircle, Clock } from "lucide-react"

export default function CashbackManagement() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [programs, setPrograms] = useState<any[]>([])
  const [rewards, setRewards] = useState<any[]>([])
  const [stats, setStats] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("programs")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<any>(null)
  const [newProgramDialog, setNewProgramDialog] = useState(false)
  const [formData, setFormData] = useState({
    program_type: '',
    discount_percentage: 0,
    is_active: true,
    expiry_days: 30,
    valid_after_rides: 1,
    valid_for_rides_count: 1,
    max_discount_amount: 0,
    description: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load programs
      const { data: programsData } = await supabase
        .from('cashback_programs')
        .select('*')
        .order('created_at', { ascending: false })
      
      // Load rewards
      const { data: rewardsData } = await supabase
        .from('user_cashback_rewards')
        .select(`
          *,
          cashback_programs (name, program_type, discount_percentage),
          users (email, first_name, last_name)
        `)
        .order('earned_at', { ascending: false })
        .limit(50)
      
      // Load stats
      const { data: statsData } = await supabase
        .from('user_cashback_stats')
        .select('*')
        .order('total_cashback_earned', { ascending: false })
        .limit(20)
      
      setPrograms(programsData || [])
      setRewards(rewardsData || [])
      setStats(statsData || [])
    } catch (error) {
      console.error('Failed to load cashback data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProgram = async () => {
    try {
      const { error } = await supabase
        .from('cashback_programs')
        .insert({
          program_type: formData.program_type,
          discount_percentage: formData.discount_percentage,
          is_active: formData.is_active,
          expiry_days: formData.expiry_days,
          valid_after_rides: formData.valid_after_rides,
          valid_for_rides_count: formData.valid_for_rides_count,
          max_discount_amount: formData.max_discount_amount,
          description: formData.description
        })
      
      if (error) throw error
      
      setNewProgramDialog(false)
      setFormData({
        program_type: '',
        discount_percentage: 0,
        is_active: true,
        expiry_days: 30,
        valid_after_rides: 1,
        valid_for_rides_count: 1,
        max_discount_amount: 0,
        description: ''
      })
      loadData()
    } catch (error) {
      console.error('Failed to create program:', error)
      alert('Failed to create program')
    }
  }

  const handleUpdateProgram = async () => {
    try {
      const { error } = await supabase
        .from('cashback_programs')
        .update({
          program_type: formData.program_type,
          discount_percentage: formData.discount_percentage,
          is_active: formData.is_active,
          expiry_days: formData.expiry_days,
          valid_after_rides: formData.valid_after_rides,
          valid_for_rides_count: formData.valid_for_rides_count,
          max_discount_amount: formData.max_discount_amount,
          description: formData.description
        })
        .eq('id', selectedProgram.id)
      
      if (error) throw error
      
      setEditDialogOpen(false)
      setSelectedProgram(null)
      loadData()
    } catch (error) {
      console.error('Failed to update program:', error)
      alert('Failed to update program')
    }
  }

  const handleDeleteProgram = async () => {
    try {
      const { error } = await supabase
        .from('cashback_programs')
        .delete()
        .eq('id', selectedProgram.id)
      
      if (error) throw error
      
      setDeleteDialogOpen(false)
      setSelectedProgram(null)
      loadData()
    } catch (error) {
      console.error('Failed to delete program:', error)
      alert('Failed to delete program')
    }
  }

  const formatMoney = (value: number) => `₦${value.toLocaleString()}`

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'earned':
        return <Badge className="bg-green-100 text-green-800">Earned</Badge>
      case 'used':
        return <Badge className="bg-blue-100 text-blue-800">Used</Badge>
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cashback Management</h1>
          <p className="text-muted-foreground">Manage cashback programs, rewards, and user statistics</p>
        </div>
        <Button onClick={loadData} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rewards.length}</div>
            <p className="text-xs text-muted-foreground">Issued rewards</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{programs.filter(p => p.is_active).length}</div>
            <p className="text-xs text-muted-foreground">Active programs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.length}</div>
            <p className="text-xs text-muted-foreground">Users with stats</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(stats.reduce((sum, stat) => sum + (stat.total_cashback_earned || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">Total cashback earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="stats">User Statistics</TabsTrigger>
        </TabsList>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Cashback Programs</h2>
            <Button onClick={() => setNewProgramDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Program
            </Button>
          </div>

          <div className="grid gap-4">
            {programs.map((program) => (
              <Card key={program.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{program.name || program.program_type}</CardTitle>
                      <CardDescription>{program.description || 'No description'}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedProgram(program)
                          setFormData({
                            program_type: program.program_type,
                            discount_percentage: program.discount_percentage,
                            is_active: program.is_active,
                            expiry_days: program.expiry_days,
                            valid_after_rides: program.valid_after_rides,
                            valid_for_rides_count: program.valid_for_rides_count,
                            max_discount_amount: program.max_discount_amount,
                            description: program.description || ''
                          })
                          setEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedProgram(program)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <p className="font-medium capitalize">{program.program_type}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Discount</Label>
                      <p className="font-medium">{program.discount_percentage}%</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Expiry</Label>
                      <p className="font-medium">{program.expiry_days} days</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Badge variant={program.is_active ? "default" : "secondary"}>
                        {program.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <h2 className="text-xl font-semibold">Issued Rewards</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Earned At</TableHead>
                  <TableHead>Expires At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reward.users?.first_name || 'Unknown'} {reward.users?.last_name || ''}</p>
                        <p className="text-xs text-muted-foreground">{reward.users?.email || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>{reward.cashback_programs?.name || reward.program_type}</TableCell>
                    <TableCell>{reward.discount_percentage}%</TableCell>
                    <TableCell>{getStatusBadge(reward.status)}</TableCell>
                    <TableCell>{new Date(reward.earned_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {reward.expires_at ? new Date(reward.expires_at).toLocaleDateString() : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* User Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          <h2 className="text-xl font-semibold">User Cashback Statistics</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Total Rides</TableHead>
                  <TableHead>Total Earned</TableHead>
                  <TableHead>Available Balance</TableHead>
                  <TableHead>First Ride Bonus</TableHead>
                  <TableHead>Spin Plays</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">User {stat.id.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>{stat.total_rides_completed}</TableCell>
                    <TableCell>{formatMoney(stat.total_cashback_earned)}</TableCell>
                    <TableCell>{formatMoney(stat.available_cashback_balance)}</TableCell>
                    <TableCell>
                      {stat.first_ride_bonus_earned ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell>{stat.spin_wheel_plays_count}</TableCell>
                    <TableCell>
                      {stat.last_cashback_earned_at ? new Date(stat.last_cashback_earned_at).toLocaleDateString() : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Program Dialog */}
      <Dialog open={newProgramDialog} onOpenChange={setNewProgramDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Program</DialogTitle>
            <DialogDescription>
              Create a new cashback program for users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Program Type</Label>
              <Select
                value={formData.program_type}
                onValueChange={(value) => setFormData({ ...formData, program_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_ride">First Ride Bonus</SelectItem>
                  <SelectItem value="spin_wheel">Spin Wheel</SelectItem>
                  <SelectItem value="referral">Referral Bonus</SelectItem>
                  <SelectItem value="loyalty">Loyalty Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Discount Percentage (%)</Label>
              <Input
                type="number"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) })}
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Expiry Days</Label>
              <Input
                type="number"
                value={formData.expiry_days}
                onChange={(e) => setFormData({ ...formData, expiry_days: parseInt(e.target.value) })}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Valid After Rides</Label>
              <Input
                type="number"
                value={formData.valid_after_rides}
                onChange={(e) => setFormData({ ...formData, valid_after_rides: parseInt(e.target.value) })}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Valid for Rides Count</Label>
              <Input
                type="number"
                value={formData.valid_for_rides_count}
                onChange={(e) => setFormData({ ...formData, valid_for_rides_count: parseInt(e.target.value) })}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Discount Amount (₦)</Label>
              <Input
                type="number"
                value={formData.max_discount_amount}
                onChange={(e) => setFormData({ ...formData, max_discount_amount: parseInt(e.target.value) })}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Program description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewProgramDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateProgram}>Create Program</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Program Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
            <DialogDescription>
              Update cashback program settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Program Type</Label>
              <Select
                value={formData.program_type}
                onValueChange={(value) => setFormData({ ...formData, program_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_ride">First Ride Bonus</SelectItem>
                  <SelectItem value="spin_wheel">Spin Wheel</SelectItem>
                  <SelectItem value="referral">Referral Bonus</SelectItem>
                  <SelectItem value="loyalty">Loyalty Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Discount Percentage (%)</Label>
              <Input
                type="number"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) })}
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Expiry Days</Label>
              <Input
                type="number"
                value={formData.expiry_days}
                onChange={(e) => setFormData({ ...formData, expiry_days: parseInt(e.target.value) })}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Valid After Rides</Label>
              <Input
                type="number"
                value={formData.valid_after_rides}
                onChange={(e) => setFormData({ ...formData, valid_after_rides: parseInt(e.target.value) })}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Valid for Rides Count</Label>
              <Input
                type="number"
                value={formData.valid_for_rides_count}
                onChange={(e) => setFormData({ ...formData, valid_for_rides_count: parseInt(e.target.value) })}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Discount Amount (₦)</Label>
              <Input
                type="number"
                value={formData.max_discount_amount}
                onChange={(e) => setFormData({ ...formData, max_discount_amount: parseInt(e.target.value) })}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Active</Label>
              <Select
                value={formData.is_active ? 'true' : 'false'}
                onValueChange={(value) => setFormData({ ...formData, is_active: value === 'true' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Program description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateProgram}>Update Program</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Program</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this cashback program? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProgram}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
