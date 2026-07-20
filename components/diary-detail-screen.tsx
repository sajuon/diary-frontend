// /home/dori/diary-frontend/components/diary-detail-screen.tsx
"use client"

import { useMemo, useState } from "react"

type DiaryType = "question" | "free"

interface DiaryEntryResponse {
  id: number
  user_id: number
  entry_date: string
  content: string
  weather?: string | null
  mood_tags?: string[]
  summary_tag?: string | null
  diary_type?: DiaryType | null
  question_id?: string | null
  question_text?: string | null
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
    diary_type?: DiaryType | null
    question_id?: string | null
    question_text?: string | null
  }) => Promise<void>
  onDeleteDiary: () => Promise<void>
  onGenerateLetterWithPearl?: () => Promise<void>
  letterGenerating?: boolean
}

const moodMeta: Record<string, { label: string; color: string; icon: string }> = {
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

function getKstTodayDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export default function DiaryDetailScreen({
  onNavigate,
  date,
  diary,
  letter,
  onGenerateLetterWithPearl,
  letterGenerating = false,
}: DiaryDetailScreenProps) {
  const [starred, setStarred] = useState(false)
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null)

  const moodId = diary.mood_tags?.[0] || "calm"
  const currentMood = useMemo(() => moodMeta[moodId] || defaultMoodMeta, [moodId])

  const isQuestionDiary =
    diary.diary_type === "question" || Boolean(diary.question_text)

  const diaryTypeLabel = isQuestionDiary ? "질문형 일기" : "자유 일기"

  const targetDate = date || diary.entry_date
  const isTodayDiary = targetDate === getKstTodayDateString()
  const canRequestPastLetter =
    !isQuestionDiary && !isTodayDiary && Boolean(onGenerateLetterWithPearl)

  const handleOpenQuestionHistory = () => {
    onNavigate("question-history", {
      date: diary.entry_date,
      diary_id: diary.id,
      question_id: diary.question_id || "",
      question_text: diary.question_text || "",
    })
  }

  return (
    <div
      className="flex h-full flex-col font-sans"
      style={{
        background: "#F8F6F2",
        animation: "slideInRight 0.24s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      }}
    >
      <div className="flex flex-shrink-0 items-center justify-between px-5 pb-4 pt-12">
        <button
          onClick={() => onNavigate("calendar")}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95"
          style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
          aria-label="달력으로 돌아가기"
          type="button"
        >
          ←
        </button>

        <div className="text-center">
          <h2 className="text-base font-extrabold" style={{ color: "#3D3530" }}>
            {diary.entry_date}의 일기
          </h2>

          <div className="mt-0.5 flex items-center justify-center gap-1.5">
            <span className="text-xs" aria-hidden="true">
              {currentMood.icon}
            </span>

            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: currentMood.color }}
            />

            <span className="text-xs" style={{ color: "#9A8F87" }}>
              {currentMood.label}
            </span>
          </div>
        </div>

        <div className="w-9" aria-hidden="true" />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-8">
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold"
          style={{
            background: isQuestionDiary ? "#FFF3E8" : "#EEF3EC",
            color: isQuestionDiary ? "#C9856A" : "#7D967A",
            border: isQuestionDiary
              ? "1.5px solid rgba(201,133,106,0.22)"
              : "1.5px solid rgba(125,150,122,0.22)",
          }}
        >
          <span aria-hidden="true">{isQuestionDiary ? "💬" : "✍️"}</span>
          {diaryTypeLabel}
        </div>

        {isQuestionDiary && (
          <div>
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className="text-base" aria-hidden="true">
                🦦
              </span>
              <p className="text-xs font-bold" style={{ color: "#9A8F87" }}>
                오늘의 질문
              </p>
            </div>

            <div
              className="rounded-3xl px-5 py-4"
              style={{
                background: "#FFF9F0",
                border: "1.5px solid rgba(242,196,168,0.65)",
                boxShadow: "0 4px 16px rgba(201,133,106,0.08)",
              }}
            >
              <p
                className="whitespace-pre-line text-sm font-bold"
                style={{ color: "#3D3530", lineHeight: "1.75" }}
              >
                {diary.question_text || "저장된 질문 정보가 없어요."}
              </p>
            </div>

            <button
              onClick={handleOpenQuestionHistory}
              className="mt-3 w-full rounded-2xl py-3.5 text-sm font-extrabold transition-all active:scale-[0.98]"
              style={{
                background: "#FFFCF8",
                color: "#C9856A",
                border: "1.5px solid rgba(201,133,106,0.22)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
              type="button"
            >
              같은 질문의 지난 답변 모아보기
            </button>
          </div>
        )}

        <div>
          <p className="mb-2 px-1 text-xs font-bold" style={{ color: "#9A8F87" }}>
            {isQuestionDiary ? "내 답변" : "나의 일기"}
          </p>

          <div
            className="rounded-3xl px-5 py-5"
            style={{
              background: "#FFFCF8",
              border: "1.5px solid #E5DDD5",
              boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            }}
          >
            <p
              className="whitespace-pre-line text-sm"
              style={{ color: "#3D3530", lineHeight: "1.85" }}
            >
              {diary.content}
            </p>
          </div>
        </div>

        {!isQuestionDiary && (
          <>
            <div>
              <div className="mb-2 flex items-center gap-2 px-1">
                <span className="text-base" aria-hidden="true">
                  🦦
                </span>
                <p className="text-xs font-bold" style={{ color: "#9A8F87" }}>
                  해도리의 피드백
                </p>
              </div>

              <div
                className="rounded-3xl px-5 py-5"
                style={{
                  background: "#FFF9F0",
                  border: "1.5px solid rgba(242,196,168,0.55)",
                  boxShadow: "0 4px 16px rgba(201,133,106,0.08)",
                }}
              >
                {letter ? (
                  <p
                    className="whitespace-pre-line text-sm"
                    style={{ color: "#3D3530", lineHeight: "1.9" }}
                  >
                    {letter.content}
                  </p>
                ) : isTodayDiary ? (
                  <div className="text-center">
                    <div className="mb-3 text-2xl" aria-hidden="true">
                      ✍️
                    </div>
                    <p
                      className="text-sm font-bold leading-relaxed"
                      style={{ color: "#6B625C" }}
                    >
                      해도리가 답장을 쓰고 있어요.
                    </p>
                    <p
                      className="mt-2 text-xs leading-relaxed"
                      style={{ color: "#9A8F87" }}
                    >
                      답장이 완성되면 이곳에서 확인할 수 있어요.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p
                      className="mb-4 text-sm leading-relaxed"
                      style={{ color: "#6B625C" }}
                    >
                      아직 해도리 답장이 없어요.
                      <br />
                      지난 일기는 진주 1개를 사용하면 답장을 받을 수 있어요.
                    </p>

                    {canRequestPastLetter && (
                      <button
                        onClick={onGenerateLetterWithPearl}
                        disabled={letterGenerating}
                        className="w-full rounded-2xl py-3.5 text-sm font-extrabold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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

            {letter && (
              <div
                className="rounded-3xl px-5 py-5"
                style={{
                  background: "#FFFCF8",
                  border: "1.5px solid #E5DDD5",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <button
                  onClick={() => setStarred((s) => !s)}
                  className="mb-4 flex w-full items-center gap-3 transition-all active:scale-[0.97]"
                  aria-label={starred ? "즐겨찾기 해제" : "즐겨찾기에 추가"}
                  type="button"
                >
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl transition-colors"
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

                <div
                  style={{ height: "1px", background: "#F0EAE4" }}
                  className="mb-4"
                />

                <p
                  className="mb-3 text-center text-xs font-semibold"
                  style={{ color: "#9A8F87" }}
                >
                  해도리 피드백이 도움이 되었나요?
                </p>

                <div className="mb-4 flex justify-center gap-3">
                  <button
                    onClick={() =>
                      setFeedback(feedback === "like" ? null : "like")
                    }
                    className="flex items-center gap-2 rounded-2xl px-5 py-2.5 transition-all active:scale-95"
                    style={{
                      background: feedback === "like" ? "#D4EACF" : "#EDE8E0",
                    }}
                    aria-pressed={feedback === "like"}
                    type="button"
                  >
                    <span className="text-sm font-bold">좋아요</span>
                  </button>

                  <button
                    onClick={() =>
                      setFeedback(feedback === "dislike" ? null : "dislike")
                    }
                    className="flex items-center gap-2 rounded-2xl px-5 py-2.5 transition-all active:scale-95"
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
            )}
          </>
        )}
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