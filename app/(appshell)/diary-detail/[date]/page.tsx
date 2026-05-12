"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import DiaryDetailScreen from "@/components/diary-detail-screen"
import { apiClient } from "@/lib/api"

interface DiaryDetailResponse {
  id: number
  user_id: number
  entry_date: string
  content: string
  weather?: string | null
  mood_tags?: string[]
  summary_tag?: string | null
  created_at: string
  updated_at: string
}

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

export default function DiaryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const date = String(params.date)

  const [diary, setDiary] = useState<DiaryDetailResponse | null>(null)
  const [letter, setLetter] = useState<LetterDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [letterGenerating, setLetterGenerating] = useState(false)

  const loadDiaryAndLetter = async () => {
    try {
      const diaryData = await apiClient.getDiaryByDate(date)
      const typedDiary = diaryData as DiaryDetailResponse
      setDiary(typedDiary)

      const month = date.slice(0, 7)
      const lettersData = (await apiClient.getLetters(month)) as LetterDetailResponse[]

      const matchedLetter =
        lettersData.find((item) => item.diary_entry_id === typedDiary.id) ??
        lettersData.find((item) => item.letter_date === date) ??
        null

      setLetter(matchedLetter)
    } catch (error) {
      console.error("Failed to load diary detail:", error)
      setDiary(null)
      setLetter(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date)

    if (!isValidDate) {
      router.replace("/")
      return
    }

    if (date) {
      loadDiaryAndLetter()
    }
  }, [date, router])

  const navigate = (screen: string, params?: Record<string, unknown>) => {
    if (screen === "diary-detail" && params?.date) {
      router.push(`/diary-detail/${params.date}`)
      return
    }

    if (screen === "letter-detail" && params?.letter) {
      const letterId = params.letter as { id?: number } | number
      const resolvedId = typeof letterId === "object" ? letterId.id : letterId
      router.push(`/letter-detail/${resolvedId}`)
      return
    }

    router.push(`/${screen}`)
  }

  const handleGenerateLetterWithPearl = async () => {
    try {
      setLetterGenerating(true)

      const generatedLetter = (await apiClient.generateLetterWithPearl(
        date
      )) as LetterDetailResponse

      setLetter(generatedLetter)

      router.push(`/letter-detail/${generatedLetter.id}`)
    } catch (error: any) {
      console.error("Failed to generate letter with pearl:", error)
      alert(error?.message || "해도리 답장 생성에 실패했습니다.")
    } finally {
      setLetterGenerating(false)
    }
  }

  const handleUpdateDiary = async (data: {
    content: string
    weather?: string
    mood_tags: string[]
  }) => {
    try {
      const updated = await apiClient.updateDiary(date, {
        content: data.content,
        weather: data.weather || diary?.weather || "sunny",
        mood_tags: data.mood_tags,
      })

      const typedUpdated = updated as DiaryDetailResponse
      setDiary(typedUpdated)

      await loadDiaryAndLetter()
    } catch (error) {
      console.error("Failed to update diary:", error)
      alert("일기 수정에 실패했습니다.")
    }
  }

  const handleDeleteDiary = async () => {
    try {
      await apiClient.deleteDiary(date)
      router.push("/diary")
    } catch (error) {
      console.error("Failed to delete diary:", error)
      alert("일기 삭제에 실패했습니다.")
    }
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

  if (!diary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>일기를 불러올 수 없어요.</p>
      </div>
    )
  }

  return (
    <DiaryDetailScreen
      onNavigate={navigate}
      date={date}
      diary={diary}
      letter={letter}
      onUpdateDiary={handleUpdateDiary}
      onDeleteDiary={handleDeleteDiary}
      onGenerateLetterWithPearl={handleGenerateLetterWithPearl}
      letterGenerating={letterGenerating}
    />
  )
}