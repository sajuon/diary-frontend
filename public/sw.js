self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener("push", (event) => {
  let data = {
    title: "해도리",
    body: "새 알림이 도착했어.",
    url: "/",
  }

  try {
    if (event.data) {
      const text = event.data.text()

      try {
        const parsed = JSON.parse(text)
        data = {
          title: parsed.title || "해도리",
          body: parsed.body || "새 알림이 도착했어.",
          url: parsed.url || "/",
        }
      } catch {
        data = {
          title: "해도리",
          body: text || "새 알림이 도착했어.",
          url: "/",
        }
      }
    }
  } catch (e) {
    console.error("Failed to read push data:", e)
  }

  console.log("SW push received:", data)

  event.waitUntil(
    self.registration
      .showNotification(data.title, {
        body: data.body,
        data: { url: data.url },
        requireInteraction: true,
      })
      .then(() => {
        console.log("SW showNotification success")
      })
      .catch((err) => {
        console.error("SW showNotification failed:", err)
      })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification?.data?.url || "/"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})