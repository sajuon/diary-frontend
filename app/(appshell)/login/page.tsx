// /home/dori/diary-frontend/app/login/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import {
  clearAccessToken,
  getStoredAccessToken,
  getStoredRefreshToken,
  storeTokens,
} from "@/lib/auth-storage"
import LoginScreen from "@/components/login-screen"

export default function LoginPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // TWA는 시작 URL이 /login이라 루트(page.tsx)의 인증 체크를 거치지 않는다.
    // 그래서 여기서도 동일하게 세션 복구를 시도한다.
    const bootstrap = async () => {
      try {
        const accessToken = getStoredAccessToken()
        const refreshToken = getStoredRefreshToken()

        // 저장된 토큰이 하나도 없으면 바로 로그인 화면
        if (!accessToken && !refreshToken) {
          setIsChecking(false)
          return
        }

        if (accessToken) {
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
        setIsChecking(false)
      } catch {
        clearAccessToken()
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

  return <LoginScreen />
}