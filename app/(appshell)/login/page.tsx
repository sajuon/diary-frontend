"use client"

import { useRouter } from "next/navigation"
import LoginScreen from "@/components/login-screen"

export default function LoginPage() {
  const router = useRouter()

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

  return <LoginScreen onNavigate={navigate} />
}