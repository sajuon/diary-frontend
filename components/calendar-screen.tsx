"use client"

import { useState, useEffect } from "react"

interface CalendarScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
}

const moodColors: Record<string, string> = {
  happy:   "#F4C97A",
  calm:    "#A8BBA5",
  sad:     "#A8C4D4",
  angry:   "#F2A8A8",
  tired:   "#C4B8C4",
  excited: "#F2C4A8",
}

const weatherIcons: Record<string, string> = {
  sunny:  "☀️",
  cloudy: "☁️",
  rainy:  "🌧️",
  snowy:  "❄️",
  windy:  "🌬️",
}

const diaryData: Record<number, { mood: string; weather: string; snippet: string }> = {
  1:  { mood: "happy",   weather: "sunny",  snippet: "봄바람이 불었던 날" },
  3:  { mood: "calm",    weather: "cloudy", snippet: "조용한 카페에서" },
  5:  { mood: "excited", weather: "sunny",  snippet: "친구를 만난 날" },
  7:  { mood: "tired",   weather: "rainy",  snippet: "비가 많이 왔어" },
  10: { mood: "calm",    weather: "sunny",  snippet: "산책을 했어요" },
  12: { mood: "sad",     weather: "cloudy", snippet: "왜인지 울적한 날" },
  14: { mood: "happy",   weather: "sunny",  snippet: "맛있는 걸 먹었다" },
  17: { mood: "calm",    weather: "windy",  snippet: "바람이 시원했어" },
  19: { mood: "excited", weather: "sunny",  snippet: "새 책을 샀어요" },
  21: { mood: "tired",   weather: "cloudy", snippet: "일이 많았던 하루" },
  23: { mood: "happy",   weather: "sunny",  snippet: "좋은 일이 생겼어" },
  25: { mood: "calm",    weather: "rainy",  snippet: "빗소리 들으며 책" },
  26: { mood: "excited", weather: "sunny",  snippet: "오늘!" },
}

const dayLabels = ["일", "월", "화", "수", "목", "금", "토"]

export default function CalendarScreen({ onNavigate }: CalendarScreenProps) {
  const [diaries, setDiaries] = useState<Record<number, { mood: string; weather: string; snippet: string }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [initialized, setInitialized] = useState(false);
      // 최초 렌더 시 가장 최근 일기 기준으로 year/month 설정
      useEffect(() => {
        if (!initialized) {
          (async () => {
            const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/diary?month=${year}-${month.toString().padStart(2,"0")}`, {
              headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
              credentials: "include"
            });
            if (res.ok) {
              const data = await res.json();
              if (data.length > 0) {
                const latest = data.reduce((a: any, b: any) => new Date(a.entry_date) > new Date(b.entry_date) ? a : b);
                const latestDate = new Date(latest.entry_date);
                setYear(latestDate.getFullYear());
                setMonth(latestDate.getMonth() + 1);
              }
            }
            setInitialized(true);
          })();
        }
      }, [initialized]);
    const handlePrevMonth = () => {
      if (month === 1) {
        setYear(year - 1);
        setMonth(12);
      } else {
        setMonth(month - 1);
      }
    };

    const handleNextMonth = () => {
      if (month === 12) {
        setYear(year + 1);
        setMonth(1);
      } else {
        setMonth(month + 1);
      }
    };
  const daysInMonth = 28
  const today = new Date().getDate()
  const startDay = new Date(`${year}-${month.toString().padStart(2,"0")}-01`).getDay()
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  useEffect(() => {
    async function fetchDiaries() {
      setLoading(true)
      setError(null)
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/diary?month=${year}-${month.toString().padStart(2,"0")}`, {
          headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
          credentials: "include"
        })
        if (!res.ok) throw new Error("일기 불러오기 실패")
        const data = await res.json()
        // 날짜별로 변환 (예시: { 1: {...}, 2: {...} })
        const diaryMap: Record<number, { mood: string; weather: string; snippet: string }> = {}
        data.forEach((entry: any) => {
          const day = new Date(entry.entry_date).getDate()
          diaryMap[day] = {
            mood: entry.mood_tags?.[0] || "calm",
            weather: "sunny", // 백엔드에 날씨 정보 없으면 기본값
            snippet: entry.content.slice(0, 12),
          }
        })
        setDiaries(diaryMap)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDiaries()
  }, [year, month])

  return (
    <div className="flex flex-col h-full font-sans" style={{ background: "#F8F6F2" }}>

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0">
        <button
          onClick={() => onNavigate("home")}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
          aria-label="뒤로 가기"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D3530" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "#EDE8E0" }}
            aria-label="이전 달"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9A8F87" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9A8F87" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

      {/* ── Scrollable body ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 px-4 mb-1">
          {dayLabels.map((d, i) => (
            <div
              key={d}
              className="text-center text-xs font-bold py-1"
              style={{ color: i === 0 ? "#F2A8A8" : i === 6 ? "#A8BBA5" : "#9A8F87" }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* ── Calendar grid (PRIMARY) ───────────────────── */}
        <div className="grid grid-cols-7 gap-1.5 px-4">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />

            const entry = diaries[day]
            const isToday = day === today
            const colIdx = idx % 7
            const hasEntry = Boolean(entry)

            return (
              <button
                key={day}
                onClick={() => {
                  if (hasEntry) {
                    const dateStr = `${year}-${month.toString().padStart(2,"0")}-${day.toString().padStart(2,"0")}`;
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
                    <span className="text-sm leading-none">{weatherIcons[entry.weather]}</span>
                    <div
                      className="w-2 h-2 rounded-full mt-1"
                      style={{ background: moodColors[entry.mood] }}
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

        {error && <div className="text-red-500 text-sm px-5">{error}</div>}
        {/* ── Divider ───────────────────────────────────── */}
        <div
          className="mx-5 my-5"
          style={{ height: "1px", background: "#E5DDD5" }}
        />

        {/* ── CTA Buttons (SECONDARY, below grid) ────────── */}
        <div className="px-5 pb-8 flex flex-col gap-3">

          {/* Primary: 오늘 일기 쓰기 */}
          <button
            onClick={() => onNavigate("diary")}
            className="w-full py-4 rounded-2xl font-extrabold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              background: "#C9856A",
              color: "#FFFCF8",
              boxShadow: "0 4px 18px rgba(201,133,106,0.28)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFCF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            오늘 일기 쓰기
          </button>

          {/* Secondary: 해도리 편지함 */}
          <button
            onClick={() => onNavigate("letterbox")}
            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              background: "#FFFCF8",
              color: "#C9856A",
              border: "1.5px solid #E5DDD5",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9856A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
