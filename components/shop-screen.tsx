"use client"

import { useEffect, useState } from "react"
import { useUserPearls } from "../hooks/use-user-pearls"
import { apiClient } from "@/lib/api"
import CustomizationShop from "@/components/customization-shop"
import SnackShop from "@/components/snack-shop"
import FortuneCookieModal, { type CookieKind, type CookieResult } from "@/components/fortune-cookie-modal"
import type { FortuneCookieInfo } from "@/lib/api"

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

  const [cookieInfo, setCookieInfo] = useState<FortuneCookieInfo | null>(null)
  const [cookieModal, setCookieModal] = useState<{
    kind: CookieKind
    view: CookieResult | null
  } | null>(null)

  useEffect(() => {
    apiClient
      .getFortuneCookieInfo()
      .then(setCookieInfo)
      .catch(() => setCookieInfo(null))
  }, [])

  const todayFree = cookieInfo?.today_free ?? null
  const todayPaid = cookieInfo?.today_paid ?? null

  const openCookie = (kind: CookieKind) => {
    const today = kind === "free" ? todayFree : todayPaid
    if (!today && kind === "paid" && localPearls < FORTUNE_COOKIE_PRICE) {
      alert("진주가 부족합니다.")
      return
    }
    setCookieModal({ kind, view: today })
  }

  const handleCookieOpened = (result: CookieResult) => {
    if (typeof result.balance === "number") setLocalPearls(result.balance)
    setCookieInfo((prev) =>
      prev
        ? {
            ...prev,
            [result.kind === "free" ? "today_free" : "today_paid"]: {
              kind: result.kind,
              reward: result.reward,
              is_jackpot: result.is_jackpot,
              message: result.message,
            },
          }
        : prev
    )
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
        <div className="rounded-2xl px-4 py-3" style={{ background: "#F2C4A8" }}>
          {(
            [
              {
                kind: "free" as const,
                title: "오늘의 포춘쿠키",
                sub: "무료 · 하루 1개",
                today: todayFree,
                lacking: false,
              },
              {
                kind: "paid" as const,
                title: "포춘쿠키 하나 더",
                sub: `진주 ${FORTUNE_COOKIE_PRICE}개 · 하루 1개`,
                today: todayPaid,
                lacking: localPearls < FORTUNE_COOKIE_PRICE,
              },
            ]
          ).map((row, idx) => (
            <div
              key={row.kind}
              className="flex items-center justify-between gap-3 py-2"
              style={idx === 0 ? { borderBottom: "1px dashed rgba(201,133,106,0.45)" } : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl" aria-hidden="true">🥠</span>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold" style={{ color: "#3D3530" }}>
                    {row.title}
                  </p>
                  <p className="text-xs font-bold" style={{ color: "#A8644A" }}>
                    {row.today ? `오늘 +${row.today.reward} 진주 받았어요` : row.sub}
                  </p>
                </div>
              </div>
              <button
                onClick={() => openCookie(row.kind)}
                disabled={!cookieInfo || (!row.today && row.lacking)}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-extrabold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={
                  row.today
                    ? { background: "#FFFCF8", color: "#C9856A" }
                    : { background: "#C9856A", color: "#FFFCF8" }
                }
                type="button"
              >
                {row.today ? "쪽지 보기" : row.lacking ? "부족" : "열기"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {cookieModal && (
        <FortuneCookieModal
          kind={cookieModal.kind}
          viewResult={cookieModal.view}
          onClose={() => setCookieModal(null)}
          onOpened={handleCookieOpened}
        />
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