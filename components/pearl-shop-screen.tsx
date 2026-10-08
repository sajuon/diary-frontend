// /home/dori/diary-frontend/components/pearl-shop-screen.tsx
"use client"

import RoomBackground from "@/components/room-background"
import { useUserPearls } from "@/hooks/use-user-pearls"
import { DEFAULT_THEME_KEY, ROOM_THEMES, getRoomTheme } from "@/lib/room-themes"

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

interface PearlShopScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
  items: ShopItem[]
  purchases: UserPurchase[]
  appliedThemeKey: string
  busyKey: string | null
  onPurchase: (item: ShopItem) => Promise<void>
  onApply: (themeKey: string) => Promise<void>
}

type ThemeCard = {
  key: string
  name: string
  description: string
  price: number
  item?: ShopItem
}

function ThemePreview({ themeKey }: { themeKey: string }) {
  const theme = getRoomTheme(themeKey)
  return (
    <div className="relative w-full aspect-[4/5] overflow-hidden">
      <RoomBackground theme={theme} />
      <img
        src="/images/haedori-body.png"
        alt=""
        aria-hidden="true"
        className="absolute left-1/2 top-[58%] h-[46%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-md"
      />
    </div>
  )
}

export default function PearlShopScreen({
  onNavigate,
  items,
  purchases,
  appliedThemeKey,
  busyKey,
  onPurchase,
  onApply,
}: PearlShopScreenProps) {
  const pearls = useUserPearls()

  const ownedItemIds = new Set(
    purchases.map((p) => p.item_id ?? p.item?.id).filter((v): v is number => typeof v === "number")
  )

  // 프론트에 정의된 테마만 보여준다 (모르는 키는 그릴 수 없으므로 숨김)
  const cards: ThemeCard[] = [
    {
      key: DEFAULT_THEME_KEY,
      name: ROOM_THEMES[DEFAULT_THEME_KEY].name,
      description: "처음 해도리 방",
      price: 0,
    },
    ...items
      .filter((item) => item.item_key && ROOM_THEMES[item.item_key])
      .map((item) => ({
        key: item.item_key as string,
        name: item.name || ROOM_THEMES[item.item_key as string].name,
        description: item.description || "",
        price: Number(item.price || 0),
        item,
      })),
  ]

  return (
    <div className="min-h-screen px-5 pt-12 pb-28" style={{ background: "#F8F6F2" }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => onNavigate("haedori")}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
          type="button"
          aria-label="뒤로 가기"
        >
          ←
        </button>

        <div className="text-center">
          <h1 className="text-lg font-extrabold" style={{ color: "#3D3530" }}>
            진주 상점
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#9A8F87" }}>
            해도리 방 테마
          </p>
        </div>

        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
        >
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: "#D4AF8A" }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: "#FFFCF8" }} />
          </div>
          <span className="text-sm font-bold" style={{ color: "#3D3530" }}>
            {pearls ?? 0}
          </span>
        </div>
      </div>

      {cards.length <= 1 && (
        <p className="mb-4 text-center text-xs" style={{ color: "#9A8F87" }}>
          새로운 테마를 준비 중이에요.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {cards.map((card) => {
          const owned = card.key === DEFAULT_THEME_KEY || (card.item && ownedItemIds.has(card.item.id))
          const applied = card.key === appliedThemeKey
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

          const handleClick = () => {
            if (owned) return onApply(card.key)
            if (card.item) return onPurchase(card.item)
          }

          return (
            <div
              key={card.key}
              className="rounded-3xl overflow-hidden"
              style={{
                background: "#FFFCF8",
                border: applied ? "2px solid #C9856A" : "1.5px solid #E5DDD5",
                boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
              }}
            >
              <ThemePreview themeKey={card.key} />

              <div className="p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-extrabold" style={{ color: "#3D3530" }}>
                    {card.name}
                  </h2>
                  {owned && !applied && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-extrabold"
                      style={{ background: "#D4EACF", color: "#55724F" }}
                    >
                      보유
                    </span>
                  )}
                </div>

                <p className="text-[11px] leading-relaxed mt-1 min-h-[32px]" style={{ color: "#8A7E76" }}>
                  {card.description}
                </p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1">
                    {card.price > 0 && !owned ? (
                      <>
                        <div
                          className="w-3.5 h-3.5 rounded-full"
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
                    onClick={handleClick}
                    disabled={disabled}
                    className="px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all active:scale-95 disabled:cursor-not-allowed"
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
    </div>
  )
}
