// /home/dori/diary-frontend/components/diary-detail-screen.tsx
"use client"

import { useMemo, useState } from "react"
import LetterActions from "@/components/letter-actions"
import AppliedLetterPaper, { LetterText } from "@/components/letter-paper"
import {
  EMOTION_MAP,
  EmotionStone,
  FALLBACK_EMOTION,
  isEmotionKey,
} from "@/components/emotion-stone"
import { isLetterPendingDate } from "@/lib/diary-day"
import type { LetterRegenerateInfo } from "@/lib/api"

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
  is_favorite?: boolean
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
  onLoadRegenerateInfo?: () => Promise<LetterRegenerateInfo>
  onRegenerateLetter?: (letterId: number) => Promise<void>
}

export default function DiaryDetailScreen({
  onNavigate,
  date,
  diary,
  letter,
  onGenerateLetterWithPearl,
  letterGenerating = false,
  onLoadRegenerateInfo,
  onRegenerateLetter,
}: DiaryDetailScreenProps) {
  const [regenInfo, setRegenInfo] = useState<LetterRegenerateInfo | null>(null)
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const moodId = diary.mood_tags?.[0] || "calm"
  const currentMood = useMemo(
    () => EMOTION_MAP[isEmotionKey(moodId) ? moodId : FALLBACK_EMOTION],
    [moodId]
  )

  const isQuestionDiary =
    diary.diary_type === "question" || Boolean(diary.question_text)

  const diaryTypeLabel = isQuestionDiary ? "질문형 일기" : "자유 일기"

  const targetDate = date || diary.entry_date
  // 오늘 일기, 또는 새벽 마감 전의 어제 일기 → 아직 자동 답장 전
  const isTodayDiary = isLetterPendingDate(targetDate)
  const canRequestPastLetter =
    !isQuestionDiary && !isTodayDiary && Boolean(onGenerateLetterWithPearl)
  const canRegenerate =
    !isQuestionDiary &&
    !isTodayDiary &&
    Boolean(letter) &&
    Boolean(onLoadRegenerateInfo && onRegenerateLetter)

  const handleOpenRegenerate = async () => {
    if (!onLoadRegenerateInfo) return
    try {
      setRegenLoading(true)
      setRegenInfo(await onLoadRegenerateInfo())
    } catch (error: any) {
      alert(error?.message || "답장 정보를 불러오지 못했어요.")
    } finally {
      setRegenLoading(false)
    }
  }

  const handleConfirmRegenerate = async () => {
    if (!regenInfo || !onRegenerateLetter) return
    try {
      setRegenerating(true)
      await onRegenerateLetter(regenInfo.letter_id)
      setRegenInfo(null)
    } catch (error: any) {
      alert(error?.message || "답장을 다시 받지 못했어요.")
    } finally {
      setRegenerating(false)
    }
  }

  const handleOpenQuestionHistory = () => {
    onNavigate("question-history", {
      date: diary.entry_date,
      diary_id: diary.id,
      question_id: diary.question_id || "",
      question_text: diary.question_text || "",
    })
  }

  const handleEditDiary = () => {
    onNavigate("diary", {
      date: targetDate,
      diary_type: isQuestionDiary ? "question" : "free",
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
            <EmotionStone emotion={currentMood.key} size={18} />

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

          <button
            onClick={handleEditDiary}
            className="mt-3 w-full rounded-2xl py-3.5 text-sm font-extrabold transition-all active:scale-[0.98]"
            style={{
              background: "#FFFCF8",
              color: "#6B6059",
              border: "1.5px solid #E5DDD5",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
            type="button"
          >
            ✏️ 일기 수정하기
          </button>
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

              {letter ? (
                <AppliedLetterPaper>
                  <LetterText>{letter.content}</LetterText>
                </AppliedLetterPaper>
              ) : (
              <div
                className="rounded-3xl px-5 py-5"
                style={{
                  background: "#FFF9F0",
                  border: "1.5px solid rgba(242,196,168,0.55)",
                  boxShadow: "0 4px 16px rgba(201,133,106,0.08)",
                }}
              >
                {isTodayDiary ? (
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
              )}
            </div>

            {letter && <LetterActions letter={letter} />}

            {canRegenerate && (
              <button
                onClick={handleOpenRegenerate}
                disabled={regenLoading || regenerating}
                className="w-full rounded-2xl py-3.5 text-sm font-extrabold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: "#FFFCF8",
                  color: "#C9856A",
                  border: "1.5px solid rgba(201,133,106,0.22)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
                type="button"
              >
                {regenLoading ? "확인 중..." : "진주 3개로 답장 다시 받기"}
              </button>
            )}
          </>
        )}
      </div>

      {regenInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(61,53,48,0.4)" }}
          onClick={() => !regenerating && setRegenInfo(null)}
        >
          <div
            className="flex w-full max-w-xs flex-col gap-3 rounded-2xl bg-[#FFFCF8] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-base font-bold" style={{ color: "#3D3530" }}>
              {regenInfo.diary_modified
                ? "수정한 일기로 답장을 다시 받을까요?"
                : "일기를 수정하지 않았습니다. 재생성하시겠습니까?"}
            </h3>

            <p className="text-sm leading-relaxed" style={{ color: "#6B625C" }}>
              기존 답장은 삭제되고 되돌릴 수 없어요.
              <br />
              즐겨찾기와 남긴 피드백도 함께 삭제돼요.
            </p>

            <p className="text-xs" style={{ color: "#9A8F87" }}>
              진주 {regenInfo.cost}개 사용 · 보유 {regenInfo.pearls}개
            </p>

            {regenInfo.pearls < regenInfo.cost && (
              <p className="text-xs font-bold" style={{ color: "#C9856A" }}>
                진주가 부족해요.
              </p>
            )}

            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setRegenInfo(null)}
                disabled={regenerating}
                className="flex-1 rounded-xl py-3 text-sm font-bold disabled:opacity-60"
                style={{ background: "#F3EEE8", color: "#6B6059" }}
                type="button"
              >
                취소
              </button>
              <button
                onClick={handleConfirmRegenerate}
                disabled={regenerating || regenInfo.pearls < regenInfo.cost}
                className="flex-1 rounded-xl py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "#C9856A", color: "#FFFCF8" }}
                type="button"
              >
                {regenerating ? "답장 쓰는 중..." : "다시 받기"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(28px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}