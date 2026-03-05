"use client"

import { useState, useEffect } from "react"

import Image from "next/image"

interface DiaryScreenProps {
  onNavigate: (screen: string) => void
}

const questions = [
  "오늘 나를 가장 오래 붙잡은 생각은?",
  "오늘 가장 기억에 남는 순간은?",
  "오늘 나에게 가장 친절했던 것은?",
  "오늘 내가 느낀 감정 중 낯선 것이 있었나요?",
]

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

export default function DiaryScreen({ onNavigate }: DiaryScreenProps) {
    const [isEdit, setIsEdit] = useState(false)
    // 오늘 일기 불러오기
    useEffect(() => {
      async function fetchTodayDiary() {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/diary/today`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            credentials: "include"
          })
          if (res.ok) {
            const data = await res.json()
            setText(data.content || "")
            setSelectedMood(data.mood_tags?.[0] || "calm")
            setIsEdit(true)
          }
        } catch {}
      }
      fetchTodayDiary()
    }, [])
  const [activeTab, setActiveTab] = useState<"question" | "free">("question")
  const [text, setText] = useState("")
  const [selectedWeather, setSelectedWeather] = useState("sunny")
  const [selectedMood, setSelectedMood] = useState("calm")
  const [questionIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)

  async function handleSaveDiary() {
    setLoading(true)
    setError(null)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
      const method = isEdit ? "PUT" : "POST"
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/diary/today`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: text,
          mood_tags: [selectedMood],
        }),
        credentials: "include"
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || (isEdit ? "수정 실패" : "저장 실패"))
      }
      onNavigate("calendar")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#F8F6F2" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
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
        <h2 className="text-base font-extrabold" style={{ color: "#3D3530" }}>
          오늘 일기
        </h2>
        <div className="w-9" />
      </div>

      {/* Toggle Tabs */}
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
                background: activeTab === tab ? "#FFFCF8" : "transparent",
                color: activeTab === tab ? "#C9856A" : "#9A8F87",
                boxShadow: activeTab === tab ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {tab === "question" ? "질문형" : "자유형"}
            </button>
          ))}
        </div>
      </div>

      {/* Content area - scrollable */}
      <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-28">
        {/* Otter speech bubble (question mode) */}
        {activeTab === "question" && (
          <div className="flex items-end gap-3">
            <div
              className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
              style={{ boxShadow: "0 2px 8px rgba(201,133,106,0.15)" }}
            >
              <Image
                src="/images/haedori-character.jpg"
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
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <p className="text-sm font-bold leading-relaxed" style={{ color: "#3D3530" }}>
                {questions[questionIdx]}
              </p>
              {/* Tail */}
              <div
                className="absolute left-0 bottom-3 w-0 h-0"
                style={{
                  borderTop: "6px solid transparent",
                  borderBottom: "6px solid transparent",
                  borderRight: "8px solid #FFFCF8",
                  marginLeft: "-8px",
                }}
              />
            </div>
          </div>
        )}

        {/* Text Input */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "#FFFCF8",
            border: "1.5px solid #E5DDD5",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
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
            <span className="text-xs" style={{ color: "#C4B8B0" }}>
              {text.length}자
            </span>
          </div>
        </div>

        {/* Weather Selector */}
        <div>
          <p className="text-xs font-bold mb-2.5" style={{ color: "#9A8F87" }}>
            오늘 날씨
          </p>
          <div className="flex gap-2">
            {weathers.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWeather(w.id)}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all active:scale-95"
                style={{
                  background: selectedWeather === w.id ? "#FFFCF8" : "transparent",
                  border: selectedWeather === w.id ? "1.5px solid #C9856A" : "1.5px solid #E5DDD5",
                  boxShadow: selectedWeather === w.id ? "0 2px 6px rgba(201,133,106,0.15)" : "none",
                }}
                aria-label={w.label}
                aria-pressed={selectedWeather === w.id}
              >
                <span className="text-xl">{w.icon}</span>
                <span className="text-xs font-semibold" style={{ color: selectedWeather === w.id ? "#C9856A" : "#9A8F87" }}>
                  {w.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Mood Selector */}
        <div>
          <p className="text-xs font-bold mb-2.5" style={{ color: "#9A8F87" }}>
            오늘 기분
          </p>
          <div className="grid grid-cols-6 gap-1.5">
            {moods.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMood(m.id)}
                className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all active:scale-95"
                style={{
                  background: selectedMood === m.id ? m.color + "30" : "#FFFCF8",
                  border: selectedMood === m.id ? `1.5px solid ${m.color}` : "1.5px solid #E5DDD5",
                }}
                aria-label={m.label}
                aria-pressed={selectedMood === m.id}
              >
                <span className="text-xl">{m.icon}</span>
                <span className="text-xs font-semibold" style={{ color: selectedMood === m.id ? "#3D3530" : "#9A8F87", fontSize: "10px" }}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm px-5 pb-8 pt-4"
        style={{ background: "linear-gradient(to top, #F8F6F2 80%, transparent)" }}
      >
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <button
          className="w-full py-4 rounded-2xl font-extrabold text-base transition-all active:scale-95"
          style={{
            background: "#C9856A",
            color: "#FFFCF8",
            boxShadow: "0 4px 16px rgba(201,133,106,0.35)",
          }}
          onClick={handleSaveDiary}
          disabled={loading || isEdit || !text.trim()}
        >
          {isEdit
            ? "오늘 일기 쓰기 완료"
            : loading
              ? "저장 중..."
              : "오늘을 남기기"}
        </button>
      </div>
    </div>
  )
}
