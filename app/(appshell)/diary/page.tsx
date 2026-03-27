"use client"

import { useRouter } from "next/navigation"
import DiaryScreen from "@/components/diary-screen"

export default function DiaryPage() {
  const router = useRouter()

  const navigate = (screen: string, params?: Record<string, unknown>) => {
    if (screen === "diary-detail" && params?.date) {
      router.push(`/diary-detail/${params.date}`)
    } else if (screen === "letter-detail" && params?.letter) {
      const letterId = (params.letter as any).id || params.letter
      router.push(`/letter-detail/${letterId}`)
    } else {
      router.push(`/${screen}`)
    }
  }

  return <DiaryScreen onNavigate={navigate} />
}