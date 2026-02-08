"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { XCircle, LayoutDashboard, ArrowLeft } from "lucide-react"

export default function AdminNotFound() {
  const router = useRouter()
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar space */}
      <div className="hidden lg:block w-64 flex-shrink-0" />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="bg-card/50 backdrop-blur border-primary/10">
            <CardContent className="p-8 text-center space-y-6">
              {/* Icon */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="flex justify-center"
              >
                <div className="p-6 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20">
                <XCircle className="h-16 w-16 text-amber-500" />
                </div>
              </motion.div>

              {/* Content */}
              <div className="space-y-3">
                <h1 className="text-5xl font-bold text-foreground font-serif">404</h1>
                <h2 className="text-2xl font-semibold text-foreground">Admin Page Not Found</h2>
                <p className="text-muted-foreground">
                  This admin page doesn't exist or you don't have access to it.
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-2">
                <Link href="/admin/dashboard" className="block">
                  <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Back to Dashboard
                  </Button>
                </Link>

              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full border-primary/20 hover:bg-primary/10 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
