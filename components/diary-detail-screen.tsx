"use client"

import { useMemo, useState } from "react"

interface DiaryEntryResponse {
  id: number
  user_id: number
  entry_date: string
  content: string
  weather?: string | null
  mood_tags?: string[]
  created_at: string
  updated_at: string
}

interface LetterResponse {
  id: number
  user_id: number
  diary_entry_id: number
  letter_date: string
  content: string
  element_hint?: Record<string, unknown> | null
  model?: string | null
  is_read?: boolean
  read_at?: string | null
  created_at: string
  updated_at: string
}

interface DiaryDetailScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
  date?: string
  diary: DiaryEntryResponse
  letter?: LetterResponse | null
  onUpdateDiary: (data: {
    content: string
    weather?: string
    mood_tags: string[]
  }) => Promise<void>
  onDeleteDiary: () => Promise<void>
  onGenerateLetterWithPearl?: () => Promise<void>
  letterGenerating?: boolean
}

const moodMeta: Record<
  string,
  {
    label: string
    color: string
    icon: string
  }
> = {
  happy: { label: "happy", color: "#F4C97A", icon: "😊" },
  calm: { label: "calm", color: "#A8BBA5", icon: "😌" },
  sad: { label: "sad", color: "#A8C4D4", icon: "😢" },
  angry: { label: "angry", color: "#F2A8A8", icon: "😤" },
  tired: { label: "tired", color: "#C4B8C4", icon: "😪" },
  excited: { label: "excited", color: "#F2C4A8", icon: "🥰" },
}

const defaultMoodMeta = {
  label: "calm",
  color: "#A8BBA5",
  icon: "😌",
}

export default function DiaryDetailScreen({
  onNavigate,
  diary,
  letter,
  onGenerateLetterWithPearl,
  letterGenerating = false,
}: DiaryDetailScreenProps) {
  const [starred, setStarred] = useState(false)
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null)

  const moodId = diary.mood_tags?.[0] || "calm"
  const currentMood = useMemo(() => {
    return moodMeta[moodId] || defaultMoodMeta
  }, [moodId])

  return (
    <div
      className="flex flex-col h-full font-sans"
      style={{
        background: "#F8F6F2",
        animation: "slideInRight 0.24s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      }}
    >
      <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0">
        <button
          onClick={() => onNavigate("calendar")}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
          aria-label="달력으로 돌아가기"
          type="button"
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

        <div className="text-center">
          <h2 className="text-base font-extrabold" style={{ color: "#3D3530" }}>
            {diary.entry_date}의 일기
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span className="text-xs" aria-hidden="true">
              {currentMood.icon}
            </span>
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: currentMood.color }}
            />
            <span className="text-xs" style={{ color: "#9A8F87" }}>
              {currentMood.label}
            </span>
          </div>
        </div>

        <div className="w-9" aria-hidden="true" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-4">
        <div>
          <p className="text-xs font-bold mb-2 px-1" style={{ color: "#9A8F87" }}>
            나의 일기
          </p>
          <div
            className="px-5 py-5 rounded-3xl"
            style={{
              background: "#FFFCF8",
              border: "1.5px solid #E5DDD5",
              boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            }}
          >
            <p
              className="text-sm whitespace-pre-line"
              style={{ color: "#3D3530", lineHeight: "1.85" }}
            >
              {diary.content}
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-base" aria-hidden="true">
              🦦
            </span>
            <p className="text-xs font-bold" style={{ color: "#9A8F87" }}>
              해도리의 피드백
            </p>
          </div>

          <div
            className="px-5 py-5 rounded-3xl"
            style={{
              background: "#FFF9F0",
              border: "1.5px solid rgba(242,196,168,0.55)",
              boxShadow: "0 4px 16px rgba(201,133,106,0.08)",
            }}
          >
            {letter ? (
              <p
                className="text-sm whitespace-pre-line"
                style={{ color: "#3D3530", lineHeight: "1.9" }}
              >
                {letter.content}
              </p>
            ) : (
              <div className="text-center">
                <p
                  className="text-sm leading-relaxed mb-4"
                  style={{ color: "#6B625C" }}
                >
                  아직 해도리 답장이 없어요.
                  <br />
                  진주 1개를 사용하면 이 일기에 대한 답장을 받을 수 있어요.
                </p>

                {onGenerateLetterWithPearl && (
                  <button
                    onClick={onGenerateLetterWithPearl}
                    disabled={letterGenerating}
                    className="w-full py-3.5 rounded-2xl font-extrabold text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: "#C9856A",
                      color: "#FFFCF8",
                      boxShadow: "0 4px 16px rgba(201,133,106,0.25)",
                    }}
                    type="button"
                  >
                    {letterGenerating
                      ? "해도리가 답장 쓰는 중..."
                      : "진주 1개로 해도리 답장 받기"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className="px-5 py-5 rounded-3xl"
          style={{
            background: "#FFFCF8",
            border: "1.5px solid #E5DDD5",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <button
            onClick={() => setStarred((s) => !s)}
            className="flex items-center gap-3 w-full mb-4 transition-all active:scale-[0.97]"
            aria-label={starred ? "즐겨찾기 해제" : "즐겨찾기에 추가"}
            type="button"
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors"
              style={{ background: starred ? "#FFF3D0" : "#EDE8E0" }}
            >
              ⭐
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: starred ? "#C9A060" : "#6B6059" }}
            >
              {starred ? "즐겨찾기에 추가됨" : "즐겨찾기"}
            </span>
          </button>

          <div style={{ height: "1px", background: "#F0EAE4" }} className="mb-4" />

          <p
            className="text-xs font-semibold mb-3 text-center"
            style={{ color: "#9A8F87" }}
          >
            해도리 피드백이 도움이 되었나요?
          </p>

          <div className="flex gap-3 justify-center mb-4">
            <button
              onClick={() => setFeedback(feedback === "like" ? null : "like")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all active:scale-95"
              style={{
                background: feedback === "like" ? "#D4EACF" : "#EDE8E0",
              }}
              aria-pressed={feedback === "like"}
              type="button"
            >
              <span className="text-sm font-bold">좋아요</span>
            </button>

            <button
              onClick={() => setFeedback(feedback === "dislike" ? null : "dislike")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all active:scale-95"
              style={{
                background: feedback === "dislike" ? "#FDDDD8" : "#EDE8E0",
              }}
              aria-pressed={feedback === "dislike"}
              type="button"
            >
              <span className="text-sm font-bold">아쉬워요</span>
            </button>
          </div>

          <p
            className="text-center text-xs leading-relaxed"
            style={{ color: "#C4B8B0" }}
          >
            여러분의 선택은 더 좋은 해도리를
            <br />
            만드는 데 사용됩니다.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(28px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}