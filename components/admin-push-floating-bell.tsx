"use client"

import { useEffect, useState } from "react"
import { Bell, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { requestNotificationPermission, subscribeToPushNotifications } from "@/lib/push-notifications"

export function AdminPushFloatingBell() {
  const [visible, setVisible] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    const check = async () => {
      if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) return
      if (Notification.permission === "denied") return
      const dismissed = localStorage.getItem("admin-push-bell-dismissed") === "true"
      if (dismissed) return

      const registration = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.ready.catch(() => null))
      const subscription = await registration?.pushManager.getSubscription()
      if (!subscription?.endpoint) {
        setVisible(true)
        return
      }

      const response = await fetch(`/api/admin/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
        cache: "no-store",
        credentials: "include",
      }).catch(() => null)
      const result = await response?.json().catch(() => null)
      setVisible(!result?.subscribed)
    }

    void check()
  }, [])

  const subscribe = async () => {
    try {
      setSubscribing(true)
      const permission = await requestNotificationPermission()
      if (permission !== "granted") {
        toast.error("Browser notifications were not allowed")
        return
      }

      let subscription: PushSubscription | null = null
      try {
        subscription = await subscribeToPushNotifications()
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) throw error
      }

      const response = await fetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(subscription ? subscription.toJSON() : { adoptExisting: true }),
      })
      const result = await response.json()
      if (!response.ok) {
        if (!subscription) {
          throw new Error("Chrome rejected localhost push subscription and no existing web subscription was available to adopt. Try after deploying on HTTPS.")
        }
        throw new Error(result?.error || "Failed to save push subscription")
      }

      toast.success("Admin notifications enabled")
      setVisible(false)
    } catch (error) {
      const message = error instanceof DOMException && error.name === "AbortError"
        ? "The browser push service rejected this subscription. Check HTTPS, private mode, and browser notification settings."
        : error instanceof Error
          ? error.message
          : "Failed to subscribe"
      toast.error(message)
    } finally {
      setSubscribing(false)
    }
  }

  const dismiss = () => {
    localStorage.setItem("admin-push-bell-dismissed", "true")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-24 right-5 z-50 flex items-center gap-2 rounded-full border border-primary/20 bg-background/95 p-2 shadow-2xl backdrop-blur">
      <Button size="icon" onClick={subscribe} disabled={subscribing} className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90">
        {subscribing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bell className="h-5 w-5" />}
      </Button>
      <button type="button" onClick={dismiss} className="rounded-full p-1 text-muted-foreground hover:text-foreground" aria-label="Dismiss push prompt">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
