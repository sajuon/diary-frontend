"use client"

import { useState, useEffect } from "react"

interface CalendarScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
}

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

type DiaryCalendarItem = {
  mood: string
  weather: string
  snippet: string
}

const dayLabels = ["일", "월", "화", "수", "목", "금", "토"]

export default function CalendarScreen({ onNavigate }: CalendarScreenProps) {
  const [diaries, setDiaries] = useState<Record<number, DiaryCalendarItem>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!initialized) {
      ;(async () => {
        try {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("access_token")
              : null

          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/diary?month=${year}-${month
              .toString()
              .padStart(2, "0")}`,
            {
              headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
              credentials: "include",
            }
          )

          if (res.ok) {
            const data = await res.json()
            if (data.length > 0) {
              const latest = data.reduce((a: any, b: any) =>
                new Date(a.entry_date) > new Date(b.entry_date) ? a : b
              )
              const latestDate = new Date(latest.entry_date)
              setYear(latestDate.getFullYear())
              setMonth(latestDate.getMonth() + 1)
            }
          }
        } catch {
          // 최초 진입 실패는 무시
        } finally {
          setInitialized(true)
        }
      })()
    }
  }, [initialized, year, month])

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  const now = new Date()
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

  useEffect(() => {
    async function fetchDiaries() {
      setLoading(true)
      setError(null)

      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/diary?month=${year}-${month
            .toString()
            .padStart(2, "0")}`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
          }
        )

        if (!res.ok) throw new Error("일기 불러오기 실패")

        const data = await res.json()

        const diaryMap: Record<number, DiaryCalendarItem> = {}

        data.forEach((entry: any) => {
          const day = new Date(entry.entry_date).getDate()
          diaryMap[day] = {
            mood: entry.mood_tags?.[0] || "calm",
            weather: entry.weather || "sunny",
            snippet: (entry.content || "").slice(0, 12),
          }
        })

        setDiaries(diaryMap)
      } catch (e: any) {
        setError(e.message || "일기 불러오기 실패")
      } finally {
        setLoading(false)
      }
    }

    fetchDiaries()
  }, [year, month])

  return (
    <div className="flex flex-col h-full font-sans" style={{ background: "#F8F6F2" }}>
      <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0">
        <button
          onClick={() => onNavigate("home")}
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
                  if (hasEntry) {
                    const dateStr = `${year}-${month
                      .toString()
                      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`
                    onNavigate("diary-detail", { date: dateStr })
                  }
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
                      {entry.snippet}
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
        </div>
      </div>
    </div>
  )
}