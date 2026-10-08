//변환 끝
"use client"

import { useEffect, useMemo, useState } from "react"
import { useUserPearls } from "../hooks/use-user-pearls"
import { apiClient } from "@/lib/api"
import { notifyPearlBalance } from "@/lib/pearl-events"

const FORTUNE_COOKIE_PRICE = 5

interface ShopScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
  purchases: any[]
  onPurchase: (itemId: number) => Promise<void> | void
}

const categories = [
  { id: "wallpaper", label: "벽지", icon: "🖼️" },
  { id: "floor", label: "바닥", icon: "🪵" },
  { id: "furniture", label: "가구", icon: "🛋️" },
  { id: "food", label: "간식", icon: "🍰" },
  { id: "deco", label: "소품", icon: "🪴" },
] as const

type CategoryId = (typeof categories)[number]["id"]

const shopItems: Record<
  CategoryId,
  Array<{ id: string; name: string; pearls: number; bg: string; emoji: string }>
> = {
  wallpaper: [
    { id: "wp1", name: "벚꽃 벽지", pearls: 150, bg: "#F0C4C4", emoji: "🌸" },
    { id: "wp2", name: "민트 스트라이프", pearls: 200, bg: "#B8D8C8", emoji: "〰️" },
    { id: "wp3", name: "해달 패턴", pearls: 300, bg: "#F2C4A8", emoji: "🦦" },
    { id: "wp4", name: "밤하늘 벽지", pearls: 350, bg: "#A8BBA5", emoji: "⭐" },
    { id: "wp5", name: "레몬 도트", pearls: 180, bg: "#F4E8A8", emoji: "🍋" },
    { id: "wp6", name: "구름 패턴", pearls: 220, bg: "#C8D8E8", emoji: "☁️" },
  ],
  floor: [
    { id: "fl1", name: "원목 마루", pearls: 200, bg: "#D4B8A8", emoji: "🪵" },
    { id: "fl2", name: "체크 카펫", pearls: 280, bg: "#F0C4C4", emoji: "🟪" },
    { id: "fl3", name: "대리석 타일", pearls: 400, bg: "#E8E4E0", emoji: "◻️" },
    { id: "fl4", name: "잔디 카펫", pearls: 250, bg: "#A8BBA5", emoji: "🌿" },
  ],
  furniture: [
    { id: "fn1", name: "원목 책상", pearls: 300, bg: "#D4B8A8", emoji: "🪑" },
    { id: "fn2", name: "빈백 소파", pearls: 350, bg: "#F2C4A8", emoji: "🛋️" },
    { id: "fn3", name: "별모양 램프", pearls: 180, bg: "#F4E8A8", emoji: "⭐" },
    { id: "fn4", name: "미니 책장", pearls: 260, bg: "#C8D8C8", emoji: "📚" },
    { id: "fn5", name: "둥근 침대", pearls: 500, bg: "#F0C4C4", emoji: "🛏️" },
    { id: "fn6", name: "창문 커튼", pearls: 150, bg: "#C8D8E8", emoji: "🪟" },
  ],
  food: [
    { id: "fd1", name: "딸기 케이크", pearls: 80, bg: "#F0C4C4", emoji: "🍓" },
    { id: "fd2", name: "마카롱 세트", pearls: 100, bg: "#F2C4A8", emoji: "🍬" },
    { id: "fd3", name: "버블티", pearls: 70, bg: "#C8D8E8", emoji: "🧋" },
    { id: "fd4", name: "귤 바구니", pearls: 60, bg: "#F4E8A8", emoji: "🍊" },
    { id: "fd5", name: "꿀단지", pearls: 90, bg: "#F4C97A", emoji: "🍯" },
    { id: "fd6", name: "쿠키 상자", pearls: 85, bg: "#D4B8A8", emoji: "🍪" },
  ],
  deco: [
    { id: "dc1", name: "해달 인형", pearls: 200, bg: "#F2C4A8", emoji: "🦦" },
    { id: "dc2", name: "미니 화분", pearls: 120, bg: "#A8BBA5", emoji: "🌱" },
    { id: "dc3", name: "무지개 모빌", pearls: 160, bg: "#C8D8E8", emoji: "🌈" },
    { id: "dc4", name: "달 거울", pearls: 250, bg: "#E8E4E0", emoji: "🌙" },
    { id: "dc5", name: "리본 액자", pearls: 140, bg: "#F0C4C4", emoji: "🎀" },
    { id: "dc6", name: "초 세트", pearls: 110, bg: "#F4E8A8", emoji: "🕯️" },
  ],
}

// 프론트 아이템ID(string) -> 백엔드 itemId(number) 매핑
// DB 기준:
// 1~6 furniture / 7~12 decoration / 13~18 food
const backendItemIdMap: Record<string, number> = {
  fn1: 1,
  fn2: 2,
  fn3: 3,
  fn4: 4,
  fn5: 5,
  fn6: 6,

  dc1: 7,
  dc2: 8,
  dc3: 9,
  dc4: 10,
  dc5: 11,
  dc6: 12,

  fd1: 13,
  fd2: 14,
  fd3: 15,
  fd4: 16,
  fd5: 17,
  fd6: 18,
}

type Trait = "E" | "I" | "N" | "S" | "T" | "F" | "J" | "P"

const snackInfoById: Record<
  string,
  { effects: Partial<Record<Trait, number>>; story: string }
> = {
  fd1: {
    effects: { E: 2, F: 1 },
    story:
      "붉게 익은 딸기는 햇살을 오래 품고 자란다.\n그 달콤함은 혼자 먹기엔 아까워 꼭 나누고 싶어진다.\n딸기 케이크를 한 입 먹은 해도리는 괜히 말을 더 하고 싶어지고,\n괜히 네 이야기를 더 듣고 싶어진다.\n\n달콤함은 마음을 바깥으로 향하게 한다.",
  },
  fd2: {
    effects: { E: 1, N: 2, F: 1 },
    story:
      "겉은 바삭하고 속은 부드러운 작은 색의 세계.\n마카롱은 한 입마다 다른 상상을 품고 있다.\n해도리는 이 달콤한 상상 조각을 먹고 평소보다 더 많은 이야기와\n더 많은 꿈을 꺼내놓게 된다.\n\n색이 많아질수록, 생각도 많아진다.",
  },
  fd3: {
    effects: { E: 1, P: 2 },
    story:
      "투명한 컵 안에서 동그란 펄이 춤춘다.\n예측할 수 없는 그 움직임처럼 오늘의 기분도 조금은 가볍게 흔들려본다.\n버블티를 마신 해도리는 계획보단 흐름을 따라가고 싶어진다.\n\n오늘은 조금 즉흥적으로 살아도 괜찮아.",
  },
  fd4: {
    effects: { I: 2, S: 1 },
    story:
      "차가운 바람이 부는 계절, 귤 껍질을 까면 향이 먼저 퍼진다.\n따뜻한 방 안에서 조용히 나누어 먹는 귤은 시끄럽지 않아도 충분히 행복하다.\n귤을 먹은 해도리는 조금 더 차분해지고, 조금 더 현실에 집중한다.\n\n조용한 달콤함도 분명한 위로가 된다.",
  },
  fd5: {
    effects: { F: 2, J: 2 },
    story:
      "벌들은 꽃에서 조금씩 꿀을 모은다. 시간이 지나야만 완성되는 단맛.\n따뜻한 계절일 때 모아온 꿀은 해도리의 마음도 천천히 데워준다.\n꿀단지를 비운 해도리는 더 다정해지고, 더 단단해진다.\n\n따뜻함은 준비된 마음에서 나온다.",
  },
  fd6: {
    effects: { S: 2, J: 1 },
    story:
      "쿠키는 정확한 온도와 시간 속에서 완성된다.\n조금만 어긋나도 맛은 달라진다.\n정성스럽게 구워진 쿠키를 먹은 해도리는 흐트러진 생각을 하나씩 정리하기 시작한다.\n\n차분함은 잘 구워진 마음에서 온다.",
  },
}

const traitStyle: Record<Trait, { color: string; bg: string; border: string }> = {
  E: { color: "#D14B6A", bg: "#FFE3EC", border: "#F4B8C8" },
  I: { color: "#2E7BA6", bg: "#E1F2FF", border: "#B9E0F7" },
  N: { color: "#6D49C7", bg: "#EFE6FF", border: "#D7C6FF" },
  S: { color: "#2F7D5A", bg: "#E2F7ED", border: "#BDE8D2" },
  T: { color: "#2F5D9A", bg: "#E6F0FF", border: "#C8DCFF" },
  F: { color: "#C65A2A", bg: "#FFE9DE", border: "#FFD1BC" },
  J: { color: "#8C5A1E", bg: "#FFF2D6", border: "#F2D59B" },
  P: { color: "#A43E9E", bg: "#FFE3FB", border: "#F4B6EA" },
}

function extractOwnedBackendIds(purchases: any[]): Set<number> {
  const s = new Set<number>()
  for (const p of purchases ?? []) {
    const id = p?.item_id ?? p?.item?.id ?? p?.itemId
    if (id != null) s.add(Number(id))
  }
  return s
}

function EffectChips({ effects }: { effects: Partial<Record<Trait, number>> }) {
  const entries = (Object.entries(effects) as Array<[Trait, number]>).filter(
    ([, v]) => typeof v === "number" && v !== 0
  )

  if (!entries.length) {
    return (
      <span className="text-xs font-bold" style={{ color: "#9A8F87" }}>
        효과 없음
      </span>
    )
  }

  const order: Trait[] = ["E", "I", "N", "S", "T", "F", "J", "P"]
  entries.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {entries.map(([trait, value]) => {
        const st = traitStyle[trait]
        return (
          <span
            key={trait}
            className="px-2.5 py-1 rounded-full text-xs font-extrabold"
            style={{
              background: st.bg,
              color: st.color,
              border: `1.5px solid ${st.border}`,
            }}
          >
            {trait} +{value}%
          </span>
        )
      })}
    </div>
  )
}

export default function ShopScreen({ onNavigate, purchases, onPurchase }: ShopScreenProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("furniture")

  const pearls = useUserPearls()
  const [localPearls, setLocalPearls] = useState<number>(pearls ?? 0)

  useEffect(() => {
    if (typeof pearls === "number") setLocalPearls(pearls)
  }, [pearls])

  const items = shopItems[activeCategory] || []
  const ownedBackendIds = useMemo(() => extractOwnedBackendIds(purchases), [purchases])

  const [infoOpen, setInfoOpen] = useState(false)
  const [infoSnackId, setInfoSnackId] = useState<string | null>(null)
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null)

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

  const openInfo = (snackId: string) => {
    setInfoSnackId(snackId)
    setInfoOpen(true)
  }

  const closeInfo = () => {
    setInfoOpen(false)
    setInfoSnackId(null)
  }

  const infoData = infoSnackId ? snackInfoById[infoSnackId] : null
  const infoTitle = infoSnackId ? shopItems.food.find((x) => x.id === infoSnackId)?.name : ""

  const handlePurchase = async (frontItemId: string, cost: number) => {
    const backendId = backendItemIdMap[frontItemId]

    if (!backendId) {
      alert("이 카테고리는 아직 준비 중이에요.")
      return
    }

    if (ownedBackendIds.has(backendId)) return

    if (typeof localPearls !== "number" || localPearls < cost) {
      alert("진주가 부족합니다.")
      return
    }

    try {
      setIsPurchasing(frontItemId)
      await onPurchase(backendId)
      setLocalPearls((prev) => prev - cost)
    } finally {
      setIsPurchasing(null)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#F8F6F2" }}>
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={() => onNavigate("home")}
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
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => {
            const backendId = backendItemIdMap[item.id]
            const isOwned = backendId ? ownedBackendIds.has(backendId) : false
            const canAfford = typeof localPearls === "number" && localPearls >= item.pearls
            const isPurchasingThis = isPurchasing === item.id
            const isSnack = activeCategory === "food"
            const hasInfo = isSnack && !!snackInfoById[item.id]
            const isMapped = !!backendId

            let buttonLabel = "구매"
            if (!isMapped) buttonLabel = "준비중"
            else if (isOwned) buttonLabel = "보유중"
            else if (!canAfford) buttonLabel = "부족"
            else if (isPurchasingThis) buttonLabel = "처리중"

            const isDisabled = !isMapped || isOwned || !canAfford || isPurchasingThis

            return (
              <div
                key={item.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "#FFFCF8",
                  border: "1.5px solid #E5DDD5",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="w-full h-28 flex items-center justify-center relative"
                  style={{ background: item.bg }}
                >
                  <span className="text-5xl">{item.emoji}</span>

                  {hasInfo && (
                    <button
                      type="button"
                      onClick={() => openInfo(item.id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center active:scale-95"
                      style={{
                        background: "rgba(255,252,248,0.92)",
                        border: "1.5px solid #E5DDD5",
                      }}
                      aria-label="간식 정보"
                      title="정보"
                    >
                      <span style={{ color: "#3D3530", fontWeight: 900, fontSize: 12 }}>i</span>
                    </button>
                  )}

                  {isOwned && (
                    <div
                      className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: "rgba(255,252,248,0.9)", color: "#A8BBA5" }}
                    >
                      보유
                    </div>
                  )}
                </div>

                <div className="px-3 py-3">
                  <p className="text-sm font-bold mb-2" style={{ color: "#3D3530" }}>
                    {item.name}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                        style={{ background: "#D4AF8A" }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#FFFCF8" }} />
                      </div>
                      <span className="text-sm font-extrabold" style={{ color: "#D4AF8A" }}>
                        {item.pearls}
                      </span>
                    </div>

                    <button
                      onClick={() => handlePurchase(item.id, item.pearls)}
                      disabled={isDisabled}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background:
                          isOwned || !canAfford || !isMapped || isPurchasingThis
                            ? "#EDE8E0"
                            : "#C9856A",
                        color:
                          isOwned || !canAfford || !isMapped || isPurchasingThis
                            ? "#9A8F87"
                            : "#FFFCF8",
                      }}
                    >
                      {buttonLabel}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {infoOpen && infoSnackId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            className="absolute inset-0"
            onClick={closeInfo}
            aria-label="닫기"
            style={{ background: "rgba(0,0,0,0.35)" }}
          />

          <div
            className="relative w-full max-w-md mx-auto rounded-t-3xl px-5 pt-5 pb-6"
            style={{ background: "#FFFCF8", borderTop: "1.5px solid #E5DDD5" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-extrabold" style={{ color: "#3D3530" }}>
                  {infoTitle}
                </p>
                {infoData ? <EffectChips effects={infoData.effects} /> : null}
              </div>

              <button
                type="button"
                onClick={closeInfo}
                className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95"
                style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
                aria-label="닫기"
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
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div
              className="mt-4 rounded-2xl p-4 whitespace-pre-line"
              style={{ background: "#F8F6F2", border: "1.5px solid #E5DDD5" }}
            >
              <p className="text-sm font-bold" style={{ color: "#3D3530" }}>
                {infoData?.story ?? "아직 스토리가 준비되지 않았어요."}
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeInfo}
                className="px-4 py-2 rounded-2xl text-sm font-extrabold active:scale-95"
                style={{ background: "#C9856A", color: "#FFFCF8" }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}