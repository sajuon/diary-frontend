"use client"

import { useRouter } from "next/navigation"
import { useEffect, useCallback, useState } from "react"
import LetterboxScreen from "@/components/letterbox-screen"
import { apiClient } from "@/lib/api"

interface LetterApiResponse {
  id: number
  user_id: number
  diary_entry_id: number
  letter_date: string
  content: string
  element_hint?: Record<string, unknown> | null
  model?: string | null
  is_read: boolean
  read_at?: string | null
  created_at: string
  updated_at: string
}

export default function LetterboxPage() {
  const router = useRouter()
  const [letters, setLetters] = useState<LetterApiResponse[]>([])
  const [loading, setLoading] = useState(true)

  const loadLetters = useCallback(async () => {
    try {
      const currentDate = new Date()
      const month = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}`

      const data = await apiClient.getLetters(month)
      setLetters(data as LetterApiResponse[])
    } catch (error) {
      console.error("Failed to load letters:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLetters()
  }, [loadLetters])

  const navigate = (screen: string, params?: Record<string, unknown>) => {
    if (screen === "diary-detail" && params?.date) {
      router.push(`/diary-detail/${params.date}`)
    } else if (screen === "letter-detail" && params?.letter) {
      const letterValue = params.letter as { id?: number } | number
      const letterId =
        typeof letterValue === "object" ? letterValue.id : letterValue
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

  return <LetterboxScreen onNavigate={navigate} letters={letters} />
}