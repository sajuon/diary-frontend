"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type ReportTab = "emotion" | "weekly" | "monthly"

type EmotionDay = {
  day: number
  mood: string
  label: string
  value: number
}

const moodColors: Record<string, string> = {
  기쁨: "#F4C97A",
  평온: "#A8BBA5",
  슬픔: "#A8C4D4",
  피곤: "#C4B8C4",
  불안: "#E7B7A0",
  화남: "#F2A8A8",
}

const sampleEmotionDays: EmotionDay[] = [
  { day: 1, mood: "평온", label: "차분", value: 52 },
  { day: 2, mood: "기쁨", label: "좋음", value: 76 },
  { day: 3, mood: "피곤", label: "지침", value: 38 },
  { day: 4, mood: "불안", label: "걱정", value: 45 },
  { day: 5, mood: "평온", label: "안정", value: 58 },
  { day: 6, mood: "기쁨", label: "설렘", value: 82 },
  { day: 7, mood: "슬픔", label: "우울", value: 30 },
  { day: 8, mood: "평온", label: "괜찮음", value: 55 },
  { day: 9, mood: "피곤", label: "무기력", value: 34 },
  { day: 10, mood: "기쁨", label: "만족", value: 74 },
  { day: 11, mood: "불안", label: "복잡", value: 42 },
  { day: 12, mood: "평온", label: "차분", value: 60 },
  { day: 13, mood: "화남", label: "예민", value: 28 },
  { day: 14, mood: "기쁨", label: "즐거움", value: 80 },
  { day: 15, mood: "평온", label: "안정", value: 63 },
]

export default function EmotionReportPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ReportTab>("emotion")

  const moodSummary = useMemo(() => {
    const counts: Record<string, number> = {}

    sampleEmotionDays.forEach((item) => {
      counts[item.mood] = (counts[item.mood] || 0) + 1
    })

    return Object.entries(counts)
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count)
  }, [])

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: "#F8F6F2", color: "#3D3530" }}
    >
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-all"
            style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
            type="button"
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
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <h1 className="text-lg font-extrabold">감정 리포트</h1>

          <div className="w-9" />
        </div>

        <div
          className="rounded-[28px] p-5 mb-5"
          style={{
            background: "#FFFCF8",
            border: "1.5px solid #E5DDD5",
            boxShadow: "0 8px 24px rgba(61,53,48,0.06)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: "#F8EFE7" }}
            >
              🦦
            </div>

            <div>
              <p className="text-sm font-bold mb-1" style={{ color: "#C9856A" }}>
                해도리의 한마디
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#6B625C" }}>
                이번 달은 평온한 감정이 가장 자주 보였어요. 중간중간 피곤함과
                불안이 올라왔지만, 다시 안정되는 흐름도 함께 보여요.
              </p>
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-3 gap-1.5 rounded-2xl p-1.5 mb-5"
          style={{ background: "#EDE8E0" }}
        >
          <ReportTabButton
            label="감정"
            active={activeTab === "emotion"}
            onClick={() => setActiveTab("emotion")}
          />
          <ReportTabButton
            label="주간"
            active={activeTab === "weekly"}
            onClick={() => setActiveTab("weekly")}
          />
          <ReportTabButton
            label="월별"
            active={activeTab === "monthly"}
            onClick={() => setActiveTab("monthly")}
          />
        </div>

        {activeTab === "emotion" && (
          <EmotionReportContent
            moodSummary={moodSummary}
            emotionDays={sampleEmotionDays}
          />
        )}

        {activeTab === "weekly" && <WeeklyReportContent />}

        {activeTab === "monthly" && <MonthlyReportContent />}
      </div>
    </div>
  )
}

function ReportTabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="py-2.5 rounded-xl text-sm font-extrabold transition-all active:scale-95"
      style={{
        background: active ? "#FFFCF8" : "transparent",
        color: active ? "#C9856A" : "#9A8F87",
        boxShadow: active ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
      }}
      type="button"
    >
      {label}
    </button>
  )
}

function EmotionReportContent({
  moodSummary,
  emotionDays,
}: {
  moodSummary: { mood: string; count: number }[]
  emotionDays: EmotionDay[]
}) {
  return (
    <div className="flex flex-col gap-5">
      <section
        className="rounded-[28px] p-5"
        style={{
          background: "#FFFCF8",
          border: "1.5px solid #E5DDD5",
          boxShadow: "0 8px 24px rgba(61,53,48,0.06)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-extrabold">이번 달 감정 흐름</h2>
            <p className="text-xs mt-1" style={{ color: "#9A8F87" }}>
              날짜별 감정 점수 예시 그래프
            </p>
          </div>

          <span
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: "#F8EFE7", color: "#C9856A" }}
          >
            5월
          </span>
        </div>

        <div className="h-52 flex items-end gap-2 overflow-x-auto pb-2">
          {emotionDays.map((item) => (
            <div
              key={item.day}
              className="flex flex-col items-center justify-end min-w-[34px]"
            >
              <div
                className="w-full rounded-t-xl transition-all"
                style={{
                  height: `${item.value * 1.55}px`,
                  background: moodColors[item.mood] || "#A8BBA5",
                }}
              />
              <span
                className="text-[10px] font-bold mt-2"
                style={{ color: "#9A8F87" }}
              >
                {item.day}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {moodSummary.slice(0, 6).map((item) => (
            <div
              key={item.mood}
              className="rounded-2xl px-3 py-3"
              style={{ background: "#F8F6F2" }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: moodColors[item.mood] }}
                />
                <span className="text-xs font-bold">{item.mood}</span>
              </div>
              <p className="text-xs" style={{ color: "#9A8F87" }}>
                {item.count}일
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="rounded-[28px] p-5"
        style={{
          background: "#FFFCF8",
          border: "1.5px solid #E5DDD5",
        }}
      >
        <h2 className="text-base font-extrabold mb-3">감정 요약</h2>

        <div className="space-y-3">
          <SummaryRow title="가장 자주 느낀 감정" content="평온" />
          <SummaryRow title="가장 높았던 감정" content="기쁨 · 6일, 14일" />
          <SummaryRow title="주의 깊게 볼 감정" content="피곤 · 불안" />
        </div>
      </section>
    </div>
  )
}

function WeeklyReportContent() {
  return (
    <div
      className="rounded-[28px] p-5"
      style={{
        background: "#FFFCF8",
        border: "1.5px solid #E5DDD5",
        boxShadow: "0 8px 24px rgba(61,53,48,0.06)",
      }}
    >
      <h2 className="text-base font-extrabold mb-2">이번 주 리포트</h2>
      <p className="text-sm leading-relaxed mb-5" style={{ color: "#6B625C" }}>
        이번 주에는 감정이 초반에 조금 내려갔다가 후반으로 갈수록 안정되는
        흐름을 보였어요.
      </p>

      <div className="space-y-3 mb-5">
        <ReportCardNumber number="1" text="가장 기억에 남는 일기 주제: 공부와 계획" />
        <ReportCardNumber number="2" text="가장 자주 나온 감정: 평온" />
        <ReportCardNumber number="3" text="감정 변화 포인트: 피곤함에서 안정감으로 회복" />
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ background: "#F8EFE7", color: "#6B625C" }}
      >
        <p className="text-sm leading-relaxed">
          해도리가 보기엔 이번 주의 너는 조금 지쳐 있었지만, 스스로 다시
          균형을 찾으려는 힘이 있었어. 다음 주에는 해야 할 일을 줄이기보다
          회복 시간을 먼저 확보해보면 좋아.
        </p>
      </div>
    </div>
  )
}

function MonthlyReportContent() {
  return (
    <div
      className="rounded-[28px] p-5"
      style={{
        background: "#FFFCF8",
        border: "1.5px solid #E5DDD5",
        boxShadow: "0 8px 24px rgba(61,53,48,0.06)",
      }}
    >
      <h2 className="text-base font-extrabold mb-2">이번 달 리포트</h2>
      <p className="text-sm leading-relaxed mb-5" style={{ color: "#6B625C" }}>
        이번 달은 전체적으로 평온함이 중심이었고, 특정 시점에 피곤함과 불안이
        올라오는 패턴이 보였어요.
      </p>

      <div className="space-y-3 mb-5">
        <ReportCardNumber number="1" text="대표 사건: 새로운 목표를 세운 날" />
        <ReportCardNumber number="2" text="대표 사건: 컨디션이 크게 떨어진 날" />
        <ReportCardNumber number="3" text="대표 사건: 만족감이 크게 올라온 날" />
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ background: "#F8EFE7", color: "#6B625C" }}
      >
        <p className="text-sm leading-relaxed">
          해도리가 보기엔 이번 달의 가장 큰 흐름은 “다시 나를 정돈하는 과정”에
          가까워. 감정이 흔들린 날도 있었지만, 결국 다시 평온으로 돌아오는 힘이
          있었어. 다음 달에는 피곤함이 반복되는 시점을 조금 더 자세히 기록해보면
          좋아.
        </p>
      </div>
    </div>
  )
}

function SummaryRow({ title, content }: { title: string; content: string }) {
  return (
    <div
      className="flex items-center justify-between rounded-2xl px-4 py-3"
      style={{ background: "#F8F6F2" }}
    >
      <span className="text-sm font-bold" style={{ color: "#6B625C" }}>
        {title}
      </span>
      <span className="text-sm font-extrabold" style={{ color: "#C9856A" }}>
        {content}
      </span>
    </div>
  )
}

function ReportCardNumber({ number, text }: { number: string; text: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{ background: "#F8F6F2" }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0"
        style={{ background: "#C9856A", color: "#FFFCF8" }}
      >
        {number}
      </div>
      <p className="text-sm font-bold" style={{ color: "#6B625C" }}>
        {text}
      </p>
    </div>
  )
}