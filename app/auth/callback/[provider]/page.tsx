"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function OAuthCallback() {
  const params = useParams()
  const router = useRouter()
  const provider = params.provider as string

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get("code")
    const error = urlParams.get("error")

    if (error) {
      // 에러 처리
      window.opener?.postMessage(
        { type: `${provider}LoginError`, error },
        window.location.origin
      )
      window.close()
      return
    }

    if (code) {
      // 성공: 부모 창에 코드 전송
      window.opener?.postMessage(
        { type: `${provider}LoginSuccess`, code },
        window.location.origin
      )
      window.close()
    } else {
      // 코드 없음
      window.opener?.postMessage(
        { type: `${provider}LoginError`, error: "No code received" },
        window.location.origin
      )
      window.close()
    }
  }, [provider])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4">로그인 처리 중...</p>
      </div>
    </div>
  )
}