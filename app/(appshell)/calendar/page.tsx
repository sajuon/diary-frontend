// /home/dori/diary-frontend/app/(appshell)/calendar/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import CalendarScreen from "@/components/calendar-screen"
import { apiClient, type DiaryType } from "@/lib/api"

export type DiaryItem = {
  id: number
  user_id: number
  entry_date: string
  content: string
  weather?: string | null
  mood_tags?: string[] | null
  summary_tag?: string | null
  diary_type?: DiaryType | null
  question_text?: string | null
  created_at: string
  updated_at: string
}

function buildUrlWithParams(pathname: string, params?: Record<string, unknown>) {
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

function normalizeDiaryType(value: unknown): DiaryType {
  return value === "question" ? "question" : "free"
}

export default function CalendarPage() {
  const router = useRouter()
  const [diaries, setDiaries] = useState<DiaryItem[]>([])
  const [loading, setLoading] = useState(true)

  const currentDate = new Date()
  const initialYear = currentDate.getFullYear()
  const initialMonth = currentDate.getMonth() + 1

  useEffect(() => {
    const loadDiaries = async () => {
      try {
        const month = `${initialYear}-${String(initialMonth).padStart(2, "0")}`
        const data = await apiClient.getDiaries(month)
        setDiaries(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to load diaries:", error)
        setDiaries([])
      } finally {
        setLoading(false)
      }
    }

    loadDiaries()
  }, [initialYear, initialMonth])

  const navigate = (screen: string, params?: Record<string, unknown>) => {
    if (screen === "diary-detail" && params?.date) {
      const diaryType = normalizeDiaryType(params.diary_type)

      router.push(`/diary-detail/${params.date}?diary_type=${diaryType}`)
      return
    }

    if (screen === "diary") {
      router.push(buildUrlWithParams("/diary", params))
      return
    }

    if (screen === "emotion-report") {
      router.push("/emotion-report")
      return
    }

    if (screen === "letter-detail" && params?.letter) {
      const letterId =
        (params.letter as { id?: number | string })?.id ?? params.letter

      router.push(`/letter-detail/${letterId}`)
      return
    }

    router.push(buildUrlWithParams(`/${screen}`, params))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <CalendarScreen
      onNavigate={navigate}
      initialDiaries={diaries}
      initialYear={initialYear}
      initialMonth={initialMonth}
    />
  )
}