import { useState, useEffect } from "react"
import { onPearlBalance } from "@/lib/pearl-events"

export function useUserPearls() {
  const [pearls, setPearls] = useState<number | null>(null)
  useEffect(() => {
    async function fetchUser() {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
        credentials: "include"
      })
      if (res.ok) {
        const data = await res.json()
        setPearls(data.pearls)
      }
    }
    fetchUser()
    // 진주 보상·포춘쿠키 등으로 잔액이 바뀌면 바로 반영
    return onPearlBalance(setPearls)
  }, [])
  return pearls
}
