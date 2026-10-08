// /home/dori/diary-frontend/app/(appshell)/home/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import HomeScreen from "@/components/home-screen"
import { apiClient, ApiError } from "@/lib/api"
import { handlePearlReward } from "@/lib/pearl-events"

type BirthProfile = {
  birth_date?: string
  birth_time?: string
  birth_place?: string
} | null

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

function getKstTodayString() {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

function buildUrlWithParams(
  pathname: string,
  params?: Record<string, unknown>
) {
  if (!params || Object.keys(params).length === 0) {
    return pathname
  }

  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      searchParams.set(key, String(value))
    }
  })

  const queryString = searchParams.toString()

  if (!queryString) {
    return pathname
  }

  return `${pathname}?${queryString}`
}

function buildDiaryUrl(params?: Record<string, unknown>) {
  if (!params || Object.keys(params).length === 0) {
    return "/diary"
  }

  const searchParams = new URLSearchParams()

  if (params.initialQuestion) {
    searchParams.set("question", String(params.initialQuestion))
  }

  if (params.initialQuestionDate) {
    searchParams.set("questionDate", String(params.initialQuestionDate))
  }

  if (params.initialQuestionSource) {
    searchParams.set("questionSource", String(params.initialQuestionSource))
  }

  const queryString = searchParams.toString()

  if (!queryString) {
    return "/diary"
  }

  return `/diary?${queryString}`
}

export default function HomePage() {
  const router = useRouter()

  const [dashboardData, setDashboardData] = useState<DashboardData>(null)
  const [todayFortune, setTodayFortune] = useState<TodayFortune>(null)
  const [purchases, setPurchases] = useState<PurchaseItem[]>([])
  const [profile, setProfile] = useState<BirthProfile>(null)

  const [loading, setLoading] = useState(true)
  const [isFortuneLoading, setIsFortuneLoading] = useState(false)

  const API_BASE_URL = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "", [])

  const loadSavedTodayFortune = async (token: string) => {
    const today = getKstTodayString()

    const res = await fetch(
      `${API_BASE_URL}/api/fortune?from_date=${today}&to_date=${today}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        cache: "no-store",
      }
    )

    if (!res.ok) {
      throw new Error("저장된 오늘의 흐름을 불러오지 못했습니다.")
    }

    const fortunes = (await res.json()) as TodayFortune[]

    if (Array.isArray(fortunes) && fortunes.length > 0) {
      return fortunes[0]
    }

    return null
  }

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

        await apiClient.getMe()

        // 출석 보상: 하루 첫 접속 시 +2 진주 (실패해도 홈 화면은 그대로 진행)
        apiClient
          .checkIn()
          .then(handlePearlReward)
          .catch((err) => console.warn("check-in failed", err))

        const [
          dashboardResult,
          purchasesResult,
          profileResult,
          savedTodayFortuneResult,
        ] = await Promise.allSettled([
          apiClient.getDashboard(),
          apiClient.getUserPurchases(),
          apiClient.getBirthProfile(),
          loadSavedTodayFortune(token),
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

        if (profileResult.status === "fulfilled") {
          setProfile((profileResult.value ?? null) as BirthProfile)
        } else {
          console.error("Failed to load profile:", profileResult.reason)
          setProfile(null)
        }

        if (savedTodayFortuneResult.status === "fulfilled") {
          setTodayFortune(savedTodayFortuneResult.value as TodayFortune)
        } else {
          console.error(
            "Failed to load saved today fortune:",
            savedTodayFortuneResult.reason
          )
          setTodayFortune(null)
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
  }, [router, API_BASE_URL])

  const handleOpenTodayFlow = async () => {
    if (isFortuneLoading) return false

    if (todayFortune) {
      return true
    }

    try {
      setIsFortuneLoading(true)

      const fortune = await apiClient.getTodayFortune()
      handlePearlReward(fortune)
      setTodayFortune(fortune as TodayFortune)
      return true
    } catch (error: any) {
      const message = error?.message || "오늘의 하루를 불러오지 못했어요."

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
    console.log("[HOME PAGE NAVIGATE TRACE]", {
      screen,
      params,
    })

    if (screen === "diary-detail" && params?.date) {
      router.push(`/diary-detail/${params.date}`)
      return
    }

    if (screen === "letter-detail" && params?.letter) {
      const letterId = (params.letter as any).id || params.letter
      router.push(`/letter-detail/${letterId}`)
      return
    }

    if (screen === "diary") {
      router.push(buildDiaryUrl(params))
      return
    }

    router.push(buildUrlWithParams(`/${screen}`, params))
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
      profile={profile}
    />
  )
}