"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Search, UserPlus, Filter, Download, Loader2 } from "lucide-react"

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  role: string
  status: string
  created_at: string
  profile_picture_url?: string
}

function UsersContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
  })

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        const params = new URLSearchParams({
          limit: "50",
          offset: "0",
        })
        if (searchQuery) params.append("search", searchQuery)
        if (statusFilter) params.append("status", statusFilter)

        const response = await fetch(`/api/admin/users?${params}`)
        const data = await response.json()
        setUsers(data.users || [])
        setTotalUsers(data.count || 0)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(fetchUsers, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, statusFilter])

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats")
        const data = await response.json()
        setStats(data.users)
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-background pb-24">

      <main className="min-w-0 pt-16 lg:pl-0 lg:pt-0">
        <div className="mx-auto w-full max-w-[1600px] min-w-0 space-y-6 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0">
              <h1 className="break-words font-serif text-2xl font-bold text-foreground md:text-3xl">User Management</h1>
              <p className="mt-1 break-words text-muted-foreground">View and manage all registered users</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button variant="outline" className="border-primary/20 bg-transparent hover:bg-primary/10">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Card className="min-w-0 border-primary/10 bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <p className="break-words text-xl font-bold text-foreground sm:text-2xl">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </CardContent>
            </Card>
            <Card className="min-w-0 border-primary/10 bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <p className="break-words text-xl font-bold text-emerald-500 sm:text-2xl">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card className="min-w-0 border-primary/10 bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <p className="break-words text-xl font-bold text-amber-500 sm:text-2xl">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card className="min-w-0 border-primary/10 bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <p className="break-words text-xl font-bold text-red-500 sm:text-2xl">{stats.suspended}</p>
                <p className="text-sm text-muted-foreground">Suspended</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex min-w-0 flex-col gap-4 md:flex-row"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-primary/20"
              />
            </div>
            <select
              title="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background/50 px-4 py-2 text-sm text-foreground"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
            <Button variant="outline" className="border-primary/20 bg-transparent hover:bg-primary/10">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </motion.div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="min-w-0 overflow-hidden border-primary/10 bg-card/50 backdrop-blur">
              <CardContent className="p-0">
                <div className="hidden overflow-x-auto md:block">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow className="border-primary/10 hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 rounded-full bg-muted/50 mb-4">
                              <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-foreground mb-1">No users found</h3>
                            <p className="text-sm text-muted-foreground">Users will appear here once they register.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id} className="border-primary/10">
                          <TableCell className="font-medium">
                            {user.first_name} {user.last_name}
                          </TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell className="text-sm">{user.phone_number}</TableCell>
                          <TableCell>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                user.status === "active"
                                  ? "bg-emerald-500/20 text-emerald-500"
                                  : user.status === "pending"
                                    ? "bg-amber-500/20 text-amber-500"
                                    : "bg-red-500/20 text-red-500"
                              }`}
                            >
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{user.role}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>
                <div className="space-y-3 p-3 md:hidden">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="mb-4 rounded-full bg-muted/50 p-4">
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="mb-1 font-medium text-foreground">No users found</h3>
                      <p className="text-sm text-muted-foreground">Users will appear here once they register.</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="rounded-lg border border-primary/10 bg-background/60 p-4">
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-foreground">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="mt-1 break-all text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                              user.status === "active"
                                ? "bg-emerald-500/20 text-emerald-500"
                                : user.status === "pending"
                                  ? "bg-amber-500/20 text-amber-500"
                                  : "bg-red-500/20 text-red-500"
                            }`}
                          >
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="break-words text-foreground">{user.phone_number || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Role</p>
                            <p className="break-words text-foreground">{user.role}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">Joined</p>
                            <p className="text-foreground">{new Date(user.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main></div>
  )
}

export default function UsersPage() {
  return <UsersContent />
}
