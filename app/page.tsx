// /home/dori/diary-frontend/app/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import {
  clearAccessToken,
  getStoredAccessToken,
  storeTokens,
} from "@/lib/auth-storage"

export default function App() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = getStoredAccessToken()

        if (token) {
          try {
            await apiClient.getMe()
            router.replace("/home")
            return
          } catch {
            // 아래 refresh 시도로 진행
          }
        }

        const refreshResult = await apiClient.refresh()

        if (refreshResult?.access_token) {
          storeTokens(
            refreshResult.access_token,
            refreshResult.refresh_token,
            true
          )
          await apiClient.getMe()
          router.replace("/home")
          return
        }

        clearAccessToken()
        router.replace("/login")
      } catch {
        clearAccessToken()
        router.replace("/login")
      } finally {
        setIsChecking(false)
      }
    }

    bootstrap()
  }, [router])

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F6F2]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-[#C9856A]" />
          <p className="mt-4 text-sm text-[#7C6F68]">로그인 상태 확인 중...</p>
        </div>
      </div>
    )
  }

  return null
}