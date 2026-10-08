// /home/dori/diary-frontend/app/reviewer-login/page.tsx
"use client"

import { useState } from "react"
import { apiClient, ApiError } from "@/lib/api"
import { storeTokens, clearSignupDraft } from "@/lib/auth-storage"

export default function ReviewerLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await apiClient.reviewerLogin(email, password)

      if (!result?.access_token) {
        setErrorMessage("로그인 토큰을 받지 못했어.")
        return
      }

      storeTokens(result.access_token, result.refresh_token, true)
      clearSignupDraft()

      window.location.replace("/home")
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage("로그인 처리 중 오류가 발생했어.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] px-6 pt-16 pb-6 flex flex-col items-center">
      <h1 className="text-lg font-bold mb-8" style={{ color: "#3D3530" }}>
        Reviewer Login
      </h1>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
          className="w-full rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "#E5DDD5" }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="off"
          className="w-full rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "#E5DDD5" }}
          required
        />

        {errorMessage && (
          <p className="text-sm text-red-500">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl py-3 text-sm font-bold disabled:opacity-50"
          style={{ background: "#F4C97A", color: "#3D3530" }}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  )
}