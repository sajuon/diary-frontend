"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import PearlShopScreen from "@/components/pearl-shop-screen"
import { apiClient } from "@/lib/api"

export default function PearlShopPage() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadShopData = async () => {
      try {
        const [itemsData, purchasesData] = await Promise.all([
          apiClient.getShopItems('theme'), // 진주 상점은 테마 아이템만
          apiClient.getUserPurchases()
        ])
        setItems(itemsData)
        setPurchases(purchasesData)
      } catch (error) {
        console.error('Failed to load pearl shop data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadShopData()
  }, [])

  const navigate = (screen: string, params?: Record<string, unknown>) => {
    if (screen === "diary-detail" && params?.date) {
      router.push(`/diary-detail/${params.date}`)
    } else if (screen === "letter-detail" && params?.letter) {
      // Assuming letter has an id
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
      setPurchases(purchasesData)
      alert('구매가 완료되었습니다!')
    } catch (error) {
      console.error('Failed to purchase item:', error)
      alert('구매에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">로딩 중...</p>
        </div>
      </div>
    )
  }

  return <PearlShopScreen onNavigate={navigate} items={items} purchases={purchases} onPurchase={handlePurchase} />
}