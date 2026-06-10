"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, X } from "lucide-react"
import {
  checkNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
} from "@/lib/push-notifications"
import { toast } from "sonner"

export function NotificationPrompt() {
  const pathname = usePathname()
  const [showPrompt, setShowPrompt] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return

    const checkPermission = async () => {
      const perm = await checkNotificationPermission()
      setPermission(perm)

      // Show prompt if permission hasn't been decided yet
      if (perm === "default") {
        const hasShownBefore = localStorage.getItem("notification-prompt-shown")
        if (!hasShownBefore) {
          setTimeout(() => setShowPrompt(true), 3000)
        }
      }
    }

    checkPermission()
  }, [pathname])

  if (pathname?.startsWith("/admin")) return null

  const handleEnable = async () => {
    const perm = await requestNotificationPermission()
    setPermission(perm)

    if (perm === "granted") {
      const subscription = await subscribeToPushNotifications()
      if (subscription) {
        toast.success("Push notifications enabled!")
      }
    } else {
      toast.error("Notification permission denied")
    }

    localStorage.setItem("notification-prompt-shown", "true")
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    localStorage.setItem("notification-prompt-shown", "true")
    setShowPrompt(false)
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-50"
        >
          <Card className="bg-card/95 backdrop-blur-xl border-primary/20 shadow-xl">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Enable Notifications</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Get notified about ride updates, driver arrivals, and special offers.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleEnable}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                      Enable
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleDismiss} className="hover:bg-muted">
                      Not Now
                    </Button>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
