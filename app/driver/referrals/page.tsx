"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Copy, Share2, CheckCircle2, Car } from "lucide-react"

function DriverReferralsContent() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const referralLink = `https://easely.vercel.app/auth/register?ref=${user?.referralCode}&type=driver`

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success("Referral link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Drive with EASELY",
          text: "Join me as a driver on EASELY and start earning!",
          url: referralLink,
        })
      } catch {
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Driver Referrals</h1>
            <p className="text-muted-foreground mt-1">Invite other drivers and earn bonuses</p>
          </motion.div>

          {/* Referral Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-primary/20">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="p-4 rounded-full bg-gradient-to-r from-primary to-secondary text-white">
                    <Car className="h-8 w-8" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-xl font-semibold text-foreground mb-2">Your Driver Referral Code</h2>
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-background/80 border border-primary/20">
                      <span className="text-2xl font-mono font-bold text-primary tracking-wider">
                        {user?.referralCode}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopy}
                        className="text-primary hover:bg-primary/10"
                      >
                        {copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleShare} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Referral Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle>Your Referral Link</CardTitle>
                <CardDescription>Share this link with potential drivers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={referralLink}
                    readOnly
                    className="bg-background/50 border-primary/20 font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="border-primary/20 hover:bg-primary/10 shrink-0 bg-transparent"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-primary">0</p>
                  <p className="text-sm text-muted-foreground">Drivers Referred</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-secondary">₦0</p>
                  <p className="text-sm text-muted-foreground">Bonus Earned</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-emerald-500">0</p>
                  <p className="text-sm text-muted-foreground">Active Referrals</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function DriverReferralsPage() {
  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <DriverReferralsContent />
    </ProtectedRoute>
  )
}
