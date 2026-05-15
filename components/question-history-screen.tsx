// /home/dori/diary-frontend/components/question-history-screen.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { apiClient } from "@/lib/api"

type DiaryType = "question" | "free"

type DiaryEntry = {
  id: number
  user_id: number
  entry_date: string
  content: string
  weather?: string | null
  mood_tags?: string[] | null
  summary_tag?: string | null
  diary_type?: DiaryType | null
  question_id?: string | null
  question_text?: string | null
  created_at: string
  updated_at: string
}

interface QuestionHistoryScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
  date?: string
  diary_id?: number
  question_id?: string
  question_text?: string
}

const dayLabels = ["일", "월", "화", "수", "목", "금", "토"]

function getDayLabel(dateString: string) {
  const date = new Date(dateString)
  return dayLabels[date.getDay()] ?? ""
}

function formatKoreanDate(dateString: string) {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayLabel = getDayLabel(dateString)

  return `${year}년 ${month}월 ${day}일 ${dayLabel}요일`
}

function getMonthDayFromDate(dateString?: string) {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null

  const [, month, day] = dateString.split("-")
  return `${month}-${day}`
}

export default function QuestionHistoryScreen({
  onNavigate,
  date,
  diary_id,
  question_text,
}: QuestionHistoryScreenProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [displayQuestionText, setDisplayQuestionText] = useState(question_text || "")

  const fallbackMonthDay = useMemo(() => {
    return getMonthDayFromDate(date)
  }, [date])

  useEffect(() => {
    let cancelled = false

    const loadQuestionHistory = async () => {
      setLoading(true)
      setError(null)

      try {
        if (!fallbackMonthDay) {
          throw new Error("날짜 정보가 올바르지 않아요.")
        }

        const response = await apiClient.getQuestionHistory({
          question_id: null,
          month_day: fallbackMonthDay,
        })

        const items = Array.isArray(response.items) ? response.items : []

        if (!cancelled) {
          setEntries(items)
          setDisplayQuestionText(
            response.question_text || question_text || items[0]?.question_text || ""
          )
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "지난 답변을 불러오지 못했어요."
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadQuestionHistory()

    return () => {
      cancelled = true
    }
  }, [fallbackMonthDay, question_text])

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
          onClick={() =>
            onNavigate("diary-detail", { date, diary_type: "question" })
          }
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
          aria-label="돌아가기"
          type="button"
        >
          ←
        </button>

        <div className="text-center">
          <h2 className="text-base font-extrabold" style={{ color: "#3D3530" }}>
            지난 답변 모아보기
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "#9A8F87" }}>
            같은 날짜의 질문 기록
          </p>
        </div>

        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div
          className="rounded-[28px] px-5 py-5 mb-4"
          style={{
            background: "#FFF9F0",
            border: "1.5px solid rgba(242,196,168,0.65)",
            boxShadow: "0 4px 16px rgba(201,133,106,0.08)",
          }}
        >
          <p className="text-xs font-bold mb-2" style={{ color: "#C9856A" }}>
            오늘의 질문
          </p>

          <p
            className="text-sm font-extrabold whitespace-pre-line"
            style={{ color: "#3D3530", lineHeight: "1.75" }}
          >
            {displayQuestionText || "질문 정보를 불러오지 못했어요."}
          </p>
        </div>

        {loading && (
          <div
            className="rounded-3xl px-5 py-6 text-center text-sm"
            style={{
              background: "#FFFCF8",
              color: "#9A8F87",
              border: "1.5px solid #E5DDD5",
            }}
          >
            지난 답변을 불러오는 중...
          </div>
        )}

        {error && !loading && (
          <div
            className="rounded-3xl px-5 py-6 text-center text-sm"
            style={{
              background: "#FFFCF8",
              color: "#D66B6B",
              border: "1.5px solid #F2C4C4",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div
            className="rounded-3xl px-5 py-6 text-center text-sm"
            style={{
              background: "#FFFCF8",
              color: "#9A8F87",
              border: "1.5px solid #E5DDD5",
            }}
          >
            아직 이 날짜의 지난 답변이 없어요.
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="space-y-4">
            {entries.map((entry, index) => {
              const isCurrentDiary = diary_id ? entry.id === diary_id : false

              return (
                <div
                  key={entry.id}
                  className="rounded-[28px] px-5 py-5"
                  style={{
                    background: isCurrentDiary ? "#FFFCF8" : "#FDF8F1",
                    border: isCurrentDiary
                      ? "1.5px solid rgba(201,133,106,0.35)"
                      : "1.5px solid #E5DDD5",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.045)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p
                        className="text-xs font-bold"
                        style={{ color: "#C9856A" }}
                      >
                        {isCurrentDiary
                          ? "현재 보고 있는 답변"
                          : index === 0
                            ? "가장 최근 답변"
                            : "지난 답변"}
                      </p>

                      <p
                        className="text-sm font-extrabold mt-1"
                        style={{ color: "#3D3530" }}
                      >
                        {formatKoreanDate(entry.entry_date)}
                      </p>
                    </div>

                    <span
                      className="px-2 py-1 rounded-full text-[10px] font-extrabold"
                      style={{
                        background: "#FFF3E8",
                        color: "#C9856A",
                      }}
                    >
                      Q
                    </span>
                  </div>

                  <p
                    className="text-sm whitespace-pre-line"
                    style={{ color: "#3D3530", lineHeight: "1.85" }}
                  >
                    {entry.content}
                  </p>
                </div>
              )
            })}
          </div>
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