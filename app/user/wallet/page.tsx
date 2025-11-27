"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Wallet, Plus, CreditCard, Loader2 } from "lucide-react"

function WalletContent() {
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const quickAmounts = [500, 1000, 2000, 5000]

  const handleTopUp = async () => {
    if (!amount || Number.parseFloat(amount) < 100) {
      toast.error("Minimum top-up amount is ₦100")
      return
    }

    setIsLoading(true)

    // Simulate Paystack payment
    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast.success("Payment gateway ready!", {
      description: "Paystack integration will be activated on launch.",
    })

    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">My Wallet</h1>
            <p className="text-muted-foreground mt-1">Manage your EASELY wallet and transactions</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-1"
            >
              <Card className="bg-gradient-to-br from-primary to-secondary text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('/placeholder.svg?height=200&width=400')] opacity-10" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-full bg-white/20">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <span className="font-medium">EASELY Wallet</span>
                  </div>
                  <p className="text-sm opacity-80 mb-1">Available Balance</p>
                  <p className="text-4xl font-bold mb-6">₦0.00</p>
                  <div className="flex items-center gap-2 text-sm opacity-80">
                    <CreditCard className="h-4 w-4" />
                    <span>{user?.email}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Up Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Top Up Wallet
                  </CardTitle>
                  <CardDescription>Add funds to your wallet using Paystack</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₦)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-background/50 border-primary/20 focus:border-primary text-lg py-6"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quick Select</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {quickAmounts.map((amt) => (
                        <Button
                          key={amt}
                          variant="outline"
                          onClick={() => setAmount(amt.toString())}
                          className={`border-primary/20 hover:bg-primary/10 ${amount === amt.toString() ? "bg-primary/10 border-primary" : ""}`}
                        >
                          ₦{amt.toLocaleString()}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleTopUp}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 py-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Pay with Paystack
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Transaction History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your recent wallet transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <Wallet className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">No transactions yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Your transaction history will appear here after your first top-up.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function WalletPage() {
  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <WalletContent />
    </ProtectedRoute>
  )
}
