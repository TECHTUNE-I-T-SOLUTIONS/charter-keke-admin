"use client"

import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Gift, Users, TrendingUp, AlertCircle, Loader } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

function DriverReferralsContent() {
  const { data: session } = useSession()
  const { user: contextUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [referralData, setReferralData] = useState<any>(null)
  const [referrals, setReferrals] = useState<any[]>([])
  const [copied, setCopied] = useState(false)

  const user = session?.user
    ? {
        id: (session.user as any).id || "",
        email: session.user.email || "",
        firstName: (session.user as any).firstName || "User",
      }
    : contextUser

  useEffect(() => {
    if (!user?.id) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const referralsRes = await fetch("/api/driver/referrals")
        const referralsData = await referralsRes.json()

        setReferralData(referralsData.referralCode)
        setReferrals(referralsData.referrals || [])
      } catch (error) {
        console.error("Failed to fetch referrals:", error)
        toast.error("Failed to load referrals")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  const handleCopyCode = () => {
    if (referralData?.referral_code) {
      navigator.clipboard.writeText(referralData.referral_code)
      setCopied(true)
      toast.success("Referral code copied!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading your referrals...</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: "Total Referrals",
      value: referralData?.total_referrals || 0,
      icon: <Users className="h-5 w-5" />,
      color: "from-primary to-primary/70",
    },
    {
      label: "Active Referrals",
      value: referralData?.active_referrals || 0,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "from-emerald-500 to-emerald-400",
    },
    {
      label: "Total Rewards",
      value: `₦${(referralData?.total_rewards || 0).toLocaleString()}`,
      icon: <Gift className="h-5 w-5" />,
      color: "from-amber-500 to-amber-400",
    },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <AnimatedSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0 pb-24 lg:pb-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
              Driver Referral Program
            </h1>
            <p className="text-muted-foreground mt-1">
              Invite other drivers and earn rewards
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * idx }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <div
                        className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} text-white`}
                      >
                        {stat.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Referral Code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardHeader>
                <CardTitle>Your Referral Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                  <code className="flex-1 font-mono text-lg font-bold">
                    {referralData?.referral_code || "N/A"}
                  </code>
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Share this code with other drivers. Both of you get ₦5,000 when they complete their first 10 rides!
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Referrals List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Your Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                {referrals.length === 0 ? (
                  <div className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No referrals yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start inviting drivers to earn rewards!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {referrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {referral.referee?.first_name}{" "}
                            {referral.referee?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {referral.referee?.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              referral.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }
                          >
                            {referral.status}
                          </Badge>
                          <p className="text-sm font-bold mt-1 text-primary">
                            ₦{(referral.reward_amount || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function DriverReferralsPage() {
  return (
    <ProtectedRoute>
      <DriverReferralsContent />
    </ProtectedRoute>
  )
}


