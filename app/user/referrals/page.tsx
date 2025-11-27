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
import { Gift, Copy, Share2, Users, Percent, CheckCircle2 } from "lucide-react"

function ReferralsContent() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const referralLink = `https://easely.vercel.app/auth/register?ref=${user?.referralCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success("Referral link copied!", {
      description: "Share it with your friends to earn rewards.",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join EASELY",
          text: "Get 5% off your first ride with my referral code!",
          url: referralLink,
        })
      } catch (error) {
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  const steps = [
    { icon: <Share2 className="h-5 w-5" />, title: "Share Your Code", desc: "Send your unique code to friends" },
    { icon: <Users className="h-5 w-5" />, title: "Friends Sign Up", desc: "They register using your code" },
    { icon: <Percent className="h-5 w-5" />, title: "Both Get Rewarded", desc: "You both get 5% off next booking" },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Referral Program</h1>
            <p className="text-muted-foreground mt-1">Invite friends and earn rewards together</p>
          </motion.div>

          {/* Referral Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-primary/20 overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="p-4 rounded-full bg-gradient-to-r from-primary to-secondary text-white">
                    <Gift className="h-8 w-8" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-xl font-semibold text-foreground mb-2">Your Referral Code</h2>
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
                    Share Now
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
                <CardDescription>Share this link directly with your friends</CardDescription>
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

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>Earn rewards in 3 simple steps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {steps.map((step, index) => (
                    <div key={step.title} className="text-center">
                      <div className="relative inline-block mb-4">
                        <div className="p-4 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 text-primary">
                          {step.icon}
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold flex items-center justify-center">
                          {index + 1}
                        </div>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-primary">0</p>
                  <p className="text-sm text-muted-foreground">Friends Referred</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-secondary">₦0</p>
                  <p className="text-sm text-muted-foreground">Total Rewards</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-emerald-500">0</p>
                  <p className="text-sm text-muted-foreground">Pending Rewards</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function ReferralsPage() {
  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <ReferralsContent />
    </ProtectedRoute>
  )
}
