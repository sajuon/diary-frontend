// /home/dori/diary-frontend/app/(appshell)/profile/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import ProfileScreen from "@/components/profile-screen"
import { apiClient } from "@/lib/api"

type BirthProfile = {
  birth_date?: string
  birth_time?: string
  birth_place?: string
} | null

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

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setErrorMsg(null)

      try {
        const p = await apiClient.getBirthProfile()
        setProfile((p ?? null) as BirthProfile)
      } catch (e) {
        console.error("Failed to load profile:", e)
      }

      try {
        try {
          const d = await apiClient.getDashboard()
          setDashboardData((d ?? null) as DashboardData)
        } catch (dashErr) {
          console.warn("getDashboard failed. fallback to getMe()", dashErr)

          const me = (await apiClient.getMe()) as MeResponse

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

        const status = typeof e?.status === "number" ? e.status : null
        const msg =
          typeof e?.message === "string"
            ? e.message
            : "대시보드 로드 실패"

        setErrorMsg(msg)

        if (status === 401) {
          router.replace("/login")
          return
        }
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [router])

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