"use client"

import Image from "next/image"
import { useState } from "react"

interface LoginScreenProps {
  onNavigate: (screen: string) => void
}

export default function LoginScreen({ onNavigate }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleOAuthLogin = async (provider: "kakao" | "google") => {
    setIsLoading(provider)
    try {
      // OAuth URL 생성
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const redirectUri = `${window.location.origin}/auth/callback/${provider}`
      
      let authUrl = ""
      if (provider === "kakao") {
        const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
        authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
      } else if (provider === "google") {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile`
      }

      // 팝업 창 열기
      const popup = window.open(
        authUrl,
        `${provider}Login`,
        "width=500,height=600,scrollbars=yes,resizable=yes"
      )

      // 팝업에서 메시지 수신 대기
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === `${provider}LoginSuccess`) {
          const { code } = event.data
          
          // 백엔드로 코드 전송하여 토큰 교환
          const response = await fetch(`${baseUrl}/api/auth/oauth/exchange`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              provider,
              code,
              redirect_uri: redirectUri,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            // 토큰 저장 (localStorage 등)
            localStorage.setItem("access_token", data.access_token)
            // 홈으로 이동
            window.location.href = "/home"
          } else {
            alert("로그인에 실패했습니다.")
          }
        }
        
        window.removeEventListener("message", handleMessage)
        popup?.close()
      }

      window.addEventListener("message", handleMessage)
    } catch (error) {
      console.error("OAuth login error:", error)
      alert("로그인 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(null)
    }
  }
  return (
    <div
      className="flex flex-col items-center justify-between h-full px-6 pt-16 pb-10"
      style={{ background: "#F8F6F2" }}
    >
      {/* Decorative dots */}
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: "#F2C4A8" }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#F4C97A" }} />
        <div className="w-2 h-2 rounded-full" style={{ background: "#B8D8C8" }} />
      </div>

      {/* Illustration + headline */}
      <div className="flex flex-col items-center flex-1 justify-center gap-7 w-full">
        <div
          className="relative w-60 h-60 rounded-3xl overflow-hidden"
          style={{ boxShadow: "0 8px 32px rgba(201,133,106,0.15)" }}
        >
          <Image
            src="/images/haedori-room.jpg"
            alt="해도리의 아늑한 방"
            fill
            className="object-cover"
          />
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background:
                "linear-gradient(to bottom, transparent 55%, rgba(248,246,242,0.25))",
            }}
          />
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm font-semibold" style={{ color: "#C9856A" }}>
            안녕하세요
          </p>
          <h1
            className="text-[1.6rem] font-extrabold leading-snug text-balance"
            style={{ color: "#3D3530" }}
          >
            해도리와 하루를
            <br />
            시작해볼까요?
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "#9A8F87" }}
          >
            오늘의 감정을 기록하고, 나를 돌아봐요
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full space-y-3">
        {/* Kakao */}
        <button
          onClick={() => handleOAuthLogin("kakao")}
          disabled={isLoading === "kakao"}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-[0.95rem] transition-all active:scale-[0.97] disabled:opacity-50"
          style={{
            background: "#F4C97A",
            color: "#3D3530",
            boxShadow: "0 3px 12px rgba(244,201,122,0.4)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.542 1.583 4.785 3.999 6.19L5 21l4.667-2.333C10.4 18.89 11.19 19 12 19c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" />
          </svg>
          {isLoading === "kakao" ? "로그인 중..." : "카카오로 시작하기"}
        </button>

        {/* Google */}
        <button
          onClick={() => handleOAuthLogin("google")}
          disabled={isLoading === "google"}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-[0.95rem] transition-all active:scale-[0.97] disabled:opacity-50"
          style={{
            background: "#FFFCF8",
            color: "#3D3530",
            border: "1.5px solid #E5DDD5",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {isLoading === "google" ? "로그인 중..." : "구글로 시작하기"}
        </button>

        {/* Email */}
        <button
          onClick={() => onNavigate("home")}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-[0.95rem] transition-all active:scale-[0.97]"
          style={{
            background: "#EDE8E0",
            color: "#3D3530",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          이메일로 시작하기
        </button>

        <p className="text-center text-xs pt-2 leading-relaxed" style={{ color: "#C4B8B0" }}>
          로그인하면{" "}
          <span style={{ borderBottom: "1px solid #C4B8B0" }}>개인정보처리방침</span> 및{" "}
          <span style={{ borderBottom: "1px solid #C4B8B0" }}>이용약관</span>에 동의하는 것으로 간주됩니다
        </p>
      </div>
    </div>
  )
}
