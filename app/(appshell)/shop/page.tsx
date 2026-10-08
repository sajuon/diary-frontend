"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import ShopScreen from "@/components/shop-screen"
import { apiClient } from "@/lib/api"
import { goBack } from "@/lib/navigation"

export default function ShopPage() {
  const router = useRouter()
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        const purchasesData = await apiClient.getUserPurchases()
        setPurchases(Array.isArray(purchasesData) ? purchasesData : (purchasesData as any)?.purchases ?? [])
      } catch (error) {
        console.error("Failed to load purchases:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPurchases()
  }, [])

  const navigate = (screen: string, params?: Record<string, unknown>) => {
    if (screen === "back") {
      goBack(router, "/home")
    } else if (screen === "diary-detail" && params?.date) {
      router.push(`/diary-detail/${params.date}`)
    } else if (screen === "letter-detail" && params?.letter) {
      const letterId = (params.letter as any).id || params.letter
      router.push(`/letter-detail/${letterId}`)
    } else {
      router.push(`/${screen}`)
    }
  }

  const handlePurchase = async (itemId: number) => {
    try {
      await apiClient.purchaseItem(itemId)

      // 구매 목록 새로고침
      const purchasesData = await apiClient.getUserPurchases()
      setPurchases(Array.isArray(purchasesData) ? purchasesData : (purchasesData as any)?.purchases ?? [])

      alert("구매가 완료되었습니다!")
    } catch (error) {
      console.error("Failed to purchase item:", error)
      alert("구매에 실패했습니다.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <ShopScreen
      onNavigate={navigate}
      purchases={purchases}
      onPurchase={handlePurchase}
    />
  )
}