"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { AlertTriangle, RefreshCw, Home, ChevronDown, Copy, Check } from "lucide-react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function PublicError({ error, reset }: ErrorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyError = () => {
    const errorInfo = `Error: ${error.message}\nDigest: ${error.digest || "N/A"}`
    navigator.clipboard.writeText(errorInfo)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-red-500/5 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <Card className="bg-card/80 backdrop-blur border-red-500/20 shadow-2xl">
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
                <h1 className="text-4xl md:text-5xl font-bold text-foreground font-serif">Oops!</h1>
                <h2 className="text-xl md:text-2xl font-semibold text-red-500">Something Went Wrong</h2>
                <p className="text-muted-foreground text-base max-w-sm mx-auto">
                  We're sorry! An unexpected error occurred. Please try again or contact our support team.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

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
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition w-full"
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
                          Copy Error
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Help Tips */}
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-2">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">💡 What you can do:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Refresh the page and try again</li>
                  <li>Clear your browser cache</li>
                  <li>Check your internet connection</li>
                  <li>Contact our support team</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={reset}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 gap-2 h-11"
              >
                <RefreshCw className="h-5 w-5" />
                Try Again
              </Button>

              <Link href="/">
                <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/10 gap-2 h-11">
                  <Home className="h-5 w-5" />
                  Go Home
                </Button>
              </Link>
            </div>

            {/* Footer */}
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>Need assistance? <Link href="/contact" className="text-primary hover:underline font-medium">Contact Us</Link></p>
              {error.digest && (
                <p className="font-mono text-red-500/50 break-all">Error ID: {error.digest}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
