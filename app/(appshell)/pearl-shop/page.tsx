"use client"

// 진주 상점은 편지지 상점(/letter-shop)으로 바뀌었다. 예전 링크·북마크용 이동.
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PearlShopRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/letter-shop")
  }, [router])
  return null
}
