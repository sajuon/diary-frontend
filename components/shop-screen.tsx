"use client"

import { useEffect, useState } from "react"
import { useUserPearls } from "../hooks/use-user-pearls"
import { apiClient } from "@/lib/api"
import { notifyPearlBalance } from "@/lib/pearl-events"
import CustomizationShop from "@/components/customization-shop"
import SnackShop from "@/components/snack-shop"

const FORTUNE_COOKIE_PRICE = 5

interface ShopScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
}

const categories = [
  { id: "theme", label: "방 테마", icon: "🏠" },
  { id: "items", label: "소품", icon: "🪴" },
  { id: "food", label: "간식", icon: "🍰" },
] as const

type CategoryId = (typeof categories)[number]["id"]

export default function ShopScreen({ onNavigate }: ShopScreenProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("theme")

  const pearls = useUserPearls()
  const [localPearls, setLocalPearls] = useState<number>(pearls ?? 0)

  useEffect(() => {
    if (typeof pearls === "number") setLocalPearls(pearls)
  }, [pearls])

  // /shop?tab=items 처럼 탭을 지정해서 들어올 수 있게
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab")
    if (tab && categories.some((c) => c.id === tab)) setActiveCategory(tab as CategoryId)
  }, [])

  const [cookieOpening, setCookieOpening] = useState(false)
  const [cookieResult, setCookieResult] = useState<{
    reward: number
    is_jackpot: boolean
    balance: number
  } | null>(null)

  const handleOpenFortuneCookie = async () => {
    if (cookieOpening) return
    if (localPearls < FORTUNE_COOKIE_PRICE) {
      alert("진주가 부족합니다.")
      return
    }
    try {
      setCookieOpening(true)
      const result = await apiClient.buyFortuneCookie()
      setLocalPearls(result.balance)
      notifyPearlBalance(result.balance)
      setCookieResult(result)
    } catch (err: any) {
      alert(err?.message || "포춘쿠키를 열지 못했어요.")
    } finally {
      setCookieOpening(false)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#F8F6F2" }}>
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={() => onNavigate("back")}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
          aria-label="뒤로 가기"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3D3530"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <h2 className="text-base font-extrabold" style={{ color: "#3D3530" }}>
          해도리 상점
        </h2>

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
            {localPearls}
          </span>
        </div>
      </div>

      <div className="px-5 mb-4">
        <div
          className="rounded-2xl px-5 py-4 flex items-center justify-between gap-3"
          style={{ background: "#F2C4A8" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl" aria-hidden="true">🥠</span>
            <div className="min-w-0">
              <p className="text-xs font-bold" style={{ color: "#C9856A" }}>
                포춘쿠키 · 진주 {FORTUNE_COOKIE_PRICE}개
              </p>
              <p className="text-sm font-extrabold" style={{ color: "#3D3530" }}>
                진주 1~50개 랜덤 획득
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenFortuneCookie}
            disabled={cookieOpening || localPearls < FORTUNE_COOKIE_PRICE}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-extrabold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#C9856A", color: "#FFFCF8" }}
            type="button"
          >
            {cookieOpening ? "여는 중" : localPearls < FORTUNE_COOKIE_PRICE ? "부족" : "열기"}
          </button>
        </div>
      </div>

      {cookieResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-8"
          style={{ background: "rgba(61,53,48,0.35)" }}
          onClick={() => setCookieResult(null)}
        >
          <div
            className="w-full max-w-xs rounded-3xl px-6 py-7 text-center"
            style={{ background: "#FFFCF8", boxShadow: "0 12px 40px rgba(61,53,48,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-5xl mb-3" aria-hidden="true">
              {cookieResult.is_jackpot ? "🎉" : "🥠"}
            </div>
            <p className="text-xs font-bold mb-1" style={{ color: "#9A8F87" }}>
              {cookieResult.is_jackpot ? "대박!" : "포춘쿠키 결과"}
            </p>
            <p className="text-2xl font-extrabold" style={{ color: "#3D3530" }}>
              진주 {cookieResult.reward}개
            </p>
            <p className="text-xs mt-2" style={{ color: "#9A8F87" }}>
              보유 진주 {cookieResult.balance}개
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setCookieResult(null)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold"
                style={{ background: "#EDE8E0", color: "#6B6059" }}
                type="button"
              >
                닫기
              </button>
              <button
                onClick={handleOpenFortuneCookie}
                disabled={cookieOpening || cookieResult.balance < FORTUNE_COOKIE_PRICE}
                className="flex-1 py-3 rounded-2xl text-sm font-extrabold disabled:opacity-50"
                style={{ background: "#C9856A", color: "#FFFCF8" }}
                type="button"
              >
                하나 더
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl whitespace-nowrap font-bold text-sm transition-all active:scale-95 flex-shrink-0"
              style={{
                background: activeCategory === cat.id ? "#C9856A" : "#FFFCF8",
                color: activeCategory === cat.id ? "#FFFCF8" : "#9A8F87",
                border: activeCategory === cat.id ? "1.5px solid #C9856A" : "1.5px solid #E5DDD5",
                boxShadow:
                  activeCategory === cat.id ? "0 2px 8px rgba(201,133,106,0.25)" : "none",
              }}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {activeCategory === "theme" ? (
          <CustomizationShop kind="theme" />
        ) : activeCategory === "items" ? (
          <CustomizationShop kind="room_item" />
        ) : (
          <SnackShop />
        )}
      </div>
    </div>
  )
}