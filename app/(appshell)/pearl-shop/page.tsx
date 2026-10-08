// /home/dori/diary-frontend/app/(appshell)/pearl-shop/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import PearlShopScreen from "@/components/pearl-shop-screen"
import { apiClient } from "@/lib/api"
import { notifyPearlBalance } from "@/lib/pearl-events"
import { DEFAULT_THEME_KEY, writeCachedThemeKey } from "@/lib/room-themes"

type ShopItem = {
  id: number
  name?: string
  description?: string
  price?: number | string
  item_type?: string
  item_key?: string | null
  [key: string]: unknown
}

type UserPurchase = {
  id?: number
  item_id?: number
  item?: ShopItem
  [key: string]: unknown
}

export default function PearlShopPage() {
  const router = useRouter()
  const [items, setItems] = useState<ShopItem[]>([])
  const [purchases, setPurchases] = useState<UserPurchase[]>([])
  const [appliedThemeKey, setAppliedThemeKey] = useState(DEFAULT_THEME_KEY)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [itemsData, purchasesData, room] = await Promise.all([
          apiClient.getShopItems("theme"),
          apiClient.getUserPurchases(),
          apiClient.getRoom(),
        ])
        setItems(Array.isArray(itemsData) ? (itemsData as ShopItem[]) : [])
        setPurchases(Array.isArray(purchasesData) ? (purchasesData as UserPurchase[]) : [])
        setAppliedThemeKey(room.theme_key)
        writeCachedThemeKey(room.theme_key)
      } catch (error) {
        console.error("Failed to load pearl shop data:", error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const navigate = (screen: string) => {
    router.push(`/${screen}`)
  }

  const handleApply = async (themeKey: string) => {
    try {
      setBusyKey(themeKey)
      const room = await apiClient.setRoomTheme(themeKey)
      setAppliedThemeKey(room.theme_key)
      writeCachedThemeKey(room.theme_key)
    } catch (error: any) {
      alert(error?.message || "테마를 적용하지 못했어요.")
    } finally {
      setBusyKey(null)
    }
  }

  const handlePurchase = async (item: ShopItem) => {
    const key = item.item_key || String(item.id)
    try {
      setBusyKey(key)
      await apiClient.purchaseItem(item.id)

      const [purchasesData, me] = await Promise.all([
        apiClient.getUserPurchases(),
        apiClient.getMe() as Promise<{ pearls?: number }>,
      ])
      setPurchases(Array.isArray(purchasesData) ? (purchasesData as UserPurchase[]) : [])
      if (typeof me?.pearls === "number") notifyPearlBalance(me.pearls)
    } catch (error: any) {
      alert(error?.message || "구매에 실패했어요.")
      setBusyKey(null)
      return
    }
    setBusyKey(null)

    if (item.item_key && confirm(`'${item.name}' 테마를 바로 적용할까요?`)) {
      await handleApply(item.item_key)
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
      appliedThemeKey={appliedThemeKey}
      busyKey={busyKey}
      onPurchase={handlePurchase}
      onApply={handleApply}
    />
  )
}
