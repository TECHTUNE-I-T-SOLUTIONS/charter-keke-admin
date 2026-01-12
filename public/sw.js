// Charter Keke Service Worker for Push Notifications
const CACHE_NAME = "charterkeke-v1"
const OFFLINE_URL = "/offline.html"

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching offline page")
      return cache.addAll([OFFLINE_URL])
    }),
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME).map((cacheName) => caches.delete(cacheName)),
      )
    }),
  )
  self.clients.claim()
})

// Push event - Handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("[SW] Push received")

  let data = {
    title: "Charter Keke",
    body: "You have a new notification",
    icon: "/logo.png",
    badge: "/logo.png",
    tag: "charterkeke-notification",
    data: { url: "/" },
  }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch (e) {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/logo.png",
    badge: data.badge || "/logo.png",
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    actions: [
      { action: "view", title: "View" },
      { action: "dismiss", title: "Dismiss" },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked")
  event.notification.close()

  const urlToOpen = event.notification.data?.url || "/"

  if (event.action === "dismiss") {
    return
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus()
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    }),
  )
})

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag)

  if (event.tag === "sync-rides") {
    event.waitUntil(syncRides())
  }
})

async function syncRides() {
  // Sync any pending ride bookings when back online
  console.log("[SW] Syncing rides...")
}

// Fetch event for offline support
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.match(OFFLINE_URL)
        })
      }),
    )
  }
})
