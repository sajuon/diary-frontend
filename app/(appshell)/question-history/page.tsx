"use client"

import { useRouter, useSearchParams } from "next/navigation"
import QuestionHistoryScreen from "@/components/question-history-screen"

export default function QuestionHistoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const date = searchParams.get("date") ?? undefined
  const diaryIdParam = searchParams.get("diary_id")
  const questionId = searchParams.get("question_id") ?? undefined
  const questionText = searchParams.get("question_text") ?? undefined

  const navigate = (screen: string, params?: Record<string, unknown>) => {
    if (screen === "diary-detail" && params?.date) {
      router.push(`/diary-detail/${params.date}?diary_type=question`)
      return
    }

    router.push(`/${screen}`)
  }

  return (
    <QuestionHistoryScreen
      onNavigate={navigate}
      date={date}
      diary_id={diaryIdParam ? Number(diaryIdParam) : undefined}
      question_id={questionId}
      question_text={questionText}
    />
  )
}