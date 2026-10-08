//변환 끝
// /home/dori/diary-frontend/components/login-screen.tsx
"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { clearSignupDraft, storeTokens } from "@/lib/auth-storage"
import { createOAuthState, parseOAuthState } from "@/lib/oauth-state"

type Provider = "kakao" | "google"

export default function LoginScreen() {
  const router = useRouter()
  const popupRef = useRef<Window | null>(null)
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null)

  const [isLoading, setIsLoading] = useState<Provider | null>(null)
  const [rememberMe, setRememberMe] = useState(true)

  useEffect(() => {
    return () => {
      if (messageHandlerRef.current) {
        window.removeEventListener("message", messageHandlerRef.current)
      }
      popupRef.current?.close()
    }
  }, [])

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
    const redirectUri = getRedirectUri(provider)
    const state = createOAuthState({
      mode: "login",
      rememberMe,
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

  const handleOAuthLogin = async (provider: Provider) => {
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
        `${provider}Login`,
        "width=500,height=700,scrollbars=yes,resizable=yes"
      )

      if (!popup) {
        alert("팝업이 차단되었어. 팝업 허용 후 다시 시도해줘.")
        setIsLoading(null)
        return
      }

      popupRef.current = popup

      const handleMessage = async (event: MessageEvent) => {
        console.log("[login] message received", {
          origin: event.origin,
          data: event.data,
          currentOrigin: window.location.origin,
          provider,
        })

        if (event.origin !== window.location.origin) {
          console.log("[login] origin mismatch")
          return
        }

        if (!event.data || typeof event.data !== "object") {
          console.log("[login] invalid event data")
          return
        }

        if (event.data.type !== "oauthCallback") {
          console.log("[login] unexpected type")
          return
        }

        if (event.data.provider !== provider) {
          console.log("[login] provider mismatch")
          return
        }

        try {
          console.log("[login] callback accepted")

          if (event.data.error) {
            console.log("[login] callback error", event.data.error)
            alert(
              typeof event.data.error === "string"
                ? event.data.error
                : "소셜 로그인에 실패했어."
            )
            return
          }

          const code =
            typeof event.data.code === "string" ? event.data.code : null

          console.log("[login] code =", code)

          if (!code) {
            alert("인가 코드를 받지 못했어.")
            return
          }

          const redirectUri = getRedirectUri(provider)
          console.log("[login] exchanging code", { provider, redirectUri })

          const oauthResult = await apiClient.oauthLogin(
            provider,
            code,
            redirectUri
          )

          console.log("[login] oauthResult =", oauthResult)

          if (!oauthResult?.access_token) {
            alert("로그인 토큰을 받지 못했어.")
            return
          }

          const statePayload = parseOAuthState(
            typeof event.data.state === "string" ? event.data.state : ""
          )

                    storeTokens(
            oauthResult.access_token,
            oauthResult.refresh_token,
            statePayload?.rememberMe ?? rememberMe
          )

          clearSignupDraft()

          console.log("[login] token stored, moving to /home")
          window.location.replace("/home")
        } catch (error: any) {
          console.error("[login] OAuth login error:", error)
          alert(error?.message || "로그인 처리 중 오류가 발생했어.")
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
      alert(error?.message || "로그인 중 오류가 발생했어.")
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] px-6 pt-10 pb-6 flex flex-col">
      <div className="flex items-center justify-center gap-1.5 mb-6">
        <div className="h-2 w-2 rounded-full" style={{ background: "#F2C4A8" }} />
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#F4C97A" }} />
        <div className="h-2 w-2 rounded-full" style={{ background: "#B8D8C8" }} />
      </div>

      <div className="flex flex-col items-center">
        <div
          className="relative h-52 w-52 overflow-hidden rounded-3xl"
          style={{ boxShadow: "0 8px 32px rgba(201,133,106,0.15)" }}
        >
          <Image
            src="/images/haedori-room.jpg"
            alt="해도리 로그인"
            fill
            className="object-cover"
          />
        </div>

        <div className="space-y-2 text-center mt-6">
          <p className="text-sm font-semibold" style={{ color: "#C9856A" }}>
            다시 만나서 반가워요
          </p>
          <h1
            className="text-[1.6rem] font-extrabold leading-snug"
            style={{ color: "#3D3530" }}
          >
            로그인하고
            <br />
            오늘의 하루를 이어가요
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#9A8F87" }}>
            원하는 계정으로 간편하게 로그인해요
          </p>
        </div>
      </div>

      <div className="w-full mt-16 space-y-3">
        <button
          onClick={() => handleOAuthLogin("kakao")}
          disabled={isLoading !== null}
          className="w-full rounded-2xl py-4 text-[0.95rem] font-bold transition-all active:scale-[0.97] disabled:opacity-50"
          style={{
            background: "#F4C97A",
            color: "#3D3530",
            boxShadow: "0 3px 12px rgba(244,201,122,0.4)",
          }}
        >
          {isLoading === "kakao" ? "카카오 로그인 중..." : "카카오 로그인"}
        </button>

        <button
          onClick={() => handleOAuthLogin("google")}
          disabled={isLoading !== null}
          className="w-full rounded-2xl border py-4 text-[0.95rem] font-bold transition-all active:scale-[0.97] disabled:opacity-50"
          style={{
            background: "#FFFCF8",
            color: "#3D3530",
            borderColor: "#E5DDD5",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          {isLoading === "google" ? "구글 로그인 중..." : "구글 로그인"}
        </button>

        <label className="flex items-center gap-2 px-1 pt-1">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm text-[#5C514B]">로그인 유지</span>
        </label>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="text-sm font-medium text-[#C9856A] underline underline-offset-2"
          >
            회원가입하기
          </button>
        </div>
      </div>
    </div>
  )
}