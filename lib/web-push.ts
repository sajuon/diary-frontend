import { apiClient } from "@/lib/api"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("이 브라우저는 서비스 워커를 지원하지 않아.")
  }

  const registration = await navigator.serviceWorker.register("/sw.js")
  return registration
}

export function getNotificationPermissionState(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined") return "unsupported"
  if (!("Notification" in window)) return "unsupported"
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    throw new Error("이 브라우저는 알림 기능을 지원하지 않아.")
  }

  const currentPermission = Notification.permission

  if (currentPermission === "granted") {
    return "granted"
  }

  if (currentPermission === "denied") {
    throw new Error(
      "브라우저에서 알림 권한이 차단되어 있어. 주소창 옆 사이트 설정에서 알림을 허용한 뒤 다시 시도해줘."
    )
  }

  const permission = await Notification.requestPermission()

  if (permission !== "granted") {
    if (permission === "denied") {
      throw new Error(
        "알림 권한이 거부되었어. 다시 허용하려면 브라우저 사이트 설정에서 알림을 허용해야 해."
      )
    }

    throw new Error("알림 권한이 허용되지 않았어.")
  }

  return permission
}

export async function getCurrentWebPushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null

  const registration = await navigator.serviceWorker.getRegistration("/sw.js")
  if (!registration) return null

  return registration.pushManager.getSubscription()
}

export async function subscribeWebPush(): Promise<PushSubscription> {
  const registration = await registerServiceWorker()
  await requestNotificationPermission()

  const { public_key } = await apiClient.getWebPushPublicKey()

  const existingSubscription = await registration.pushManager.getSubscription()
  if (existingSubscription) {
    await apiClient.subscribeWebPush({
      subscription: existingSubscription.toJSON(),
      user_agent: navigator.userAgent,
    })
    return existingSubscription
  }

  const applicationServerKey =
    urlBase64ToUint8Array(public_key) as unknown as BufferSource

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  })

  await apiClient.subscribeWebPush({
    subscription: subscription.toJSON(),
    user_agent: navigator.userAgent,
  })

  return subscription
}

export async function unsubscribeWebPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return

  const registration = await navigator.serviceWorker.getRegistration("/sw.js")
  if (!registration) return

  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  await apiClient.unsubscribeWebPush({
    endpoint: subscription.endpoint,
  })

  await subscription.unsubscribe()
}

export async function sendTestWebPush() {
  return apiClient.sendWebPushTest({
    title: "해도리 테스트 알림",
    body: "웹 푸시 연결이 정상적으로 완료됐어.",
    url: "/notification-settings",
  })
}