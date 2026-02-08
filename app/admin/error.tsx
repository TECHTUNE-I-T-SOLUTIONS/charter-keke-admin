"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { AlertTriangle, RefreshCw, LayoutDashboard, ChevronDown, Copy, Check } from "lucide-react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: ErrorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyError = () => {
    const errorInfo = `Error: ${error.message}\nDigest: ${error.digest || "N/A"}`
    navigator.clipboard.writeText(errorInfo)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar space */}
      <div className="hidden lg:block w-64 flex-shrink-0" />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-card/50 backdrop-blur border-red-500/20">
            <CardContent className="p-8 space-y-6">
              {/* Header */}
              <div className="space-y-4 text-center">
                <motion.div
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="flex justify-center"
                >
                  <div className="p-6 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20">
                    <AlertTriangle className="h-16 w-16 text-red-500" />
                  </div>
                </motion.div>

                <div className="space-y-2">
                  <h1 className="text-4xl font-bold text-foreground font-serif">Admin Error</h1>
                  <h2 className="text-xl font-semibold text-red-500">Something Went Wrong</h2>
                  <p className="text-muted-foreground">
                    An error occurred in the admin panel. Our team has been notified.
                  </p>
                </div>
              </div>

              {/* Error Details */}
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 space-y-3">
                  <div className="text-sm">
                    <p className="font-mono text-xs text-red-500/70">ERROR MESSAGE</p>
                    <p className="text-foreground font-medium mt-1 line-clamp-2">
                      {error.message || "An unexpected error occurred"}
                    </p>
                  </div>

                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                    {isExpanded ? "Hide" : "Show"} Details
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-3 border-t border-red-500/20"
                    >
                      <div className="max-h-40 overflow-y-auto">
                        <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words">
{`Error: ${error.message}
Digest: ${error.digest || "N/A"}`}
                        </pre>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyError}
                        className="mt-3 text-xs gap-1"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={reset}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>

                <Link href="/admin/dashboard" className="block">
                  <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/10 gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
