//변환 끝
"use client"

import LetterActions from "@/components/letter-actions"
import AppliedLetterPaper, { LetterText } from "@/components/letter-paper"

interface LetterApiResponse {
  id: number
  user_id: number
  diary_entry_id: number
  letter_date: string
  content: string
  element_hint?: Record<string, unknown> | null
  model?: string | null
  is_favorite?: boolean
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

        <AppliedLetterPaper>
          <LetterText>{letter.content}</LetterText>
        </AppliedLetterPaper>

        <LetterActions letter={letter} />
      </div>
    </div>
  )
}