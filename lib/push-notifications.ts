"use client"

const BUILT_VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

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

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

function browserDiagnostics() {
  return {
    secureContext: window.isSecureContext,
    protocol: window.location.protocol,
    host: window.location.host,
    permission: "Notification" in window ? Notification.permission : "unsupported",
    serviceWorker: "serviceWorker" in navigator,
    pushManager: "PushManager" in window,
    userAgent: navigator.userAgent,
  }
}

async function getVapidPublicKey() {
  try {
    const response = await fetch("/api/admin/push/public-key", {
      cache: "no-store",
      credentials: "include",
    })
    const result = await response.json().catch(() => ({}))
    if (response.ok && result?.publicKey) return String(result.publicKey)
  } catch (error) {
    console.warn("[CK] Failed to fetch runtime VAPID key, falling back to built key:", error)
  }

  return BUILT_VAPID_PUBLIC_KEY
}

async function assertPushSupport() {
  if (!window.isSecureContext) {
    throw new Error("Browser push requires HTTPS. Use https://admin.charterkeke.com or localhost.")
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers")
  }

  if (!("PushManager" in window)) {
    throw new Error("This browser does not support web push notifications")
  }

  const vapidPublicKey = await getVapidPublicKey()

  if (!vapidPublicKey) {
    throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured")
  }

  const key = urlBase64ToUint8Array(vapidPublicKey)
  if (key.byteLength !== 65) {
    throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is invalid. Regenerate the VAPID key pair and redeploy.")
  }

  return key
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.log("[CK] Service workers are not supported")
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    })
    await registration.update().catch(() => undefined)
    await navigator.serviceWorker.ready
    console.log("[CK] Service Worker registered successfully")
    return registration
  } catch (error) {
    console.error("[CK] Service Worker registration failed:", error)
    throw new Error("Could not register the browser notification service worker")
  }
}

async function createPushSubscription(
  registration: ServiceWorkerRegistration,
  applicationServerKey: Uint8Array
) {
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: toArrayBuffer(applicationServerKey),
  })
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  try {
    const applicationServerKey = await assertPushSupport()
    let registration = await registerServiceWorker()
    if (!registration) return null

    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      try {
        subscription = await createPushSubscription(registration, applicationServerKey)
      } catch (error: any) {
        if (error?.name !== "AbortError") throw error

        console.warn("[CK] Push service rejected subscription, retrying with the ready service worker", browserDiagnostics())
        registration = await navigator.serviceWorker.ready
        const existingAfterReady = await registration.pushManager.getSubscription().catch(() => null)
        if (existingAfterReady) {
          subscription = existingAfterReady
        } else {
          subscription = await createPushSubscription(registration, applicationServerKey)
        }
      }
      console.log("[CK] Push subscription created")
    }

    return subscription
  } catch (error) {
    console.error("[CK] Failed to subscribe to push notifications:", error, browserDiagnostics())
    throw error instanceof Error ? error : new Error("Could not create browser push subscription")
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      console.log("[CK] Unsubscribed from push notifications")
      return true
    }

    return false
  } catch (error) {
    console.error("[CK] Failed to unsubscribe:", error)
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
