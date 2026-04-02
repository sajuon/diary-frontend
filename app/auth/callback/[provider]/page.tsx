// /home/dori/diary-frontend/app/auth/callback/[provider]/page.tsx
"use client"

import { useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"

export default function OAuthCallbackPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const provider = String(params.provider || "")

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const state = searchParams.get("state")

    console.log("[callback] provider =", provider)
    console.log("[callback] code =", code)
    console.log("[callback] error =", error)
    console.log("[callback] state =", state)
    console.log("[callback] opener exists =", !!window.opener)
    console.log("[callback] origin =", window.location.origin)

    const payload = {
      type: "oauthCallback",
      provider,
      code,
      error,
      state,
    }

    if (window.opener) {
      console.log("[callback] posting message", payload)
      window.opener.postMessage(payload, window.location.origin)
      window.close()
      return
    }

    console.log("[callback] no opener, redirect to /login")
    router.replace("/login")
  }, [provider, router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F6F2]">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[#C9856A]" />
        <p className="mt-4 text-sm text-[#7C6F68]">소셜 로그인 처리 중...</p>
      </div>
    </div>
  )
}