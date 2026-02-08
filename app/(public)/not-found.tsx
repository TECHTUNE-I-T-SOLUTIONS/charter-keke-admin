"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { XCircle, Home, ArrowLeft, Phone } from "lucide-react"

export default function PublicNotFound() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      {/* Animated Background */}
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
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Destination Not Found</h2>
              <p className="text-muted-foreground text-base">
                It seems you've gone off the map! This page doesn't exist or has been removed.
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            {/* Info Box */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm text-muted-foreground">
                🗺️ Let us help you find your way. Check out what we have available below!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/" className="block">
                <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 gap-2 h-11">
                  <Home className="h-5 w-5" />
                  Go Home
                </Button>
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <Link href="/how-it-works" className="block">
                  <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/10 h-10 text-sm">
                    How It Works
                  </Button>
                </Link>
                <Link href="/contact" className="block">
                  <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/10 gap-1 h-10 text-sm">
                    <Phone className="h-4 w-4" />
                    Contact
                  </Button>
                </Link>
              </div>

              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="w-full hover:bg-primary/5 gap-2 h-10"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            </div>

            {/* Footer */}
            <div className="text-xs text-muted-foreground">
              <p>Questions? <Link href="/help" className="text-primary hover:underline font-medium">Get Help</Link></p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
