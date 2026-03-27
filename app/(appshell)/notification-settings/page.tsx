"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import NotificationSettingsScreen from "@/components/notification-settings-screen"
import { apiClient } from "@/lib/api"
import {
  getCurrentWebPushSubscription,
  sendTestWebPush,
  subscribeWebPush,
  unsubscribeWebPush,
} from "@/lib/web-push"

type NotificationSettings = {
  push_enabled: boolean
  fortune_enabled: boolean
  diary_reminder_enabled: boolean
  reply_enabled: boolean
  timezone: string
}

export default function NotificationSettingsPage() {
  const router = useRouter()

  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [webPushEnabled, setWebPushEnabled] = useState(false)
  const [webPushLoading, setWebPushLoading] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? window.localStorage.getItem("access_token")
            : null

        if (!token) {
          alert("로그인이 필요해.")
          router.replace("/login")
          return
        }

        const data = await apiClient.getNotificationSettings()
        setSettings(data as NotificationSettings)

        const subscription = await getCurrentWebPushSubscription()
        setWebPushEnabled(!!subscription)
      } catch (error: any) {
        console.error("Failed to load notification settings:", error)

        const message =
          typeof error?.message === "string"
            ? error.message
            : "알림 설정을 불러오지 못했어."

        alert(message)

        if (
          message.includes("401") ||
          message.toLowerCase().includes("unauthorized")
        ) {
          router.replace("/login")
        }
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [router])

  const handleBack = () => {
    router.push("/profile")
  }

  const handleChange = (
    key: keyof NotificationSettings,
    value: boolean | string
  ) => {
    setSettings((prev) => {
      if (!prev) return prev

      if (key === "push_enabled") {
        const nextPushEnabled = Boolean(value)

        if (!nextPushEnabled) {
          return {
            ...prev,
            push_enabled: false,
            fortune_enabled: false,
            diary_reminder_enabled: false,
            reply_enabled: false,
          }
        }

        return {
          ...prev,
          push_enabled: true,
        }
      }

      return {
        ...prev,
        [key]: value,
      }
    })
  }

  const handleSave = async () => {
    if (!settings) return

    try {
      setSaving(true)
      const updated = await apiClient.updateNotificationSettings(settings)
      setSettings(updated as NotificationSettings)
      alert("알림 설정이 저장됐어.")
    } catch (error: any) {
      console.error("Failed to update notification settings:", error)

      const message =
        typeof error?.message === "string"
          ? error.message
          : "알림 설정 저장에 실패했어."

      alert(message)

      if (
        message.includes("401") ||
        message.toLowerCase().includes("unauthorized")
      ) {
        router.replace("/login")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEnableWebPush = async () => {
    try {
      setWebPushLoading(true)
      await subscribeWebPush()
      setWebPushEnabled(true)
      alert("웹 알림 연결이 완료됐어.")
    } catch (error: any) {
      console.error("Failed to enable web push:", error)

      const message =
        typeof error?.message === "string"
          ? error.message
          : "웹 알림 연결에 실패했어."

      alert(message)
    } finally {
      setWebPushLoading(false)
    }
  }

  const handleDisableWebPush = async () => {
    try {
      setWebPushLoading(true)
      await unsubscribeWebPush()
      setWebPushEnabled(false)
      alert("웹 알림 연결을 해제했어.")
    } catch (error: any) {
      console.error("Failed to disable web push:", error)

      const message =
        typeof error?.message === "string"
          ? error.message
          : "웹 알림 해제에 실패했어."

      alert(message)
    } finally {
      setWebPushLoading(false)
    }
  }

  const handleTestWebPush = async () => {
    try {
      setWebPushLoading(true)
      const result = await sendTestWebPush()
      console.log("Web push test result:", result)
      alert("테스트 알림 요청을 보냈어.")
    } catch (error: any) {
      console.error("Failed to send web push test:", error)

      const message =
        typeof error?.message === "string"
          ? error.message
          : "테스트 알림 전송에 실패했어."

      alert(message)
    } finally {
      setWebPushLoading(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <NotificationSettingsScreen
      settings={settings}
      saving={saving}
      webPushEnabled={webPushEnabled}
      webPushLoading={webPushLoading}
      onBack={handleBack}
      onChange={handleChange}
      onSave={handleSave}
      onEnableWebPush={handleEnableWebPush}
      onDisableWebPush={handleDisableWebPush}
      onTestWebPush={handleTestWebPush}
    />
  )
}