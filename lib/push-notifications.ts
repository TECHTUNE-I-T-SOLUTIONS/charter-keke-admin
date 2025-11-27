"use client"

const VAPID_PUBLIC_KEY = "BAU0Sa9i4kfJdEJGpK5oGU3N2zEe_puzFqfelO9w4y0PbUxNr5MFs2cyE9ZMX3ZmUjDa-PeJnYueyfRZcB57QS4"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.log("[v0] Service workers are not supported")
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    })
    console.log("[v0] Service Worker registered successfully")
    return registration
  } catch (error) {
    console.error("[v0] Service Worker registration failed:", error)
    return null
  }
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  try {
    const registration = await registerServiceWorker()
    if (!registration) return null

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      console.log("[v0] Push subscription created")
    }

    return subscription
  } catch (error) {
    console.error("[v0] Failed to subscribe to push notifications:", error)
    return null
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      console.log("[v0] Unsubscribed from push notifications")
      return true
    }

    return false
  } catch (error) {
    console.error("[v0] Failed to unsubscribe:", error)
    return false
  }
}

export async function checkNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied"
  }
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied"
  }

  const permission = await Notification.requestPermission()
  return permission
}

export function showLocalNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/logo.png",
      badge: "/logo.png",
      ...options,
    })
  }
}
