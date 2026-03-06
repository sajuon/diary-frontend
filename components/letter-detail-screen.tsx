"use client"

import { useState } from "react"

interface LetterApiResponse {
  id: number
  user_id: number
  diary_entry_id: number
  letter_date: string
  content: string
  element_hint?: Record<string, unknown> | null
  model?: string | null
  created_at: string
  updated_at: string
}

interface LetterDetailScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
  letter?: LetterApiResponse | null
}

function formatLetterDate(dateStr?: string) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default function LetterDetailScreen({
  onNavigate,
  letter,
}: LetterDetailScreenProps) {
  const [starred, setStarred] = useState(false)
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null)

  if (!letter) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "#F8F6F2" }}
      >
        <p className="text-sm" style={{ color: "#6B6059" }}>
          편지를 불러오지 못했어요.
        </p>
      </div>
    )
  }

  const formattedDate = formatLetterDate(letter.letter_date)

  return (
    <div className="flex flex-col h-full font-sans" style={{ background: "#F8F6F2" }}>
      <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0">
        <button
          onClick={() => onNavigate("letterbox")}
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

        <div className="text-center">
          <h2 className="text-base font-extrabold" style={{ color: "#3D3530" }}>
            해도리의 편지
          </h2>
          <p className="text-xs" style={{ color: "#9A8F87" }}>
            {formattedDate}
          </p>
        </div>

        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "#EDE8E0" }}
            aria-hidden="true"
          >
            🦦
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "#3D3530" }}>
              해도리
            </p>
            <p className="text-xs" style={{ color: "#9A8F87" }}>
              {formattedDate} · 당신에게
            </p>
          </div>
        </div>

        <div
          className="px-5 py-6 rounded-3xl"
          style={{
            background: "#FFFCF8",
            border: "1.5px solid #E5DDD5",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <p
            className="text-sm font-sans leading-loose whitespace-pre-line"
            style={{ color: "#3D3530", lineHeight: "1.9" }}
          >
            {letter.content}
          </p>
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
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: starred ? "#FFF3D0" : "#EDE8E0" }}
            >
              {starred ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="#F4C97A"
                  stroke="#C9A060"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9A8F87"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              )}
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: starred ? "#C9A060" : "#6B6059" }}
            >
              {starred ? "즐겨찾기에 추가됨" : "즐겨찾기"}
            </span>
          </button>

          <div className="mb-4" style={{ height: "1px", background: "#F0EAE4" }} />

          <p className="text-xs font-semibold mb-3 text-center" style={{ color: "#9A8F87" }}>
            이 편지는 도움이 되었나요?
          </p>

          <div className="flex gap-3 justify-center mb-3">
            <button
              onClick={() => setFeedback(feedback === "like" ? null : "like")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all active:scale-95"
              style={{
                background: feedback === "like" ? "#D4EACF" : "#EDE8E0",
                border: feedback === "like" ? "1.5px solid #A8BBA5" : "1.5px solid transparent",
              }}
              aria-pressed={feedback === "like"}
            >
              좋아요
            </button>

            <button
              onClick={() => setFeedback(feedback === "dislike" ? null : "dislike")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all active:scale-95"
              style={{
                background: feedback === "dislike" ? "#FDDDD8" : "#EDE8E0",
                border: feedback === "dislike" ? "1.5px solid #F2A8A8" : "1.5px solid transparent",
              }}
              aria-pressed={feedback === "dislike"}
            >
              아쉬워요
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
    </div>
  )
}