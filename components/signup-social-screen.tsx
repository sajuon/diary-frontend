//변환 끝
// /home/dori/diary-frontend/components/signup-social-screen.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import {
  clearSignupDraft,
  getSignupDraft,
  storeTokens,
} from "@/lib/auth-storage"
import { createOAuthState } from "@/lib/oauth-state"

type Provider = "kakao" | "google"

export default function SignupSocialScreen() {
  const router = useRouter()
  const popupRef = useRef<Window | null>(null)
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null)

  const [isLoading, setIsLoading] = useState<Provider | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const draft = getSignupDraft()

    if (!draft) {
      router.replace("/signup")
      return
    }

    setIsReady(true)

    return () => {
      if (messageHandlerRef.current) {
        window.removeEventListener("message", messageHandlerRef.current)
      }
      popupRef.current?.close()
    }
  }, [router])

  const cleanup = () => {
    if (messageHandlerRef.current) {
      window.removeEventListener("message", messageHandlerRef.current)
      messageHandlerRef.current = null
    }

    popupRef.current?.close()
    popupRef.current = null
  }

  const getRedirectUri = (provider: Provider) => {
    return `${window.location.origin}/auth/callback/${provider}`
  }

  const buildAuthUrl = (provider: Provider) => {
    const draft = getSignupDraft()

    if (!draft) {
      throw new Error("회원가입 기본 정보가 없어. 다시 입력해줘.")
    }

    const redirectUri = getRedirectUri(provider)
    const state = createOAuthState({
      mode: "signup",
      rememberMe: true,
    })

    if (provider === "kakao") {
      const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
      if (!clientId) {
        throw new Error("NEXT_PUBLIC_KAKAO_CLIENT_ID가 설정되지 않았어.")
      }

      return `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&state=${encodeURIComponent(state)}`
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID가 설정되지 않았어.")
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(
      "openid email profile"
    )}&state=${encodeURIComponent(state)}&prompt=select_account`
  }

  const handleSocialSignup = async (provider: Provider) => {
    if (isLoading) return

    setIsLoading(provider)

    try {
      const authUrl = buildAuthUrl(provider)

      if (messageHandlerRef.current) {
        window.removeEventListener("message", messageHandlerRef.current)
        messageHandlerRef.current = null
      }

      const popup = window.open(
        authUrl,
        `${provider}Signup`,
        "width=500,height=700,scrollbars=yes,resizable=yes"
      )

      if (!popup) {
        alert("팝업이 차단되었어. 팝업 허용 후 다시 시도해줘.")
        setIsLoading(null)
        return
      }

      popupRef.current = popup

      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        if (!event.data || typeof event.data !== "object") return
        if (event.data.type !== "oauthCallback") return
        if (event.data.provider !== provider) return

        try {
          if (event.data.error) {
            alert(
              typeof event.data.error === "string"
                ? event.data.error
                : "소셜 회원가입에 실패했어."
            )
            return
          }

          const code =
            typeof event.data.code === "string" ? event.data.code : null

          if (!code) {
            alert("인가 코드를 받지 못했어.")
            return
          }

          const draft = getSignupDraft()
          if (!draft) {
            alert("회원가입 기본 정보가 없어. 다시 입력해줘.")
            router.replace("/signup")
            return
          }

          const redirectUri = getRedirectUri(provider)
          const oauthResult = await apiClient.oauthLogin(
            provider,
            code,
            redirectUri
          )

          if (!oauthResult?.access_token) {
            alert("회원가입 토큰을 받지 못했어.")
            return
          }

          storeTokens(oauthResult.access_token, oauthResult.refresh_token, true)

          // 인증 직후 사용자 정보 확인
          await apiClient.getMe()

          // 출생 정보 저장
          await apiClient.updateBirthProfile({
            birth_date: draft.birthDate || null,
            birth_time: draft.birthTime
              ? draft.birthTime.length === 5
                ? `${draft.birthTime}:00`
                : draft.birthTime
              : null,
            birth_place: draft.birthPlace || null,
            sex: null,
            timezone: "Asia/Seoul",
          })

          clearSignupDraft()
          window.location.replace("/home")
        } catch (error: any) {
          console.error("OAuth signup error:", error)

          const message =
            typeof error?.message === "string"
              ? error.message
              : "회원가입 처리 중 오류가 발생했어."

          alert(message)
        } finally {
          cleanup()
          setIsLoading(null)
        }
      }

      messageHandlerRef.current = handleMessage
      window.addEventListener("message", handleMessage)
    } catch (error: any) {
      console.error("OAuth start error:", error)
      cleanup()
      setIsLoading(null)
      alert(error?.message || "회원가입 중 오류가 발생했어.")
    }
  }

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F6F2]">
        <div className="text-sm text-[#7C6F68]">
          회원가입 정보를 불러오는 중...
        </div>
      </div>
    )
  }

  const draft = getSignupDraft()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F6F2] px-6 py-10">
      <div className="w-full max-w-md rounded-[28px] bg-[#FFFCF8] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.06)]">
        <div className="mb-6">
          <p className="text-sm font-semibold text-[#C9856A]">회원가입 2/2</p>
          <h1 className="mt-2 text-2xl font-extrabold text-[#3D3530]">
            가입할 계정을 선택해줘
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#8F837C]">
            입력한 정보: {draft?.name} / {draft?.birthDate} / {draft?.birthTime} /{" "}
            {draft?.birthPlace}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleSocialSignup("kakao")}
            disabled={isLoading !== null}
            className="w-full rounded-2xl py-4 text-[0.95rem] font-bold transition-all active:scale-[0.97] disabled:opacity-50"
            style={{
              background: "#F4C97A",
              color: "#3D3530",
              boxShadow: "0 3px 12px rgba(244,201,122,0.4)",
            }}
          >
            {isLoading === "kakao"
              ? "카카오 회원가입 중..."
              : "카카오로 회원가입하기"}
          </button>

          <button
            onClick={() => handleSocialSignup("google")}
            disabled={isLoading !== null}
            className="w-full rounded-2xl border py-4 text-[0.95rem] font-bold transition-all active:scale-[0.97] disabled:opacity-50"
            style={{
              background: "#FFFCF8",
              color: "#3D3530",
              borderColor: "#E5DDD5",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            {isLoading === "google"
              ? "구글 회원가입 중..."
              : "구글로 회원가입하기"}
          </button>

          <button
            onClick={() => router.push("/signup")}
            className="w-full py-2 text-sm text-[#9A8F87]"
          >
            이전 화면으로
          </button>
        </div>
      </div>
    </div>
  )
}