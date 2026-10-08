"use client"

// 해도리 화면의 성격 카드 + 간식 주기 시트.

import type { ReactNode } from "react"
import type { HaedoriState } from "@/lib/api"
import { SNACK_BG, TRAIT_ORDER, TRAIT_STYLE } from "@/lib/haedori-personality"
import { SnackEffectChips } from "@/components/snack-shop"

function BottomSheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-[80] flex items-end justify-center" onPointerDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="닫기"
        style={{ background: "rgba(0,0,0,0.35)" }}
      />
      <div
        className="relative mx-auto max-h-[80%] w-full max-w-md overflow-y-auto rounded-t-3xl px-5 pb-7 pt-5"
        style={{ background: "#FFFCF8" }}
      >
        {children}
      </div>
    </div>
  )
}

export function PersonalityCardSheet({ state, onClose }: { state: HaedoriState; onClose: () => void }) {
  const { personality } = state
  const scores = personality.scores
  const max = Math.max(10, ...TRAIT_ORDER.map((t) => scores[t] ?? 0))
  const empty = personality.fed_count === 0

  return (
    <BottomSheet onClose={onClose}>
      <p className="text-[11px] font-bold" style={{ color: "#9A8F87" }}>
        지금 해도리 성격
      </p>
      <p className="mt-1 text-lg font-extrabold" style={{ color: "#3D3530" }}>
        {personality.type.emoji} {personality.type.name}
      </p>
      <p className="mt-1 text-xs leading-relaxed" style={{ color: "#6B6059" }}>
        {empty
          ? "간식을 먹으면 어떤 친구가 될지 정해져요. 성격에 따라 편지 말투가 바뀌어요."
          : `${personality.type.description}. 편지도 이 말투로 써요.`}
      </p>

      <div className="mt-5 space-y-3">
        {personality.traits.map((trait) => {
          const value = scores[trait.key] ?? 0
          const style = TRAIT_STYLE[trait.key]
          const isMain =
            trait.key === personality.type.primary || trait.key === personality.type.secondary
          return (
            <div key={trait.key}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-extrabold" style={{ color: isMain ? style.color : "#6B6059" }}>
                  {trait.emoji} {trait.name}
                </span>
                <span className="text-[11px] font-bold" style={{ color: "#9A8F87" }}>
                  {value}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: "#EFE9E2" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(value / max) * 100}%`, background: style.bar }}
                />
              </div>
              <p className="mt-0.5 text-[10px]" style={{ color: "#A99D94" }}>
                {trait.description}
              </p>
            </div>
          )
        })}
      </div>

      <p className="mt-5 text-center text-[10px]" style={{ color: "#B8ACA3" }}>
        지금까지 먹은 간식 {personality.fed_count}개 · 먹은 만큼 계속 쌓여요
      </p>
    </BottomSheet>
  )
}

export function FeedSheet({
  state,
  feedingKey,
  onFeed,
  onGoShop,
  onClose,
}: {
  state: HaedoriState
  feedingKey: string | null
  onFeed: (snackKey: string) => void
  onGoShop: () => void
  onClose: () => void
}) {
  const owned = state.snacks.filter((s) => s.count > 0)

  return (
    <BottomSheet onClose={onClose}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-base font-extrabold" style={{ color: "#3D3530" }}>
          간식 주기
        </p>
        <button
          type="button"
          onClick={onGoShop}
          className="rounded-full px-3 py-1.5 text-[11px] font-extrabold"
          style={{ background: "#F3EEE8", color: "#8A6A58" }}
        >
          간식 사러 가기 ›
        </button>
      </div>

      {owned.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-bold" style={{ color: "#6B6059" }}>
            가진 간식이 없어요
          </p>
          <p className="mt-1 text-xs" style={{ color: "#9A8F87" }}>
            해도리 상점 &apos;간식&apos; 탭에서 살 수 있어요
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {owned.map((snack) => (
            <button
              key={snack.key}
              type="button"
              onClick={() => onFeed(snack.key)}
              disabled={feedingKey !== null}
              className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: "#FFFFFF", border: "1.5px solid #E5DDD5" }}
            >
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-3xl"
                style={{ background: SNACK_BG[snack.key] ?? "#F2E6DA" }}
              >
                {snack.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-sm font-extrabold" style={{ color: "#3D3530" }}>
                  {snack.name}{" "}
                  <span className="text-xs font-bold" style={{ color: "#9A8F87" }}>
                    × {snack.count}
                  </span>
                </p>
                <SnackEffectChips effects={snack.effects} />
              </div>
              <span
                className="flex-shrink-0 rounded-xl px-3 py-2 text-xs font-extrabold"
                style={{ background: "#C9856A", color: "#FFFCF8" }}
              >
                {feedingKey === snack.key ? "냠냠" : "주기"}
              </span>
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  )
}
