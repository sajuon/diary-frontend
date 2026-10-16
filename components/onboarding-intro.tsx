// /home/dori/diary-frontend/components/onboarding-intro.tsx
// 역할: 첫 사용자 3장 소개 화면 (H01 해도리 소개 / H02 일기 작성 방식 / H03 답장과 첫 행동)
// - 소개 화면을 보는 것만으로 일기·답장·진주를 만들지 않는다 (예시는 정적 표시)
// - 네트워크 없이도 문구와 버튼이 보인다 (그림은 로컬 파일, 실패하면 숨김)
"use client"

import { useEffect, useRef, useState } from "react"
import { ONBOARDING_TOTAL_STEPS } from "@/lib/onboarding"

export type OnboardingFinishAction = "first-diary" | "home" | "skip"

interface OnboardingIntroProps {
  initialStep?: number
  /** manual: 설정에서 다시 보기 (상단 버튼이 '닫기') */
  mode: "auto" | "manual"
  onStepChange?: (step: number) => void
  onFinish: (action: OnboardingFinishAction) => void
}

const STEPS = [
  {
    title: "오늘의 마음을\n해도리에게 들려주세요",
    body: "기분과 하루의 이야기를 남기면, 해도리가 당신의 기록을 읽고 답장을 보내요.",
  },
  {
    title: "질문에 답하거나\n자유롭게 적어요",
    body: "질문을 따라 써도, 하고 싶은 말을 자유롭게 써도 좋아요. 작성 중인 내용은 자동으로 임시저장돼요.",
  },
  {
    title: "기록을 남기고\n답장을 기다려요",
    body: "하루를 기록하면 해도리의 답장이 이어져요. 이미 받은 답장은 일기를 수정해도 바뀌지 않아요.",
  },
]

function ExampleBadge() {
  return (
    <span
      className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[11px] font-bold"
      style={{ background: "#E5DDD5", color: "#3D3530" }}
    >
      예시
    </span>
  )
}

function SafeImage({ src, alt, size }: { src: string; alt: string; size: number }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    // 오프라인·로딩 실패 시 숨기기 위해 일반 img 사용
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className="object-contain"
      style={{ width: size, height: size }}
    />
  )
}

function IllustrationIntro() {
  return (
    <div className="flex items-end justify-center gap-3" aria-hidden="true">
      <SafeImage src="/images/haedori-character.png" alt="" size={128} />
      <div
        className="mb-2 flex h-20 w-16 flex-col gap-1.5 rounded-lg px-2 py-2.5"
        style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
      >
        <span className="h-1.5 w-full rounded-full" style={{ background: "#E5DDD5" }} />
        <span className="h-1.5 w-4/5 rounded-full" style={{ background: "#E5DDD5" }} />
        <span className="h-1.5 w-full rounded-full" style={{ background: "#E5DDD5" }} />
        <span className="h-1.5 w-3/5 rounded-full" style={{ background: "#E5DDD5" }} />
      </div>
    </div>
  )
}

function IllustrationWriting() {
  return (
    <div
      className="relative w-full max-w-[280px] rounded-2xl p-4 text-left"
      style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
      aria-hidden="true"
    >
      <ExampleBadge />
      <div className="flex gap-1.5">
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{ background: "#C9856A", color: "#FFFCF8" }}
        >
          질문형
        </span>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{ background: "#F3F0EB", color: "#9A8F87" }}
        >
          자유형
        </span>
      </div>
      <p className="mt-3 text-xs font-bold" style={{ color: "#9A8F87" }}>
        오늘의 질문
      </p>
      <p className="mt-1 text-sm font-bold" style={{ color: "#3D3530" }}>
        오늘 나를 웃게 한 일은 무엇이었나요?
      </p>
      <div
        className="mt-3 rounded-xl px-3 py-2.5 text-sm"
        style={{ background: "#F8F6F2", color: "#7C6F68" }}
      >
        점심에 먹은 김밥이 맛있었다
      </div>
      <p className="mt-2 text-right text-[11px]" style={{ color: "#C4B8B0" }}>
        임시저장 완료
      </p>
    </div>
  )
}

function IllustrationLetter() {
  return (
    <div
      className="relative w-full max-w-[280px] rounded-2xl p-4 text-left"
      style={{ background: "#FFF3E8", border: "1.5px solid #E5DDD5" }}
      aria-hidden="true"
    >
      <ExampleBadge />
      <div className="flex items-center gap-2">
        <SafeImage src="/images/haedori-character.png" alt="" size={36} />
        <p className="text-sm font-extrabold" style={{ color: "#3D3530" }}>
          해도리의 답장
        </p>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        <span className="h-2 w-full rounded-full" style={{ background: "#E5DDD5" }} />
        <span className="h-2 w-11/12 rounded-full" style={{ background: "#E5DDD5" }} />
        <span className="h-2 w-4/5 rounded-full" style={{ background: "#E5DDD5" }} />
      </div>
    </div>
  )
}

const ILLUSTRATIONS = [IllustrationIntro, IllustrationWriting, IllustrationLetter]

export default function OnboardingIntro({
  initialStep = 1,
  mode,
  onStepChange,
  onFinish,
}: OnboardingIntroProps) {
  const [step, setStep] = useState(() =>
    Math.min(ONBOARDING_TOTAL_STEPS, Math.max(1, initialStep))
  )
  // 마지막 버튼 중복 클릭 방지
  const finishingRef = useRef(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const firstRenderRef = useRef(true)

  // 단계가 바뀌면 화면 읽기 프로그램이 새 제목부터 읽도록 포커스 이동
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false
      return
    }
    titleRef.current?.focus()
  }, [step])

  const goTo = (next: number) => {
    const clamped = Math.min(ONBOARDING_TOTAL_STEPS, Math.max(1, next))
    setStep(clamped)
    onStepChange?.(clamped)
  }

  const finish = (action: OnboardingFinishAction) => {
    if (finishingRef.current) return
    finishingRef.current = true
    onFinish(action)
  }

  // 좌우 스와이프 (선택 기능 — 버튼만으로 모두 이용 가능)
  const touchStartX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current
    touchStartX.current = null
    if (start == null) return
    const dx = (e.changedTouches[0]?.clientX ?? start) - start
    if (Math.abs(dx) < 60) return
    if (dx < 0 && step < ONBOARDING_TOTAL_STEPS) goTo(step + 1)
    if (dx > 0 && step > 1) goTo(step - 1)
  }

  const content = STEPS[step - 1]
  const Illustration = ILLUSTRATIONS[step - 1]
  const isLast = step === ONBOARDING_TOTAL_STEPS

  return (
    <div
      className="fixed inset-0 flex flex-col font-sans"
      style={{ background: "#F8F6F2" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* 상단: 앱 이름 + 건너뛰기(닫기) */}
      <div className="flex flex-shrink-0 items-center justify-between px-5 pt-10 pb-2">
        <p className="text-base font-extrabold" style={{ color: "#3D3530" }}>
          해도리
        </p>
        <button
          type="button"
          onClick={() => finish("skip")}
          className="min-h-[48px] min-w-[48px] rounded-xl px-3 text-sm font-bold"
          style={{ color: "#9A8F87" }}
        >
          {mode === "manual" ? "닫기" : "건너뛰기"}
        </button>
      </div>

      {/* 중앙: 그림·제목·설명 (글자 확대 시 세로 스크롤) */}
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pb-4">
        <div className="flex min-h-[220px] w-full flex-1 items-center justify-center py-4">
          <Illustration />
        </div>

        <div className="w-full max-w-sm text-center">
          <h1
            ref={titleRef}
            tabIndex={-1}
            className="whitespace-pre-line break-keep text-2xl font-extrabold leading-snug outline-none"
            style={{ color: "#3D3530" }}
          >
            {content.title}
          </h1>
          <p
            className="mt-3 break-keep text-[15px] leading-relaxed"
            style={{ color: "#7C6F68" }}
          >
            {content.body}
          </p>
        </div>
      </div>

      {/* 하단: 단계 표시 + 버튼 */}
      <div className="flex-shrink-0 px-5 pb-8 pt-2">
        <div
          className="mb-4 flex items-center justify-center gap-2"
          role="status"
          aria-live="polite"
          aria-label={`${ONBOARDING_TOTAL_STEPS}단계 중 ${step}단계`}
        >
          {Array.from({ length: ONBOARDING_TOTAL_STEPS }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="h-2 rounded-full"
              style={{
                width: i + 1 === step ? 20 : 8,
                background: i + 1 === step ? "#C9856A" : "#E5DDD5",
              }}
            />
          ))}
        </div>

        {isLast ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => finish("first-diary")}
              className="min-h-[52px] w-full rounded-2xl text-base font-extrabold transition-transform active:scale-[0.98] motion-reduce:transition-none"
              style={{ background: "#C9856A", color: "#FFFCF8" }}
            >
              첫 일기 쓰기
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                className="min-h-[48px] flex-1 rounded-2xl text-sm font-bold"
                style={{
                  background: "#FFFCF8",
                  color: "#9A8F87",
                  border: "1.5px solid #E5DDD5",
                }}
              >
                이전
              </button>
              <button
                type="button"
                onClick={() => finish("home")}
                className="min-h-[48px] flex-1 rounded-2xl text-sm font-bold"
                style={{
                  background: "#FFFCF8",
                  color: "#3D3530",
                  border: "1.5px solid #E5DDD5",
                }}
              >
                홈 둘러보기
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                className="min-h-[52px] flex-1 rounded-2xl text-sm font-bold"
                style={{
                  background: "#FFFCF8",
                  color: "#9A8F87",
                  border: "1.5px solid #E5DDD5",
                }}
              >
                이전
              </button>
            )}
            <button
              type="button"
              onClick={() => goTo(step + 1)}
              className="min-h-[52px] flex-[2] rounded-2xl text-base font-extrabold transition-transform active:scale-[0.98] motion-reduce:transition-none"
              style={{ background: "#C9856A", color: "#FFFCF8" }}
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
