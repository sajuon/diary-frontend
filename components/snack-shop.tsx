"use client"

// 해도리 상점 '간식' 탭. 간식은 여러 번 살 수 있고, 산 간식은 해도리 화면에서 먹인다.

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient, type HaedoriSnack, type HaedoriTrait } from "@/lib/api"
import { SNACK_BG, TRAIT_ORDER, TRAIT_SHORT, TRAIT_STYLE } from "@/lib/haedori-personality"
import { notifyPearlBalance } from "@/lib/pearl-events"
import { useUserPearls } from "@/hooks/use-user-pearls"

export function SnackEffectChips({ effects }: { effects: HaedoriSnack["effects"] }) {
  const entries = TRAIT_ORDER.filter((t) => (effects[t] ?? 0) > 0).map(
    (t) => [t, effects[t] as number] as [HaedoriTrait, number]
  )
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([trait, value]) => (
        <span
          key={trait}
          className="rounded-full px-2 py-0.5 text-[10px] font-extrabold"
          style={{ background: TRAIT_STYLE[trait].bg, color: TRAIT_STYLE[trait].color }}
        >
          {TRAIT_SHORT[trait].emoji} {TRAIT_SHORT[trait].name} +{value}
        </span>
      ))}
    </div>
  )
}

export default function SnackShop() {
  const router = useRouter()
  const pearls = useUserPearls()
  const [snacks, setSnacks] = useState<HaedoriSnack[]>([])
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [infoKey, setInfoKey] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiClient
      .getHaedori()
      .then((state) => !cancelled && setSnacks(state.snacks))
      .catch((err) => console.error("Failed to load snacks:", err))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const handleBuy = async (snack: HaedoriSnack) => {
    try {
      setBusyKey(snack.key)
      const result = await apiClient.buySnack(snack.key)
      setSnacks(result.snacks)
      notifyPearlBalance(result.balance)
    } catch (error: any) {
      alert(error?.message || "구매에 실패했어요.")
      return
    } finally {
      setBusyKey(null)
    }
    if (confirm(`'${snack.name}'을(를) 샀어요. 지금 해도리에게 줄까요?`)) {
      router.push("/haedori?feed=1")
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-xs" style={{ color: "#9A8F87" }}>
        불러오는 중...
      </div>
    )
  }

  const info = snacks.find((s) => s.key === infoKey)

  return (
    <>
      <p className="mb-3 text-[11px] leading-relaxed" style={{ color: "#8A7E76" }}>
        간식을 먹을수록 해도리 성격이 바뀌고, 편지 말투도 따라 바뀌어요.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {snacks.map((snack) => {
          const affordable = typeof pearls === "number" && pearls >= snack.price
          const busy = busyKey === snack.key
          return (
            <div
              key={snack.key}
              className="overflow-hidden rounded-2xl"
              style={{
                background: "#FFFCF8",
                border: "1.5px solid #E5DDD5",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div
                className="relative flex h-24 w-full items-center justify-center"
                style={{ background: SNACK_BG[snack.key] ?? "#F2E6DA" }}
              >
                <span className="text-5xl">{snack.emoji}</span>
                <button
                  type="button"
                  onClick={() => setInfoKey(snack.key)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full active:scale-95"
                  style={{ background: "rgba(255,252,248,0.92)", border: "1.5px solid #E5DDD5" }}
                  aria-label="간식 이야기"
                >
                  <span style={{ color: "#3D3530", fontWeight: 900, fontSize: 12 }}>i</span>
                </button>
                {snack.count > 0 && (
                  <div
                    className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                    style={{ background: "rgba(255,252,248,0.92)", color: "#55724F" }}
                  >
                    {snack.count}개 있음
                  </div>
                )}
              </div>

              <div className="px-3 py-3">
                <p className="mb-1.5 text-sm font-bold" style={{ color: "#3D3530" }}>
                  {snack.name}
                </p>
                <SnackEffectChips effects={snack.effects} />

                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ background: "radial-gradient(circle at 35% 35%, #EDD5A0, #C9A060)" }}
                    />
                    <span className="text-sm font-extrabold" style={{ color: "#3D3530" }}>
                      {snack.price}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBuy(snack)}
                    disabled={!affordable || busy}
                    className="rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 disabled:cursor-not-allowed"
                    style={{
                      background: affordable && !busy ? "#C9856A" : "#EDE8E0",
                      color: affordable && !busy ? "#FFFCF8" : "#9A8F87",
                    }}
                  >
                    {busy ? "처리중" : affordable ? "구매" : "부족"}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {info && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setInfoKey(null)}
            aria-label="닫기"
            style={{ background: "rgba(0,0,0,0.35)" }}
          />
          <div
            className="relative mx-auto w-full max-w-md rounded-t-3xl px-5 pb-6 pt-5"
            style={{ background: "#FFFCF8", borderTop: "1.5px solid #E5DDD5" }}
          >
            <p className="mb-2 text-base font-extrabold" style={{ color: "#3D3530" }}>
              {info.emoji} {info.name}
            </p>
            <SnackEffectChips effects={info.effects} />
            <div
              className="mt-4 rounded-2xl p-4"
              style={{ background: "#F8F6F2", border: "1.5px solid #E5DDD5" }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "#3D3530" }}>
                {info.story}
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setInfoKey(null)}
                className="rounded-2xl px-4 py-2 text-sm font-extrabold active:scale-95"
                style={{ background: "#C9856A", color: "#FFFCF8" }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
