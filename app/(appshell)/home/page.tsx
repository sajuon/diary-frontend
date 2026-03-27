"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import HomeScreen from "@/components/home-screen"
import { apiClient, ApiError } from "@/lib/api"

type DashboardLetter = {
  id: number
  letter_date: string
  is_read: boolean
  read_at?: string | null
}

type DashboardData = {
  diary_stats?: {
    consecutive_days?: number
    total_diaries?: number
    has_today?: boolean
  }
  today_diary?: unknown
  today_letter?: DashboardLetter | null
  recent_letters?: unknown[]
  [key: string]: unknown
} | null

type TodayFortune = {
  love?: string
  study?: string
  caution?: string
  good_thing?: string
  ritual?: string
  element_hint?: Record<string, unknown> | null
  model?: string | null
} | null

type PurchaseItem = {
  id?: number
  item_id?: number
  item?: {
    id?: number
    name?: string
    item_type?: string
    price?: number
  }
  purchase_date?: string
  [key: string]: unknown
}

export default function HomePage() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData>(null)
  const [todayFortune, setTodayFortune] = useState<TodayFortune>(null)
  const [purchases, setPurchases] = useState<PurchaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isFortuneLoading, setIsFortuneLoading] = useState(false)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? window.localStorage.getItem("access_token")
            : null

        if (!token) {
          router.replace("/login")
          return
        }

        // ✅ 먼저 인증 검증
        await apiClient.getMe()

        const [dashboardResult, purchasesResult] = await Promise.allSettled([
          apiClient.getDashboard(),
          apiClient.getUserPurchases(),
        ])

        if (dashboardResult.status === "fulfilled") {
          setDashboardData(dashboardResult.value as DashboardData)
        } else {
          console.error("Failed to load dashboard:", dashboardResult.reason)
        }

        if (purchasesResult.status === "fulfilled") {
          setPurchases((purchasesResult.value as PurchaseItem[]) ?? [])
        } else {
          console.error("Failed to load purchases:", purchasesResult.reason)
          setPurchases([])
        }
      } catch (error: any) {
        console.error("Failed to load home:", error)

        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem("access_token")
          router.replace("/login")
          return
        }

        router.replace("/login")
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [router])

  const handleOpenTodayFlow = async () => {
    if (isFortuneLoading) return false

    try {
      setIsFortuneLoading(true)

      const fortune = await apiClient.getTodayFortune()
      setTodayFortune(fortune as TodayFortune)
      return true
    } catch (error: any) {
      const message =
        error?.message || "오늘의 하루를 불러오지 못했어요."

      if (typeof message === "string" && message.includes("생년월일")) {
        alert("생년월일을 먼저 등록해주세요.")
        router.push("/profile")
        return false
      }

      alert("오늘의 하루를 불러오지 못했어요.")
      console.error("Failed to load today fortune:", error)
      return false
    } finally {
      setIsFortuneLoading(false)
    }
  }

  const navigate = (screen: string, params?: Record<string, unknown>) => {
    if (screen === "diary-detail" && params?.date) {
      router.push(`/diary-detail/${params.date}`)
    } else if (screen === "letter-detail" && params?.letter) {
      const letterId = (params.letter as any).id || params.letter
      router.push(`/letter-detail/${letterId}`)
    } else {
      router.push(`/${screen}`)
    }
  }

  if (loading) {
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
    <HomeScreen
      onNavigate={navigate}
      dashboardData={dashboardData}
      todayFortune={todayFortune}
      purchases={purchases}
      onOpenTodayFlow={handleOpenTodayFlow}
      isTodayFortuneLoading={isFortuneLoading}
    />
  )
}