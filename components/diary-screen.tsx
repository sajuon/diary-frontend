// /home/dori/diary-frontend/components/diary-screen.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { apiClient } from "@/lib/api"
import { getDailyQuestion } from "@/lib/daily-questions"
import {
  getDiaryMonthKeyFromDate,
  invalidateDiaryMonth,
} from "@/lib/diary-cache"

interface DiaryScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
  initialQuestion?: string
  initialQuestionDate?: string
  initialQuestionSource?: string
}

type DiarySaveResponse = {
  id?: number
  user_id?: number
  entry_date?: string
  content?: string
  weather?: string | null
  mood_tags?: string[] | null
  summary_tag?: string | null
  created_at?: string
  updated_at?: string
}

const weathers = [
  { id: "sunny", label: "맑음", icon: "☀️" },
  { id: "cloudy", label: "흐림", icon: "☁️" },
  { id: "rainy", label: "비", icon: "🌧️" },
  { id: "snowy", label: "눈", icon: "❄️" },
  { id: "windy", label: "바람", icon: "🌬️" },
]

const moods = [
  { id: "happy", label: "행복", icon: "😊", color: "#F4C97A" },
  { id: "calm", label: "평온", icon: "😌", color: "#A8BBA5" },
  { id: "sad", label: "슬픔", icon: "😢", color: "#A8C4D4" },
  { id: "angry", label: "화남", icon: "😤", color: "#F2A8A8" },
  { id: "tired", label: "피곤", icon: "😪", color: "#C4B8C4" },
  { id: "excited", label: "설렘", icon: "🥰", color: "#F2C4A8" },
]

function getTodayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function isValidDateString(value: string | null): value is string {
  if (!value) return false
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function formatKoreanDate(dateString: string) {
  const [, month, day] = dateString.split("-")
  return `${Number(month)}월 ${Number(day)}일 일기`
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

export default function DiaryScreen({
  onNavigate,
  initialQuestion,
  initialQuestionDate,
}: DiaryScreenProps) {
  const searchParams = useSearchParams()

const selectedDate = useMemo<string>(() => {
  const dateParam = searchParams.get("date")
  return isValidDateString(dateParam) ? dateParam : getTodayDateString()
}, [searchParams])

  const isToday = selectedDate === getTodayDateString()

  const [isEdit, setIsEdit] = useState(false)
  const [canEdit, setCanEdit] = useState(true)

  const [activeTab, setActiveTab] = useState<"question" | "free">("question")
  const [text, setText] = useState("")
  const [selectedWeather, setSelectedWeather] = useState("sunny")
  const [selectedMood, setSelectedMood] = useState("calm")

  const [question, setQuestion] = useState(
    "오늘의 질문을 준비하고 있어요..."
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const now = new Date()
    setCanEdit(isToday ? now.getHours() < 23 : true)
  }, [isToday])

  useEffect(() => {
    async function fetchDiary() {
      try {
        setError(null)

        if (!isToday) {
          setIsEdit(false)
          setText("")
          setSelectedWeather("sunny")
          setSelectedMood("calm")
          return
        }

        const data = (await apiClient.getTodayDiary()) as {
          content?: string
          weather?: string
          mood_tags?: string[]
        }

        setText(data.content || "")
        setSelectedWeather(data.weather || "sunny")
        setSelectedMood(data.mood_tags?.[0] || "calm")
        setIsEdit(true)
      } catch (e: any) {
        const message = e?.message || ""

        if (
          message.includes("오늘 일기가 없습니다") ||
          message.includes("HTTP 404")
        ) {
          setIsEdit(false)
          setText("")
          setSelectedWeather("sunny")
          setSelectedMood("calm")
          return
        }

        setError(message || "일기를 불러오지 못했어요.")
      }
    }

    fetchDiary()
  }, [isToday, selectedDate])

  // ✅ 룰베이스 질문 적용
  useEffect(() => {
    if (activeTab !== "question") return

    if (
      initialQuestion &&
      (!initialQuestionDate ||
        initialQuestionDate === selectedDate)
    ) {
      setQuestion(initialQuestion)
      return
    }

    const dailyQuestion = getDailyQuestion({
      userKey: getQuestionUserKey(),
      date: dateStringToLocalDate(selectedDate),
    })

    setQuestion(dailyQuestion)
  }, [
    activeTab,
    initialQuestion,
    initialQuestionDate,
    selectedDate,
  ])

  async function handleSaveDiary() {
    setLoading(true)
    setError(null)

    try {
      let saved: DiarySaveResponse

      if (isEdit && isToday) {
        saved = (await apiClient.updateTodayDiary({
          content: text,
          weather: selectedWeather,
          mood_tags: [selectedMood],
        })) as DiarySaveResponse
      } else {
        saved = (await apiClient.createDiary({
          entry_date: selectedDate,
          content: text,
          weather: selectedWeather,
          mood_tags: [selectedMood],
        } as any)) as DiarySaveResponse
      }

      const entryDate: string = saved?.entry_date || selectedDate

      const monthKey = getDiaryMonthKeyFromDate(entryDate)
      invalidateDiaryMonth(monthKey)

      onNavigate("calendar")
    } catch (e: any) {
      setError(e?.message || (isEdit ? "수정 실패" : "저장 실패"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "#F8F6F2" }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0">
        <button
          onClick={() => onNavigate("calendar")}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{
            background: "#FFFCF8",
            border: "1.5px solid #E5DDD5",
          }}
          type="button"
        >
          ←
        </button>

        <h2
          className="text-base font-extrabold"
          style={{ color: "#3D3530" }}
        >
          {isToday
            ? "오늘 일기"
            : formatKoreanDate(selectedDate)}
        </h2>

        <div className="w-9" />
      </div>

      {/* 날짜 표시 */}
      {!isToday && (
        <div className="px-5 mb-4">
          <div
            className="rounded-2xl px-4 py-3 text-sm font-bold"
            style={{
              background: "#FFFCF8",
              color: "#8A7E76",
              border: "1.5px solid #E5DDD5",
            }}
          >
            선택한 날짜: {selectedDate}
          </div>
        </div>
      )}

      {/* 탭 */}
      <div className="px-5 mb-4">
        <div
          className="flex rounded-2xl p-1"
          style={{ background: "#EDE8E0" }}
        >
          {(["question", "free"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background:
                  activeTab === tab
                    ? "#FFFCF8"
                    : "transparent",
                color:
                  activeTab === tab
                    ? "#C9856A"
                    : "#9A8F87",
                boxShadow:
                  activeTab === tab
                    ? "0 2px 6px rgba(0,0,0,0.06)"
                    : "none",
              }}
              type="button"
            >
              {tab === "question"
                ? "질문형"
                : "자유형"}
            </button>
          ))}
        </div>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-28">

        {/* 질문 */}
        {activeTab === "question" && (
          <div className="space-y-2">
            <div className="flex items-end gap-3">
              <div
                className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
                style={{
                  boxShadow:
                    "0 2px 8px rgba(201,133,106,0.15)",
                }}
              >
                <Image
                  src="/images/haedori-character.png"
                  alt="해도리"
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              </div>

              <div
                className="relative flex-1 px-4 py-3 rounded-2xl rounded-bl-sm"
                style={{
                  background: "#FFFCF8",
                  border: "1.5px solid #E5DDD5",
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <p
                  className="text-sm font-bold leading-relaxed"
                  style={{ color: "#3D3530" }}
                >
                  {question}
                </p>

                <div
                  className="absolute left-0 bottom-3 w-0 h-0"
                  style={{
                    borderTop: "6px solid transparent",
                    borderBottom:
                      "6px solid transparent",
                    borderRight:
                      "8px solid #FFFCF8",
                    marginLeft: "-8px",
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{
                  background: "#FFFCF8",
                  border: "1.5px solid #E5DDD5",
                  color: "#9A8F87",
                }}
              >
                오늘의 질문
              </span>
            </div>
          </div>
        )}

        {/* 텍스트 입력 */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "#FFFCF8",
            border: "1.5px solid #E5DDD5",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              activeTab === "question"
                ? "여기에 솔직하게 적어봐요..."
                : "오늘 하루를 자유롭게 기록해요..."
            }
            className="w-full h-44 px-5 pt-4 text-sm leading-relaxed resize-none outline-none"
            style={{
              background: "transparent",
              color: "#3D3530",
              fontFamily: "inherit",
            }}
          />

          <div className="px-5 pb-3 flex justify-end">
            <span
              className="text-xs"
              style={{ color: "#C4B8B0" }}
            >
              {text.length}자
            </span>
          </div>
        </div>

        {/* 날씨 */}
        <div>
          <p
            className="text-xs font-bold mb-2.5"
            style={{ color: "#9A8F87" }}
          >
            오늘 날씨
          </p>

          <div className="flex gap-2">
            {weathers.map((w) => (
              <button
                key={w.id}
                onClick={() =>
                  setSelectedWeather(w.id)
                }
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all active:scale-95"
                style={{
                  background:
                    selectedWeather === w.id
                      ? "#FFFCF8"
                      : "transparent",
                  border:
                    selectedWeather === w.id
                      ? "1.5px solid #C9856A"
                      : "1.5px solid #E5DDD5",
                }}
                type="button"
              >
                <span className="text-xl">
                  {w.icon}
                </span>

                <span
                  className="text-xs font-semibold"
                  style={{
                    color:
                      selectedWeather === w.id
                        ? "#C9856A"
                        : "#9A8F87",
                  }}
                >
                  {w.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 기분 */}
        <div>
          <p
            className="text-xs font-bold mb-2.5"
            style={{ color: "#9A8F87" }}
          >
            오늘 기분
          </p>

          <div className="grid grid-cols-6 gap-1.5">
            {moods.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMood(m.id)}
                className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all active:scale-95"
                style={{
                  background:
                    selectedMood === m.id
                      ? `${m.color}30`
                      : "#FFFCF8",
                  border:
                    selectedMood === m.id
                      ? `1.5px solid ${m.color}`
                      : "1.5px solid #E5DDD5",
                }}
                type="button"
              >
                <span className="text-xl">
                  {m.icon}
                </span>

                <span
                  className="text-xs font-semibold"
                  style={{
                    color:
                      selectedMood === m.id
                        ? "#3D3530"
                        : "#9A8F87",
                    fontSize: "10px",
                  }}
                >
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm px-5 pb-8 pt-4"
        style={{
          background:
            "linear-gradient(to top, #F8F6F2 80%, transparent)",
        }}
      >
        {error && (
          <div className="text-red-500 text-sm mb-2">
            {error}
          </div>
        )}

        <button
          className="w-full py-4 rounded-2xl font-extrabold text-base transition-all active:scale-95"
          style={{
            background: "#C9856A",
            color: "#FFFCF8",
            boxShadow:
              "0 4px 16px rgba(201,133,106,0.35)",
            opacity:
              loading || !text.trim()
                ? 0.6
                : 1,
          }}
          onClick={handleSaveDiary}
          disabled={loading || !text.trim()}
          type="button"
        >
          {loading
            ? "저장 중..."
            : isEdit
              ? "일기 수정하기"
              : "일기 저장하기"}
        </button>
      </div>
    </div>
  )
}