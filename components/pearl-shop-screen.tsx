// /home/dori/diary-frontend/components/pearl-shop-screen.tsx
"use client"

import Image from "next/image"

type ShopItem = {
  id: number
  name?: string
  title?: string
  description?: string
  price?: number
  pearl_price?: number
  item_type?: string
  image_url?: string
  thumbnail_url?: string
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

interface PearlShopScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void

  items: ShopItem[]
  purchases: UserPurchase[]
  onPurchase: (itemId: number) => Promise<void>
}

function isPurchased(itemId: number, purchases: UserPurchase[]) {
  return purchases.some(
    (purchase) =>
      purchase.item_id === itemId ||
      purchase.shop_item_id === itemId ||
      purchase.item?.id === itemId
  )
}

export default function PearlShopScreen({
  onNavigate,
  items,
  purchases,
  onPurchase,
}: PearlShopScreenProps) {
  return (
    <div
      className="min-h-screen px-5 pt-12 pb-28"
      style={{ background: "#F8F6F2" }}
    >
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => onNavigate("home")}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{
            background: "#FFFCF8",
            border: "1.5px solid #E5DDD5",
          }}
          type="button"
        >
          ←
        </button>

        <div className="text-center">
          <h1
            className="text-lg font-extrabold"
            style={{ color: "#3D3530" }}
          >
            진주 상점
          </h1>

          <p className="text-xs mt-0.5" style={{ color: "#9A8F87" }}>
            진주로 테마를 구매해보세요
          </p>
        </div>

        <div className="w-9" />
      </div>

      {items.length === 0 ? (
        <div
          className="rounded-3xl p-8 text-center"
          style={{
            background: "#FFFCF8",
            border: "1.5px solid #E5DDD5",
          }}
        >
          <p
            className="text-sm font-bold"
            style={{ color: "#3D3530" }}
          >
            아직 등록된 상품이 없어요.
          </p>

          <p
            className="text-xs mt-2"
            style={{ color: "#9A8F87" }}
          >
            해도리가 새로운 테마를 준비 중이에요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => {
            const purchased = isPurchased(item.id, purchases)

            return (
              <div
                key={item.id}
                className="rounded-3xl overflow-hidden"
                style={{
                  background: "#FFFCF8",
                  border: "1.5px solid #E5DDD5",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  className="relative w-full aspect-square"
                  style={{
                    background: "#F3EEE8",
                  }}
                >
                  {item.image_url || item.thumbnail_url ? (
                    <Image
                      src={
                        (item.image_url as string) ||
                        (item.thumbnail_url as string)
                      }
                      alt={
                        (item.title as string) ||
                        (item.name as string) ||
                        "상품 이미지"
                      }
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      🎁
                    </div>
                  )}

                  {purchased && (
                    <div
                      className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-extrabold"
                      style={{
                        background: "#D4EACF",
                        color: "#55724F",
                      }}
                    >
                      구매완료
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h2
                    className="text-sm font-extrabold leading-snug"
                    style={{ color: "#3D3530" }}
                  >
                    {(item.title as string) ||
                      (item.name as string) ||
                      "이름 없는 상품"}
                  </h2>

                  <p
                    className="text-xs leading-relaxed mt-2 min-h-[36px]"
                    style={{ color: "#8A7E76" }}
                  >
                    {(item.description as string) ||
                      "해도리가 준비한 특별한 테마예요."}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          background:
                            "radial-gradient(circle at 35% 35%, #EDD5A0, #C9A060)",
                        }}
                      />

                      <span
                        className="text-sm font-extrabold"
                        style={{ color: "#3D3530" }}
                      >
                        {Number(
                          item.pearl_price || item.price || 0
                        ).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => onPurchase(item.id)}
                      disabled={purchased}
                      className="px-4 py-2 rounded-2xl text-xs font-extrabold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background: purchased ? "#EDE8E0" : "#C9856A",
                        color: purchased ? "#8A7E76" : "#FFFCF8",
                        boxShadow: purchased
                          ? "none"
                          : "0 4px 14px rgba(201,133,106,0.25)",
                      }}
                      type="button"
                    >
                      {purchased ? "보유중" : "구매"}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}