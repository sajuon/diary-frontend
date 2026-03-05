"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import LetterboxScreen from "@/components/letterbox-screen"
import { apiClient } from "@/lib/api"

export default function LetterboxPage() {
  const router = useRouter()
  const [letters, setLetters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLetters = async () => {
      try {
        const currentDate = new Date()
        const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
        const data = await apiClient.getLetters(month)
        setLetters(data)
      } catch (error) {
        console.error('Failed to load letters:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLetters()
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

  const handleGenerateLetter = async () => {
    try {
      const newLetter = await apiClient.generateTodayLetter()
      // 목록 새로고침
      const currentDate = new Date()
      const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      const updatedData = await apiClient.getLetters(month)
      setLetters(updatedData)
    } catch (error) {
      console.error('Failed to generate letter:', error)
      alert('편지 생성에 실패했습니다.')
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

  return <LetterboxScreen onNavigate={navigate} letters={letters} onGenerateLetter={handleGenerateLetter} />
}