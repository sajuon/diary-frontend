"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import ProfileScreen from "@/components/profile-screen"
import { apiClient } from "@/lib/api"

type BirthProfile = { birth_date?: string } | null

type DashboardData = {
  diary_stats: {
    consecutive_days: number
    total_diaries: number
    has_today?: boolean
  }
} | null

type MeResponse = {
  id: number
  email: string | null
  nickname: string
  profile_image: string | null
  provider: string
  provider_id: string
  pearls: number
  created_at: string
  updated_at: string
  streak_n: number
  has_today: boolean
  total_diaries: number
}

export default function ProfilePage() {
  const router = useRouter()

  const [profile, setProfile] = useState<BirthProfile>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData>(null)

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ✅ localStorage에 토큰이 없다면 인증이 안된 상태일 확률이 큼
  const accessToken = useMemo(() => {
    if (typeof window === "undefined") return null
    return window.localStorage.getItem("access_token")
  }, [])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setErrorMsg(null)

      // 토큰이 없으면 /profile 들어와도 데이터 요청이 401 날 수 있음
      if (!accessToken) {
        setLoading(false)
        setErrorMsg("로그인이 필요합니다. (access_token 없음)")
        router.replace("/login")
        return
      }

      try {
        // 1) 프로필(생년월일 등) 로드
        const p = await apiClient.getBirthProfile()
        setProfile((p ?? null) as BirthProfile)
      } catch (e) {
        console.error("Failed to load profile:", e)
        // 프로필 로드 실패해도 대시보드는 계속 시도
      }

      try {
        // 2) 대시보드 로드 (기존 API가 있다면 우선 사용)
        try {
          const d = await apiClient.getDashboard()
          // 기대 구조: { diary_stats: { consecutive_days, total_diaries } }
          setDashboardData((d ?? null) as DashboardData)
        } catch (dashErr) {
          console.warn("getDashboard failed. fallback to getMe()", dashErr)

          // ✅ 폴백: /api/users/me 기반으로 기록 현황 구성
          // apiClient에 getMe()가 없으면 아래 부분은 apiClient.get("/api/users/me") 같은 걸로 바꿔야 함
          const me = (await (apiClient as any).getMe?.()) as MeResponse | undefined

          if (!me) {
            throw new Error("apiClient.getMe()가 없거나 /api/users/me 호출이 실패했습니다.")
          }

          setDashboardData({
            diary_stats: {
              consecutive_days: Number(me.streak_n ?? 0),
              total_diaries: Number(me.total_diaries ?? 0),
              has_today: Boolean(me.has_today),
            },
          })
        }
      } catch (e: any) {
        console.error("Failed to load dashboard:", e)

        // 401이면 토큰 문제일 가능성이 큼 → 로그인으로 보냄
        const msg = typeof e?.message === "string" ? e.message : "대시보드 로드 실패"
        setErrorMsg(msg)
      } finally {
        setLoading(false)
      }
    }

    run()
    // accessToken이 바뀔 수도 있으니 의존성에 포함
  }, [router, accessToken])

  const navigate = (screen: string, params?: Record<string, unknown>) => {
    if (screen === "diary-detail" && params?.date) {
      router.push(`/diary-detail/${params.date}`)
      return
    }

    if (screen === "letter-detail" && params?.letter) {
      const letterId = (params.letter as any).id || params.letter
      router.push(`/letter-detail/${letterId}`)
      return
    }

    router.push(`/${screen}`)
  }

  const handleUpdateProfile = async (data: any) => {
    try {
      const updated = await apiClient.updateBirthProfile(data)
      setProfile((updated ?? null) as BirthProfile)
      alert("프로필이 업데이트되었습니다.")
    } catch (error) {
      console.error("Failed to update profile:", error)
      alert("프로필 업데이트에 실패했습니다.")
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

  if (errorMsg) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full p-6 rounded-xl border bg-white">
          <h2 className="text-lg font-semibold">데이터를 불러오지 못했어</h2>
          <p className="mt-2 text-sm text-gray-600 break-words">{errorMsg}</p>
          <div className="mt-4 flex gap-2">
            <button
              className="px-4 py-2 rounded-lg border"
              onClick={() => router.refresh()}
            >
              새로고침
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-black text-white"
              onClick={() => router.push("/login")}
            >
              로그인으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProfileScreen
      onNavigate={navigate}
      profile={profile}
      dashboardData={dashboardData}
      onUpdateProfile={handleUpdateProfile}
    />
  )
}