"use client"

import { useState, useEffect } from "react"

interface DiaryDetailScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
  date?: string
  onUpdateDiary: (data: { content: string; mood_tags: string[] }) => Promise<void>
  onDeleteDiary: () => Promise<void>
}

interface DiaryEntryResponse {
  id?: number
  entry_date: string
  content: string
  mood_tags?: string[]
}

interface LetterResponse {
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

export default function DiaryDetailScreen({
  onNavigate,
  date,
  onUpdateDiary,
  onDeleteDiary,
}: DiaryDetailScreenProps) {
  const [starred, setStarred] = useState(false)
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null)
  const [entry, setEntry] = useState<DiaryEntryResponse | null>(null)
  const [letterContent, setLetterContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDiaryAndLetter() {
      if (!date) {
        setError("날짜 정보가 없습니다.")
        return
      }

      setLoading(true)
      setError(null)

      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null

        const headers: Record<string, string> = {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }

        const diaryRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/diary/date/${date}`,
          {
            headers,
            credentials: "include",
          }
        )

        if (!diaryRes.ok) {
          throw new Error("일기 불러오기 실패")
        }

        const diaryData: DiaryEntryResponse = await diaryRes.json()
        setEntry(diaryData)

        const month = String(date).slice(0, 7)

        const letterRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/letters?month=${month}`,
          {
            headers,
            credentials: "include",
          }
        )

        if (!letterRes.ok) {
          throw new Error("편지 불러오기 실패")
        }

        const letters: LetterResponse[] = await letterRes.json()

        const matchedLetter = letters.find(
          (letter) => letter.letter_date === diaryData.entry_date
        )

        setLetterContent(matchedLetter?.content ?? "")
      } catch (e: any) {
        setError(e.message ?? "데이터를 불러오는 중 오류가 발생했습니다.")
      } finally {
        setLoading(false)
      }
    }

    fetchDiaryAndLetter()
  }, [date])

  if (loading) {
    return <div className="p-8 text-center text-sm">불러오는 중...</div>
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>
  }

  if (!entry) {
    return <div className="p-8 text-center text-sm">일기 데이터 없음</div>
  }

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
            {entry.entry_date}의 일기
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span className="text-xs" aria-hidden="true">
              ☀️
            </span>
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: "#F4C97A" }}
            />
            <span className="text-xs" style={{ color: "#9A8F87" }}>
              {entry.mood_tags?.[0] ?? ""}
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
              {entry.content}
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
            <p
              className="text-sm whitespace-pre-line"
              style={{ color: "#3D3530", lineHeight: "1.9" }}
            >
              {letterContent || "아직 해도리 피드백이 없어요."}
            </p>
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
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors"
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

          <div style={{ height: "1px", background: "#F0EAE4" }} className="mb-4" />

          <p className="text-xs font-semibold mb-3 text-center" style={{ color: "#9A8F87" }}>
            해도리 피드백이 도움이 되었나요?
          </p>

          <div className="flex gap-3 justify-center mb-4">
            <button
              onClick={() => setFeedback(feedback === "like" ? null : "like")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all active:scale-95"
              style={{
                background: feedback === "like" ? "#D4EACF" : "#EDE8E0",
                border:
                  feedback === "like"
                    ? "1.5px solid #A8BBA5"
                    : "1.5px solid transparent",
              }}
              aria-pressed={feedback === "like"}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={feedback === "like" ? "#6B9E66" : "none"}
                stroke={feedback === "like" ? "#6B9E66" : "#9A8F87"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              <span
                className="text-sm font-bold"
                style={{ color: feedback === "like" ? "#6B9E66" : "#6B6059" }}
              >
                좋아요
              </span>
            </button>

            <button
              onClick={() =>
                setFeedback(feedback === "dislike" ? null : "dislike")
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all active:scale-95"
              style={{
                background: feedback === "dislike" ? "#FDDDD8" : "#EDE8E0",
                border:
                  feedback === "dislike"
                    ? "1.5px solid #F2A8A8"
                    : "1.5px solid transparent",
              }}
              aria-pressed={feedback === "dislike"}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={feedback === "dislike" ? "#C9856A" : "none"}
                stroke={feedback === "dislike" ? "#C9856A" : "#9A8F87"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
                <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
              </svg>
              <span
                className="text-sm font-bold"
                style={{ color: feedback === "dislike" ? "#C9856A" : "#6B6059" }}
              >
                아쉬워요
              </span>
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