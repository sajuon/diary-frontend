"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import LetterDetailScreen from "@/components/letter-detail-screen"
import { apiClient } from "@/lib/api"

interface LetterDetailResponse {
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

export default function LetterDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [letter, setLetter] = useState<LetterDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLetter = async () => {
      try {
        await apiClient.markLetterAsRead(Number(id))
        const data = await apiClient.getLetterById(Number(id))
        setLetter(data as LetterDetailResponse)
      } catch (error) {
        console.error("Failed to load letter:", error)
        setLetter(null)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadLetter()
    }
  }, [id])

  const navigate = (screen: string, params?: Record<string, unknown>) => {
    if (screen === "diary-detail" && params?.date) {
      router.push(`/diary-detail/${params.date}`)
    } else if (screen === "letter-detail" && params?.letter) {
      const letterId = (params.letter as { id?: number } | number)
      const resolvedId =
        typeof letterId === "object" ? letterId.id : letterId
      router.push(`/letter-detail/${resolvedId}`)
    } else if (screen === "letterbox") {
      router.push("/letterbox")
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

  if (!letter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>편지를 불러올 수 없어요.</p>
      </div>
    )
  }

  return <LetterDetailScreen onNavigate={navigate} letter={letter as never} />
}