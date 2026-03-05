"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import DiaryScreen from "@/components/diary-screen"
import { apiClient } from "@/lib/api"

export default function DiaryPage() {
  const router = useRouter()
  const [diaries, setDiaries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDiaries = async () => {
      try {
        const currentDate = new Date()
        const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
        const data = await apiClient.getDiaries(month)
        setDiaries(data)
      } catch (error) {
        console.error('Failed to load diaries:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDiaries()
  }, [])

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

  const handleCreateDiary = async (data: { content: string; mood_tags: string[] }) => {
    try {
      await apiClient.createDiary(data)
      // 성공 후 목록 새로고침
      const currentDate = new Date()
      const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      const updatedData = await apiClient.getDiaries(month)
      setDiaries(updatedData)
    } catch (error) {
      console.error('Failed to create diary:', error)
      alert('일기 저장에 실패했습니다.')
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

  return <DiaryScreen onNavigate={navigate} onCreateDiary={handleCreateDiary} diaries={diaries} />
}