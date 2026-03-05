"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import DiaryDetailScreen from "@/components/diary-detail-screen"
import { apiClient } from "@/lib/api"

export default function DiaryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const date = String(params.date)
  const [diary, setDiary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
    if (!isValidDate) {
      router.replace('/')
      return
    }
    const loadDiary = async () => {
      try {
        const data = await apiClient.getDiaryByDate(date)
        setDiary(data as any)
      } catch (error) {
        console.error('Failed to load diary:', error)
        setDiary(null)
      } finally {
        setLoading(false)
      }
    }
    if (date) {
      loadDiary()
    }
  }, [date, router])

  const navigate = (screen: string, params?: Record<string, unknown>) => {
    if (screen === "diary-detail" && params?.date) {
      router.push(`/diary-detail/${params.date}`)
    } else if (screen === "letter-detail" && params?.letter) {
      // Assuming letter has an id
      const letterId = (params.letter as any).id || params.letter
      router.push(`/letter-detail/${letterId}`)
    } else {
      router.push(`/${screen}`)
    }
  }

  const handleUpdateDiary = async (data: { content: string; mood_tags: string[] }) => {
    try {
      const updated = await apiClient.updateDiary(date, data)
      setDiary(updated as any)
    } catch (error) {
      console.error('Failed to update diary:', error)
      alert('일기 수정에 실패했습니다.')
    }
  }

  const handleDeleteDiary = async () => {
    try {
      await apiClient.deleteDiary(date)
      router.push('/diary')
    } catch (error) {
      console.error('Failed to delete diary:', error)
      alert('일기 삭제에 실패했습니다.')
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
    <DiaryDetailScreen
      onNavigate={navigate}
      date={date}
      onUpdateDiary={handleUpdateDiary}
      onDeleteDiary={handleDeleteDiary}
    />
  )
}