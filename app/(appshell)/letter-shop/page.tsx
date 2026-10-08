"use client"

import { useRouter } from "next/navigation"
import CustomizationShop from "@/components/customization-shop"
import { useUserPearls } from "@/hooks/use-user-pearls"
import { goBack } from "@/lib/navigation"

export default function LetterShopPage() {
  const router = useRouter()
  const pearls = useUserPearls()

  return (
    <div className="min-h-screen px-5 pt-12 pb-28" style={{ background: "#F8F6F2" }}>
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => goBack(router, "/haedori")}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95"
          style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
          type="button"
          aria-label="뒤로 가기"
        >
          ←
        </button>

        <div className="text-center">
          <h1 className="text-lg font-extrabold" style={{ color: "#3D3530" }}>
            편지지 상점
          </h1>
          <p className="mt-0.5 text-xs" style={{ color: "#9A8F87" }}>
            해도리 편지가 이 종이에 와요
          </p>
        </div>

        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
        >
          <div
            className="flex h-4 w-4 items-center justify-center rounded-full"
            style={{ background: "#D4AF8A" }}
          >
            <div className="h-2 w-2 rounded-full" style={{ background: "#FFFCF8" }} />
          </div>
          <span className="text-sm font-bold" style={{ color: "#3D3530" }}>
            {pearls ?? 0}
          </span>
        </div>
      </div>

      <CustomizationShop kind="letter_paper" />
    </div>
  )
}
