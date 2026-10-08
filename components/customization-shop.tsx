"use client"

// 방 테마 / 편지지처럼 "사서 하나를 골라 적용하는" 상품 목록.
// 해도리 상점의 '방 테마' 탭과 편지지 상점이 같이 쓴다.

import { useEffect, useState } from "react"
import RoomBackground from "@/components/room-background"
import { LetterPaperCard, LetterText } from "@/components/letter-paper"
import { apiClient } from "@/lib/api"
import { LETTER_PAPERS, getLetterPaper, writeCachedPaperKey } from "@/lib/letter-papers"
import { notifyPearlBalance } from "@/lib/pearl-events"
import { ROOM_THEMES, getRoomTheme, writeCachedThemeKey } from "@/lib/room-themes"
import { useUserPearls } from "@/hooks/use-user-pearls"

export type CustomizationKind = "theme" | "letter_paper"

type ShopItem = {
  id: number
  name?: string
  description?: string
  price?: number | string
  item_key?: string | null
}

type UserPurchase = { item_id?: number; item?: { id?: number } }

type Card = {
  key: string
  name: string
  description: string
  price: number
  item?: ShopItem
}

const DEFAULT_KEY = "default"

const CONFIG = {
  theme: {
    catalog: ROOM_THEMES as Record<string, { name: string }>,
    defaultDescription: "처음 해도리 방",
    cacheWrite: writeCachedThemeKey,
    apply: (key: string) => apiClient.setRoomTheme(key),
    appliedFrom: (room: { theme_key: string }) => room.theme_key,
    nounForConfirm: "테마",
  },
  letter_paper: {
    catalog: LETTER_PAPERS as Record<string, { name: string }>,
    defaultDescription: "처음 해도리 편지지",
    cacheWrite: writeCachedPaperKey,
    apply: (key: string) => apiClient.setLetterPaper(key),
    appliedFrom: (room: { letter_paper_key: string }) => room.letter_paper_key,
    nounForConfirm: "편지지",
  },
} as const

function Preview({ kind, itemKey }: { kind: CustomizationKind; itemKey: string }) {
  if (kind === "theme") {
    return (
      <div className="relative w-full aspect-[4/5] overflow-hidden">
        <RoomBackground theme={getRoomTheme(itemKey)} />
        <img
          src="/images/haedori-body.png"
          alt=""
          aria-hidden="true"
          className="absolute left-1/2 top-[58%] h-[46%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-md"
        />
      </div>
    )
  }
  return (
    <div className="flex w-full aspect-[4/5] items-center overflow-hidden p-3" style={{ background: "#F3EEE8" }}>
      <div className="w-full">
        <LetterPaperCard paper={getLetterPaper(itemKey)} compact>
          <LetterText small>{"오늘도 수고했어.\n천천히 쉬어가도 돼.\n해도리가 있을게."}</LetterText>
        </LetterPaperCard>
      </div>
    </div>
  )
}

export default function CustomizationShop({ kind }: { kind: CustomizationKind }) {
  const config = CONFIG[kind]
  const pearls = useUserPearls()

  const [items, setItems] = useState<ShopItem[]>([])
  const [purchases, setPurchases] = useState<UserPurchase[]>([])
  const [appliedKey, setAppliedKey] = useState(DEFAULT_KEY)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([apiClient.getShopItems(kind), apiClient.getUserPurchases(), apiClient.getRoom()])
      .then(([itemsData, purchasesData, room]) => {
        if (cancelled) return
        setItems(Array.isArray(itemsData) ? (itemsData as ShopItem[]) : [])
        setPurchases(Array.isArray(purchasesData) ? (purchasesData as UserPurchase[]) : [])
        const applied = config.appliedFrom(room as any)
        setAppliedKey(applied)
        config.cacheWrite(applied)
      })
      .catch((err) => console.error(`Failed to load ${kind} shop:`, err))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [kind, config])

  const ownedItemIds = new Set(
    purchases.map((p) => p.item_id ?? p.item?.id).filter((v): v is number => typeof v === "number")
  )

  // 프론트 카탈로그에 있는 키만 보여준다 (모르는 키는 그릴 수 없으므로 숨김)
  const cards: Card[] = [
    {
      key: DEFAULT_KEY,
      name: config.catalog[DEFAULT_KEY].name,
      description: config.defaultDescription,
      price: 0,
    },
    ...items
      .filter((item) => item.item_key && config.catalog[item.item_key])
      .map((item) => ({
        key: item.item_key as string,
        name: item.name || config.catalog[item.item_key as string].name,
        description: item.description || "",
        price: Number(item.price || 0),
        item,
      })),
  ]

  const handleApply = async (key: string) => {
    try {
      setBusyKey(key)
      const room = await config.apply(key)
      const applied = config.appliedFrom(room as any)
      setAppliedKey(applied)
      config.cacheWrite(applied)
    } catch (error: any) {
      alert(error?.message || "적용하지 못했어요.")
    } finally {
      setBusyKey(null)
    }
  }

  const handlePurchase = async (card: Card) => {
    if (!card.item) return
    try {
      setBusyKey(card.key)
      await apiClient.purchaseItem(card.item.id)
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

    if (confirm(`'${card.name}' ${config.nounForConfirm}를 바로 적용할까요?`)) {
      await handleApply(card.key)
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-xs" style={{ color: "#9A8F87" }}>
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => {
        const owned = card.key === DEFAULT_KEY || Boolean(card.item && ownedItemIds.has(card.item.id))
        const applied = card.key === appliedKey
        const busy = busyKey === card.key
        const affordable = typeof pearls === "number" && pearls >= card.price

        let label = "구매"
        let disabled = false
        let primary = true
        if (applied) {
          label = "적용 중"
          disabled = true
          primary = false
        } else if (owned) {
          label = "적용하기"
        } else if (!affordable) {
          label = "진주 부족"
          disabled = true
          primary = false
        }
        if (busy) {
          label = "처리 중"
          disabled = true
        }

        return (
          <div
            key={card.key}
            className="overflow-hidden rounded-3xl"
            style={{
              background: "#FFFCF8",
              border: applied ? "2px solid #C9856A" : "1.5px solid #E5DDD5",
              boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            }}
          >
            <Preview kind={kind} itemKey={card.key} />

            <div className="p-3.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold" style={{ color: "#3D3530" }}>
                  {card.name}
                </h3>
                {owned && !applied && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                    style={{ background: "#D4EACF", color: "#55724F" }}
                  >
                    보유
                  </span>
                )}
              </div>

              <p className="mt-1 min-h-[32px] text-[11px] leading-relaxed" style={{ color: "#8A7E76" }}>
                {card.description}
              </p>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {card.price > 0 && !owned ? (
                    <>
                      <div
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ background: "radial-gradient(circle at 35% 35%, #EDD5A0, #C9A060)" }}
                      />
                      <span className="text-sm font-extrabold" style={{ color: "#3D3530" }}>
                        {card.price.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-bold" style={{ color: "#9A8F87" }}>
                      {card.price === 0 ? "무료" : "구매 완료"}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => (owned ? handleApply(card.key) : handlePurchase(card))}
                  disabled={disabled}
                  className="rounded-2xl px-3.5 py-2 text-xs font-extrabold transition-all active:scale-95 disabled:cursor-not-allowed"
                  style={{
                    background: primary ? "#C9856A" : "#EDE8E0",
                    color: primary ? "#FFFCF8" : "#8A7E76",
                    opacity: busy ? 0.6 : 1,
                  }}
                  type="button"
                >
                  {label}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
