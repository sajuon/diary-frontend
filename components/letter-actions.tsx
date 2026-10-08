"use client"

// 편지 아래 즐겨찾기 + 피드백(좋아요/아쉬워요 + 한마디) 영역.
// 일기 상세와 편지 상세가 같이 쓴다. 즐겨찾기·피드백 모두 서버에 저장된다.

import { useEffect, useState } from "react"
import { apiClient, type LetterFeedback } from "@/lib/api"
import { handlePearlReward } from "@/lib/pearl-events"

export default function LetterActions({
  letter,
}: {
  letter: { id: number; is_favorite?: boolean }
}) {
  const [starred, setStarred] = useState(Boolean(letter?.is_favorite))
  const [starSaving, setStarSaving] = useState(false)

  useEffect(() => {
    setStarred(Boolean(letter?.is_favorite))
  }, [letter?.id, letter?.is_favorite])

  const handleToggleStar = async () => {
    if (!letter?.id || starSaving) return
    const next = !starred
    setStarred(next)
    try {
      setStarSaving(true)
      const updated = await apiClient.updateLetterFavorite(letter.id, next)
      setStarred(Boolean(updated?.is_favorite))
    } catch (err) {
      console.error("Failed to update favorite:", err)
      setStarred(!next)
    } finally {
      setStarSaving(false)
    }
  }

  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null)
  const [feedbackComment, setFeedbackComment] = useState("")
  const [sentFeedback, setSentFeedback] = useState<LetterFeedback | null>(null)
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const letterId = letter?.id

  // 이미 보낸 피드백이 있으면 불러와서 표시
  useEffect(() => {
    if (!letterId) return
    let cancelled = false
    apiClient
      .getLetterFeedback(letterId)
      .then((saved) => {
        if (cancelled || !saved) return
        setSentFeedback(saved)
        setFeedback(saved.rating)
        setFeedbackComment(saved.comment)
      })
      .catch((err) => console.warn("Failed to load letter feedback:", err))
    return () => {
      cancelled = true
    }
  }, [letterId])

  const canSendFeedback =
    Boolean(letterId && feedback && feedbackComment.trim()) &&
    !feedbackSending &&
    !(
      sentFeedback &&
      sentFeedback.rating === feedback &&
      sentFeedback.comment === feedbackComment.trim()
    )

  const handleSendFeedback = async () => {
    if (!letterId || !feedback || !feedbackComment.trim()) return
    try {
      setFeedbackSending(true)
      setFeedbackError(null)
      const saved = await apiClient.sendLetterFeedback(letterId, {
        rating: feedback,
        comment: feedbackComment.trim(),
      })
      handlePearlReward(saved)
      setSentFeedback(saved)
      setFeedbackComment(saved.comment)
    } catch (err: any) {
      setFeedbackError(err?.message || "피드백을 보내지 못했어요.")
    } finally {
      setFeedbackSending(false)
    }
  }

  return (
    <div
      className="rounded-3xl px-5 py-5"
      style={{
        background: "#FFFCF8",
        border: "1.5px solid #E5DDD5",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <button
        onClick={handleToggleStar}
        disabled={starSaving}
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

      {feedback && (
        <div className="mb-4">
          <textarea
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value.slice(0, 300))}
            placeholder={
              feedback === "like"
                ? "어떤 점이 좋았는지 한마디 남겨주세요"
                : "어떤 점이 아쉬웠는지 한마디 남겨주세요"
            }
            rows={2}
            className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none"
            style={{
              background: "#F8F6F2",
              border: "1.5px solid #E5DDD5",
              color: "#3D3530",
            }}
          />
          <button
            onClick={handleSendFeedback}
            disabled={!canSendFeedback}
            className="mt-2 w-full rounded-2xl py-3 text-sm font-extrabold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "#C9856A", color: "#FFFCF8" }}
            type="button"
          >
            {feedbackSending
              ? "보내는 중..."
              : sentFeedback
                ? "피드백 수정하기"
                : "피드백 보내기 · 진주 +2"}
          </button>
          {feedbackError && (
            <p className="mt-2 text-center text-xs" style={{ color: "#C87A6C" }}>
              {feedbackError}
            </p>
          )}
        </div>
      )}

      <p
        className="text-center text-xs leading-relaxed"
        style={{ color: "#C4B8B0" }}
      >
        {sentFeedback ? (
          "피드백을 보냈어요. 고마워요!"
        ) : (
          <>
            여러분의 선택은 더 좋은 해도리를
            <br />
            만드는 데 사용됩니다.
          </>
        )}
      </p>
    </div>
  )
}
