// /home/dori/diary-frontend/components/calendar-screen.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { apiClient, type DiaryType } from "@/lib/api"
import { getDailyQuestion } from "@/lib/daily-questions"
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
  diary_type?: DiaryType | null
  question_text?: string | null
  created_at: string
  updated_at: string
}

type DiaryCalendarItem = {
  entries: DiaryApiItem[]
  question?: DiaryApiItem
  free?: DiaryApiItem
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

function formatDate(year: number, month: number, day: number) {
  return `${year}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`
}

function getTodayDateString() {
  const now = new Date()
  return formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

function dateStringToLocalDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function getQuestionUserKey() {
  if (typeof window === "undefined") return "guest"

  return (
    window.localStorage.getItem("user_id") ||
    window.localStorage.getItem("access_token") ||
    "guest"
  )
}

function normalizeDiaryType(value?: DiaryType | null): DiaryType {
  return value === "question" ? "question" : "free"
}

function getDiaryLabel(entry: DiaryApiItem) {
  if (normalizeDiaryType(entry.diary_type) === "question") {
    const question = (entry.question_text || "").replace(/\s+/g, " ").trim()
    if (question) return question.length > 8 ? `${question.slice(0, 8)}…` : question
  }

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
    const diaryType = normalizeDiaryType(entry.diary_type)

    if (!diaryMap[day]) {
      diaryMap[day] = {
        entries: [],
      }
    }

    diaryMap[day].entries.push(entry)

    if (diaryType === "question") {
      diaryMap[day].question = entry
    } else {
      diaryMap[day].free = entry
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [futureDate, setFutureDate] = useState<string | null>(null)

  const [monthCache, setMonthCache] = useState<DiaryMonthCache>({
    [initialMonthKey]: initialDiaries,
  })

  const targetMonthKey = formatMonth(year, month)
  const todayDateStr = getTodayDateString()

  const currentMonthDiaries = useMemo(() => {
    return monthCache[targetMonthKey] ?? []
  }, [monthCache, targetMonthKey])

  const diaries = useMemo(() => {
    return buildDiaryMap(currentMonthDiaries)
  }, [currentMonthDiaries])

  const selectedEntryGroup = useMemo(() => {
    if (!selectedDate) return null
    const day = Number(selectedDate.split("-")[2])
    return diaries[day] ?? null
  }, [selectedDate, diaries])

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

      if (hasCache && !invalidated) return

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
        if (!cancelled) setLoading(false)
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
        if (!Object.prototype.hasOwnProperty.call(prev, monthKey)) return prev

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

    if (month === 1) {
      setYear((prev) => prev - 1)
      setMonth(12)
    } else {
      setMonth((prev) => prev - 1)
    }
  }

  const handleNextMonth = () => {
    setError(null)

    if (month === 12) {
      setYear((prev) => prev + 1)
      setMonth(1)
    } else {
      setMonth((prev) => prev + 1)
    }
  }

  const handleWriteDiary = (date: string, diaryType: DiaryType) => {
    if (diaryType === "question") {
      const question = getDailyQuestion({
        userKey: getQuestionUserKey(),
        date: dateStringToLocalDate(date),
      })

      onNavigate("diary", {
        date,
        diary_type: "question",
        question,
        questionDate: date,
        questionSource: "rule_365",
      })

      setSelectedDate(null)
      return
    }

    onNavigate("diary", {
      date,
      diary_type: "free",
    })

    setSelectedDate(null)
  }

  const handleOpenDiaryDetail = (date: string, diaryType: DiaryType) => {
    onNavigate("diary-detail", {
      date,
      diary_type: diaryType,
    })

    setSelectedDate(null)
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const today = now.getDate()

  const startDay = new Date(
    `${year}-${month.toString().padStart(2, "0")}-01`
  ).getDay()

  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div
      className="relative flex flex-col h-full font-sans"
      style={{ background: "#F8F6F2" }}
    >
      <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0">
        <button
          onClick={() => onNavigate("home")}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
          aria-label="뒤로 가기"
          type="button"
        >
          ←
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "#EDE8E0" }}
            aria-label="이전 달"
            type="button"
          >
            ‹
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
            ›
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
                color: i === 0 ? "#F2A8A8" : i === 6 ? "#A8BBA5" : "#9A8F87",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 px-4">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />

            const entryGroup = diaries[day]
            const isToday = isCurrentMonth && day === today
            const colIdx = idx % 7
            const hasEntry = Boolean(entryGroup)
            const dateStr = formatDate(year, month, day)
            const isFutureDate = dateStr > todayDateStr

            const displayEntry = entryGroup?.free ?? entryGroup?.question ?? null
            const hasQuestion = Boolean(entryGroup?.question)
            const hasFree = Boolean(entryGroup?.free)

            return (
              <button
                key={day}
                onClick={() => {
                  if (isFutureDate && !hasEntry) {
                    setFutureDate(dateStr)
                    return
                  }

                  setSelectedDate(dateStr)
                }}
                className="flex flex-col items-center rounded-2xl pt-2 pb-2.5 transition-all active:scale-95"
                style={{
                  background: isToday
                    ? "#F2C4A8"
                    : hasEntry
                      ? "#FFFCF8"
                      : isFutureDate
                        ? "#ECE7E1"
                        : "#F3EEE8",
                  border: isToday
                    ? "1.5px solid #EAAB88"
                    : hasEntry
                      ? "1.5px solid #E5DDD5"
                      : isFutureDate
                        ? "1.5px solid #DDD5CC"
                        : "1.5px dashed #DED5CC",
                  boxShadow: hasEntry ? "0 1px 6px rgba(0,0,0,0.04)" : "none",
                  minHeight: hasEntry ? "86px" : "54px",
                  cursor: "pointer",
                  opacity: isFutureDate && !hasEntry ? 0.7 : 1,
                  WebkitTapHighlightColor: "transparent",
                }}
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
                          : isFutureDate
                            ? "#B8AEA6"
                            : "#3D3530",
                  }}
                >
                  {day}
                </span>

                {displayEntry ? (
                  <>
                    <span className="text-sm leading-none">
                      {weatherIcons[displayEntry.weather || "sunny"] || "☀️"}
                    </span>

                    <div
                      className="w-2 h-2 rounded-full mt-1"
                      style={{
                        background:
                          moodColors[displayEntry.mood_tags?.[0] || "calm"] ||
                          "#A8BBA5",
                      }}
                    />

                    <div className="flex gap-0.5 mt-1">
                      {hasQuestion && (
                        <span
                          className="px-1 rounded-full font-bold"
                          style={{
                            fontSize: "8px",
                            background: "#FFF3E8",
                            color: "#C9856A",
                          }}
                        >
                          Q
                        </span>
                      )}

                      {hasFree && (
                        <span
                          className="px-1 rounded-full font-bold"
                          style={{
                            fontSize: "8px",
                            background: "#EEF3EC",
                            color: "#7D967A",
                          }}
                        >
                          F
                        </span>
                      )}
                    </div>

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
                      {getDiaryLabel(displayEntry)}
                    </span>
                  </>
                ) : (
                  <span
                    className="mt-1 text-[10px] font-bold"
                    style={{ color: isFutureDate ? "#B8AEA6" : "#C6B8AE" }}
                  >
                    {isFutureDate ? "·" : "+"}
                  </span>
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
            onClick={() => onNavigate("emotion-report")}
            className="w-full py-4 rounded-2xl font-extrabold text-base transition-all active:scale-[0.98]"
            style={{
              background: "#C9856A",
              color: "#FFFCF8",
              boxShadow: "0 4px 18px rgba(201,133,106,0.28)",
            }}
            type="button"
          >
            감정 리포트 확인하기
          </button>

          <button
            onClick={() => onNavigate("letterbox")}
            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
            style={{
              background: "#FFFCF8",
              color: "#C9856A",
              border: "1.5px solid #E5DDD5",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
            type="button"
          >
            해도리 편지함
          </button>
        </div>
      </div>

      {selectedDate && (
        <CalendarModal
          icon="📖"
          title="어떤 일기를 열까요?"
          description={
            <DiaryTypeSelectContent
              date={selectedDate}
              questionEntry={selectedEntryGroup?.question}
              freeEntry={selectedEntryGroup?.free}
              onOpenQuestion={() => handleOpenDiaryDetail(selectedDate, "question")}
              onOpenFree={() => handleOpenDiaryDetail(selectedDate, "free")}
              onWriteQuestion={() => handleWriteDiary(selectedDate, "question")}
              onWriteFree={() => handleWriteDiary(selectedDate, "free")}
            />
          }
          primaryText="닫기"
          onPrimary={() => setSelectedDate(null)}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {futureDate && (
        <CalendarModal
          icon="🌙"
          title="아직 미래의 일기는 작성할 수 없어요"
          description={
            <>
              {futureDate}의 일기는 그날이 되면 작성할 수 있어요.
              <br />
              해도리가 그날의 이야기도 기다리고 있을게요.
            </>
          }
          primaryText="확인"
          onPrimary={() => setFutureDate(null)}
          onClose={() => setFutureDate(null)}
        />
      )}
    </div>
  )
}

function DiaryTypeSelectContent({
  date,
  questionEntry,
  freeEntry,
  onOpenQuestion,
  onOpenFree,
  onWriteQuestion,
  onWriteFree,
}: {
  date: string
  questionEntry?: DiaryApiItem
  freeEntry?: DiaryApiItem
  onOpenQuestion: () => void
  onOpenFree: () => void
  onWriteQuestion: () => void
  onWriteFree: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <span>{date}의 일기를 선택해 주세요.</span>

      <button
        onClick={questionEntry ? onOpenQuestion : onWriteQuestion}
        className="w-full py-3 rounded-2xl font-extrabold text-sm transition-all active:scale-[0.98]"
        style={{
          background: "#FFF3E8",
          color: "#C9856A",
          border: "1.5px solid rgba(201,133,106,0.22)",
        }}
        type="button"
      >
        💬 {questionEntry ? "질문형 일기 보기" : "질문형 일기 쓰기"}
      </button>

      <button
        onClick={freeEntry ? onOpenFree : onWriteFree}
        className="w-full py-3 rounded-2xl font-extrabold text-sm transition-all active:scale-[0.98]"
        style={{
          background: "#EEF3EC",
          color: "#7D967A",
          border: "1.5px solid rgba(125,150,122,0.22)",
        }}
        type="button"
      >
        ✍️ {freeEntry ? "자유형 일기 보기" : "자유형 일기 쓰기"}
      </button>
    </div>
  )
}

function CalendarModal({
  icon,
  title,
  description,
  primaryText,
  onPrimary,
  secondaryText,
  onSecondary,
  onClose,
}: {
  icon: string
  title: string
  description: ReactNode
  primaryText: string
  onPrimary: () => void
  secondaryText?: string
  onSecondary?: () => void
  onClose: () => void
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(61, 53, 48, 0.28)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[28px] px-6 py-6"
        style={{
          background: "#FFFCF8",
          border: "1.5px solid #E5DDD5",
          boxShadow: "0 16px 40px rgba(61,53,48,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
            style={{ background: "#F8EFE7" }}
          >
            {icon}
          </div>

          <h3
            className="text-lg font-extrabold mb-2"
            style={{ color: "#3D3530" }}
          >
            {title}
          </h3>

          <div
            className="text-sm leading-relaxed mb-5"
            style={{ color: "#8A7E76" }}
          >
            {description}
          </div>

          <button
            onClick={onPrimary}
            className="w-full py-3.5 rounded-2xl font-extrabold text-sm transition-all active:scale-[0.98]"
            style={{
              background: "#C9856A",
              color: "#FFFCF8",
              boxShadow: "0 4px 16px rgba(201,133,106,0.25)",
            }}
            type="button"
          >
            {primaryText}
          </button>

          {secondaryText && onSecondary && (
            <button
              onClick={onSecondary}
              className="w-full mt-2 py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
              style={{
                background: "#F3EEE8",
                color: "#8A7E76",
              }}
              type="button"
            >
              {secondaryText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}