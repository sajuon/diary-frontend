// /home/dori/diary-frontend/app/(appshell)/diary/page.tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import DiaryScreen from "@/components/diary-screen"

export default function DiaryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const question = searchParams.get("question")
  const questionDate = searchParams.get("questionDate")
  const questionSource = searchParams.get("questionSource")

  console.log("[DIARY PAGE TRACE]", {
    question,
    questionDate,
    questionSource,
  })

  const navigate = (screen: string, params?: Record<string, unknown>) => {
    console.log("[DIARY PAGE NAVIGATE TRACE]", {
      screen,
      params,
    })

    if (screen === "diary-detail" && params?.date) {
      router.push(`/diary-detail/${params.date}`)
      return
    }

    if (screen === "letter-detail" && params?.letter) {
      const letterId = (params.letter as any).id || params.letter
      router.push(`/letter-detail/${letterId}`)
      return
    }

    if (screen === "diary") {
      const query = new URLSearchParams()

      if (params?.initialQuestion) {
        query.set(
          "question",
          String(params.initialQuestion)
        )
      }

      if (params?.initialQuestionDate) {
        query.set(
          "questionDate",
          String(params.initialQuestionDate)
        )
      }

      if (params?.initialQuestionSource) {
        query.set(
          "questionSource",
          String(params.initialQuestionSource)
        )
      }

      router.push(`/diary?${query.toString()}`)
      return
    }

    router.push(`/${screen}`)
  }

  return (
    <DiaryScreen
      onNavigate={navigate}
      initialQuestion={question ?? undefined}
      initialQuestionDate={questionDate ?? undefined}
      initialQuestionSource={questionSource ?? undefined}
    />
  )
}