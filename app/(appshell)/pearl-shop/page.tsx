// /home/dori/diary-frontend/app/(appshell)/pearl-shop/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import PearlShopScreen from "@/components/pearl-shop-screen"
import { apiClient } from "@/lib/api"

type ShopItem = {
  id: number
  name?: string
  title?: string
  description?: string
  price?: number
  pearl_price?: number
  item_type?: string
  image_url?: string
  [key: string]: unknown
}

type UserPurchase = {
  id?: number
  item_id?: number
  shop_item_id?: number
  user_id?: number
  purchased_at?: string
  item?: ShopItem
  [key: string]: unknown
}

export default function PearlShopPage() {
  const router = useRouter()
  const [items, setItems] = useState<ShopItem[]>([])
  const [purchases, setPurchases] = useState<UserPurchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadShopData = async () => {
      try {
        const [itemsData, purchasesData] = await Promise.all([
          apiClient.getShopItems("theme"),
          apiClient.getUserPurchases(),
        ])

        setItems(Array.isArray(itemsData) ? (itemsData as ShopItem[]) : [])
        setPurchases(
          Array.isArray(purchasesData) ? (purchasesData as UserPurchase[]) : []
        )
      } catch (error) {
        console.error("Failed to load pearl shop data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadShopData()
  }, [])

  const navigate = (screen: string, params?: Record<string, unknown>) => {
    if (screen === "diary-detail" && params?.date) {
      router.push(`/diary-detail/${params.date}`)
      return
    }

    if (screen === "letter-detail" && params?.letter) {
      const letterParam = params.letter as { id?: number | string } | number | string
      const letterId =
        typeof letterParam === "object" && letterParam !== null
          ? letterParam.id
          : letterParam

      router.push(`/letter-detail/${letterId}`)
      return
    }

    router.push(`/${screen}`)
  }

  const handlePurchase = async (itemId: number) => {
    try {
      await apiClient.purchaseItem(itemId)

      const purchasesData = await apiClient.getUserPurchases()
      setPurchases(
        Array.isArray(purchasesData) ? (purchasesData as UserPurchase[]) : []
      )

      alert("구매가 완료되었습니다!")
    } catch (error) {
      console.error("Failed to purchase item:", error)
      alert("구매에 실패했습니다.")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="mt-4">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <PearlShopScreen
      onNavigate={navigate}
      items={items}
      purchases={purchases}
      onPurchase={handlePurchase}
    />
  )
}