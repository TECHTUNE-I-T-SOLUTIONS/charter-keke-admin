"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { XCircle, LogIn, ArrowLeft } from "lucide-react"

export default function AuthNotFound() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="bg-card/80 backdrop-blur border-primary/10 shadow-2xl">
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
              <h1 className="text-5xl md:text-6xl font-bold text-foreground font-serif">404</h1>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Page Not Found</h2>
              <p className="text-muted-foreground text-base">
                The authentication page you're looking for doesn't exist.
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/auth/user/login" className="block">
                <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 gap-2 h-11">
                  <LogIn className="h-5 w-5" />
                  Sign In
                </Button>
              </Link>

              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full border-primary/20 hover:bg-primary/10 gap-2 h-11"
              >
                <ArrowLeft className="h-5 w-4" />
                Back Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
