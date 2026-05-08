"use client"

import { useEffect, useMemo, useState } from "react"
import { apiClient, ApiError } from "@/lib/api"
import {
  clearDiaryMonthInvalidation,
  isDiaryMonthInvalidated,
} from "@/lib/diary-cache"

interface CalendarScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
  initialDiaries?: DiaryApiItem[]
  initialYear?: number
  initialMonth?: number
}

type DiaryApiItem = {
  id: number
  user_id: number
  entry_date: string
  content: string
  weather?: string | null
  mood_tags?: string[] | null
  summary_tag?: string | null
  created_at: string
  updated_at: string
}

type DiaryCalendarItem = {
  mood: string
  weather: string
  label: string
}

type DiaryMonthCache = Record<string, DiaryApiItem[]>

const moodColors: Record<string, string> = {
  happy: "#F4C97A",
  calm: "#A8BBA5",
  sad: "#A8C4D4",
  angry: "#F2A8A8",
  tired: "#C4B8C4",
  excited: "#F2C4A8",
}

const weatherIcons: Record<string, string> = {
  sunny: "☀️",
  cloudy: "☁️",
  rainy: "🌧️",
  snowy: "❄️",
  windy: "🌬️",
}

const dayLabels = ["일", "월", "화", "수", "목", "금", "토"]

function formatMonth(year: number, month: number) {
  return `${year}-${month.toString().padStart(2, "0")}`
}

function getDiaryLabel(entry: DiaryApiItem) {
  const summaryTag = (entry.summary_tag || "").trim()
  if (summaryTag) return summaryTag

  const content = (entry.content || "").replace(/\s+/g, " ").trim()
  if (!content) return ""

  const compact = content.replace(/\s+/g, "")
  return compact.length > 6 ? `${compact.slice(0, 6)}…` : compact
}

function buildDiaryMap(data: DiaryApiItem[]): Record<number, DiaryCalendarItem> {
  const diaryMap: Record<number, DiaryCalendarItem> = {}

  data.forEach((entry) => {
    const day = new Date(entry.entry_date).getDate()

    diaryMap[day] = {
      mood: entry.mood_tags?.[0] || "calm",
      weather: entry.weather || "sunny",
      label: getDiaryLabel(entry),
    }
  })

  return diaryMap
}

export default function CalendarScreen({
  onNavigate,
  initialDiaries = [],
  initialYear,
  initialMonth,
}: CalendarScreenProps) {
  const now = new Date()

  const startYear = initialYear ?? now.getFullYear()
  const startMonth = initialMonth ?? now.getMonth() + 1
  const initialMonthKey = formatMonth(startYear, startMonth)

  const [year, setYear] = useState<number>(startYear)
  const [month, setMonth] = useState<number>(startMonth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [batchSummaryLoading, setBatchSummaryLoading] = useState(false)
  const [batchSummaryMessage, setBatchSummaryMessage] = useState<string | null>(null)

  const [monthCache, setMonthCache] = useState<DiaryMonthCache>({
    [initialMonthKey]: initialDiaries,
  })

  const targetMonthKey = formatMonth(year, month)

  const currentMonthDiaries = useMemo(() => {
    return monthCache[targetMonthKey] ?? []
  }, [monthCache, targetMonthKey])

  const diaries = useMemo(() => {
    return buildDiaryMap(currentMonthDiaries)
  }, [currentMonthDiaries])

  useEffect(() => {
    let cancelled = false

    const invalidated = isDiaryMonthInvalidated(targetMonthKey)
    const hasCache = Object.prototype.hasOwnProperty.call(monthCache, targetMonthKey)

    const loadMonthDiaries = async () => {
      if (invalidated && hasCache) {
        setMonthCache((prev) => {
          const next = { ...prev }
          delete next[targetMonthKey]
          return next
        })
      }

      if (hasCache && !invalidated) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await apiClient.getDiaries(targetMonthKey)
        const safeData = Array.isArray(data) ? data : []

        if (!cancelled) {
          setMonthCache((prev) => ({
            ...prev,
            [targetMonthKey]: safeData,
          }))
          clearDiaryMonthInvalidation(targetMonthKey)
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "일기 불러오기 실패"

        if (!cancelled) {
          setError(message)
          setMonthCache((prev) => ({
            ...prev,
            [targetMonthKey]: [],
          }))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadMonthDiaries()

    return () => {
      cancelled = true
    }
  }, [targetMonthKey, monthCache])

  useEffect(() => {
    const handleDiaryMonthInvalidated = (event: Event) => {
      const customEvent = event as CustomEvent<{ monthKey?: string }>
      const monthKey = customEvent.detail?.monthKey
      if (!monthKey) return

      setMonthCache((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, monthKey)) {
          return prev
        }

        const next = { ...prev }
        delete next[monthKey]
        return next
      })
    }

    window.addEventListener(
      "diary-month-invalidated",
      handleDiaryMonthInvalidated as EventListener
    )

    return () => {
      window.removeEventListener(
        "diary-month-invalidated",
        handleDiaryMonthInvalidated as EventListener
      )
    }
  }, [])

  const handlePrevMonth = () => {
    setError(null)
    setBatchSummaryMessage(null)

    if (month === 1) {
      setYear((prev) => prev - 1)
      setMonth(12)
    } else {
      setMonth((prev) => prev - 1)
    }
  }

  const handleNextMonth = () => {
    setError(null)
    setBatchSummaryMessage(null)

    if (month === 12) {
      setYear((prev) => prev + 1)
      setMonth(1)
    } else {
      setMonth((prev) => prev + 1)
    }
  }

  const handleBatchSummaryGenerate = async () => {
    try {
      setBatchSummaryLoading(true)
      setBatchSummaryMessage(null)
      setError(null)

      const result = await apiClient.generateMissingDiarySummaryTags()

      setBatchSummaryMessage(
        result?.message || `${result?.updated_count ?? 0}개의 일기를 요약했어.`
      )

      Object.keys(monthCache).forEach((monthKey) => {
        clearDiaryMonthInvalidation(monthKey)
      })

      setMonthCache((prev) => {
        const next = { ...prev }
        delete next[targetMonthKey]
        return next
      })
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "일기 전체 요약 실패"

      setBatchSummaryMessage(message)
    } finally {
      setBatchSummaryLoading(false)
    }
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1
  const today = now.getDate()

  const startDay = new Date(
    `${year}-${month.toString().padStart(2, "0")}-01`
  ).getDay()

  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="flex flex-col h-full font-sans" style={{ background: "#F8F6F2" }}>
      <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0">
        <button
          onClick={() => onNavigate("home")}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
          aria-label="뒤로 가기"
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

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "#EDE8E0" }}
            aria-label="이전 달"
            type="button"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9A8F87"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <h2 className="text-base font-extrabold" style={{ color: "#3D3530" }}>
            {year}년 {month}월
          </h2>

          <button
            onClick={handleNextMonth}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "#EDE8E0" }}
            aria-label="다음 달"
            type="button"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9A8F87"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div
          className="px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: "#F4C97A", color: "#3D3530" }}
        >
          PRO
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 px-4 mb-1">
          {dayLabels.map((d, i) => (
            <div
              key={d}
              className="text-center text-xs font-bold py-1"
              style={{
                color:
                  i === 0 ? "#F2A8A8" : i === 6 ? "#A8BBA5" : "#9A8F87",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 px-4">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />

            const entry = diaries[day]
            const isToday = isCurrentMonth && day === today
            const colIdx = idx % 7
            const hasEntry = Boolean(entry)

            return (
              <button
                key={day}
                onClick={() => {
                  if (!hasEntry) return

                  const dateStr = `${year}-${month
                    .toString()
                    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`

                  onNavigate("diary-detail", { date: dateStr })
                }}
                disabled={!hasEntry}
                className="flex flex-col items-center rounded-2xl pt-2 pb-2.5 transition-all"
                style={{
                  background: isToday
                    ? "#F2C4A8"
                    : hasEntry
                      ? "#FFFCF8"
                      : "transparent",
                  border: isToday
                    ? "1.5px solid #EAAB88"
                    : hasEntry
                      ? "1.5px solid #E5DDD5"
                      : "1.5px solid transparent",
                  boxShadow: hasEntry ? "0 1px 6px rgba(0,0,0,0.04)" : "none",
                  minHeight: hasEntry ? "72px" : "54px",
                  cursor: hasEntry ? "pointer" : "default",
                  WebkitTapHighlightColor: "transparent",
                }}
                aria-label={`${day}일${hasEntry ? ", 일기 보기" : ""}`}
                type="button"
              >
                <span
                  className="text-xs font-bold mb-0.5"
                  style={{
                    color: isToday
                      ? "#C9856A"
                      : colIdx === 0
                        ? "#F2A8A8"
                        : colIdx === 6
                          ? "#A8BBA5"
                          : "#3D3530",
                  }}
                >
                  {day}
                </span>

                {entry && (
                  <>
                    <span className="text-sm leading-none">
                      {weatherIcons[entry.weather] || "☀️"}
                    </span>

                    <div
                      className="w-2 h-2 rounded-full mt-1"
                      style={{
                        background: moodColors[entry.mood] || "#A8BBA5",
                      }}
                    />

                    <span
                      className="mt-0.5 text-center leading-tight px-0.5"
                      style={{
                        fontSize: "8px",
                        color: "#9A8F87",
                        maxWidth: "100%",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {entry.label}
                    </span>
                  </>
                )}
              </button>
            )
          })}
        </div>

        {loading && (
          <div className="text-sm px-5 mt-3" style={{ color: "#9A8F87" }}>
            불러오는 중...
          </div>
        )}

        {error && <div className="text-red-500 text-sm px-5 mt-3">{error}</div>}

        <div
          className="mx-5 my-5"
          style={{ height: "1px", background: "#E5DDD5" }}
        />

        <div className="px-5 pb-8 flex flex-col gap-3">
          <button
            onClick={() => onNavigate("diary")}
            className="w-full py-4 rounded-2xl font-extrabold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              background: "#C9856A",
              color: "#FFFCF8",
              boxShadow: "0 4px 18px rgba(201,133,106,0.28)",
            }}
            type="button"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFCF8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            오늘 일기 쓰기
          </button>

          <button
            onClick={() => onNavigate("letterbox")}
            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              background: "#FFFCF8",
              color: "#C9856A",
              border: "1.5px solid #E5DDD5",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
            type="button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C9856A"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            해도리 편지함
          </button>

          {/*<button
            onClick={handleBatchSummaryGenerate}
            disabled={batchSummaryLoading}
            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "#FFFCF8",
              color: "#6F5CFF",
              border: "1.5px solid #DDD7FF",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
            type="button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6F5CFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {batchSummaryLoading
              ? "태그 없는 일기 전체 요약 중..."
              : "태그 없는 일기 전체 요약하기"}
          </button>*/}

          {batchSummaryMessage && (
            <div
              className="w-full rounded-2xl px-4 py-3 text-sm font-medium"
              style={{
                background: "#FFFCF8",
                color: "#6B625C",
                border: "1px solid #E5DDD5",
              }}
            >
              {batchSummaryMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}