"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  apiClient,
  type MonthlyReportResponse,
  type MonthlySummaryResponse,
  type WeeklyReportResponse,
} from "@/lib/api"

type ReportTab = "emotion" | "weekly" | "monthly"

const WEEKDAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"]

const EMPTY_CELL = "#EDE8E0"

function getKstToday() {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth() + 1,
  }
}

function formatRange(start: string, end: string) {
  const s = start.split("-")
  const e = end.split("-")
  return `${Number(s[1])}.${Number(s[2])} ~ ${Number(e[1])}.${Number(e[2])}`
}

export default function EmotionReportPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ReportTab>("emotion")

  const today = getKstToday()
  const [year, setYear] = useState(today.year)
  const [month, setMonth] = useState(today.month)

  const [monthly, setMonthly] = useState<MonthlyReportResponse | null>(null)
  const [monthlyLoading, setMonthlyLoading] = useState(true)
  const [monthlyError, setMonthlyError] = useState(false)

  const [weekOffset, setWeekOffset] = useState(0)
  const [weekly, setWeekly] = useState<WeeklyReportResponse | null>(null)
  const [weeklyLoading, setWeeklyLoading] = useState(false)
  const [weeklyError, setWeeklyError] = useState(false)

  const [summary, setSummary] = useState<MonthlySummaryResponse | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState(false)

  const loadMonthly = useCallback(async (y: number, m: number) => {
    setMonthlyLoading(true)
    setMonthlyError(false)

    try {
      const data = await apiClient.getMonthlyReport(y, m)
      setMonthly(data)
    } catch {
      setMonthlyError(true)
    } finally {
      setMonthlyLoading(false)
    }
  }, [])

  const loadWeekly = useCallback(async (offset: number) => {
    setWeeklyLoading(true)
    setWeeklyError(false)

    try {
      const data = await apiClient.getWeeklyReport(offset)
      setWeekly(data)
    } catch {
      setWeeklyError(true)
    } finally {
      setWeeklyLoading(false)
    }
  }, [])

  const loadSummary = useCallback(async (y: number, m: number) => {
    setSummaryLoading(true)
    setSummaryError(false)

    try {
      const data = await apiClient.getMonthlySummary(y, m)
      setSummary(data)
    } catch {
      setSummaryError(true)
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMonthly(year, month)
  }, [year, month, loadMonthly])

  useEffect(() => {
    if (activeTab === "weekly" && !weekly && !weeklyLoading) {
      loadWeekly(weekOffset)
    }
  }, [activeTab, weekly, weeklyLoading, weekOffset, loadWeekly])

  useEffect(() => {
    if (
      (activeTab === "monthly" || activeTab === "emotion") &&
      !summary &&
      !summaryLoading &&
      !summaryError
    ) {
      loadSummary(year, month)
    }
  }, [
    activeTab,
    summary,
    summaryLoading,
    summaryError,
    year,
    month,
    loadSummary,
  ])

  const goPrevMonth = () => {
    if (!monthly?.prev_month) return
    const [y, m] = monthly.prev_month.split("-")
    setYear(Number(y))
    setMonth(Number(m))
    setSummary(null)
    setSummaryError(false)
  }

  const goNextMonth = () => {
    if (!monthly?.next_month) return
    const [y, m] = monthly.next_month.split("-")
    setYear(Number(y))
    setMonth(Number(m))
    setSummary(null)
    setSummaryError(false)
  }

  const goPrevWeek = () => {
    const next = weekOffset - 1
    setWeekOffset(next)
    loadWeekly(next)
  }

  const goNextWeek = () => {
    const next = weekOffset + 1
    setWeekOffset(next)
    loadWeekly(next)
  }

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
            data={monthly}
            summary={summary}
            summaryLoading={summaryLoading}
            loading={monthlyLoading}
            error={monthlyError}
            onPrev={goPrevMonth}
            onNext={goNextMonth}
            onRetry={() => loadMonthly(year, month)}
          />
        )}

        {activeTab === "weekly" && (
          <WeeklyReportContent
            data={weekly}
            loading={weeklyLoading}
            error={weeklyError}
            onPrev={goPrevWeek}
            onNext={goNextWeek}
            onRetry={() => loadWeekly(weekOffset)}
          />
        )}

        {activeTab === "monthly" && (
          <MonthlyReportContent
            data={summary}
            loading={summaryLoading}
            error={summaryError}
            year={year}
            month={month}
            onRetry={() => loadSummary(year, month)}
          />
        )}
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

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[28px] p-5"
      style={{
        background: "#FFFCF8",
        border: "1.5px solid #E5DDD5",
        boxShadow: "0 8px 24px rgba(61,53,48,0.06)",
      }}
    >
      {children}
    </div>
  )
}

function LoadingCard({ text }: { text: string }) {
  return (
    <CardShell>
      <p className="text-sm text-center py-8" style={{ color: "#9A8F87" }}>
        {text}
      </p>
    </CardShell>
  )
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <CardShell>
      <p className="text-sm text-center mb-4" style={{ color: "#9A8F87" }}>
        불러오지 못했어요.
      </p>
      <button
        onClick={onRetry}
        type="button"
        className="w-full py-3 rounded-2xl text-sm font-extrabold active:scale-95 transition-all"
        style={{ background: "#F8EFE7", color: "#C9856A" }}
      >
        다시 시도
      </button>
    </CardShell>
  )
}

function NavArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next"
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      aria-label={direction === "prev" ? "이전" : "다음"}
      className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-95"
      style={{ opacity: disabled ? 0.25 : 1 }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9A8F87"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={direction === "prev" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
      </svg>
    </button>
  )
}

function HaedoriLetter({
  title,
  paragraphs,
}: {
  title: string
  paragraphs: string[]
}) {
  return (
    <CardShell>
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: "#F8EFE7" }}
        >
          🦦
        </div>
        <h2 className="text-base font-extrabold">{title}</h2>
      </div>

      <div className="flex flex-col gap-4">
        {paragraphs.map((text, i) => (
          <p
            key={i}
            className="text-sm leading-[1.9]"
            style={{ color: "#6B625C" }}
          >
            {text}
          </p>
        ))}
      </div>
    </CardShell>
  )
}

function EmotionReportContent({
  data,
  summary,
  summaryLoading,
  loading,
  error,
  onPrev,
  onNext,
  onRetry,
}: {
  data: MonthlyReportResponse | null
  summary: MonthlySummaryResponse | null
  summaryLoading: boolean
  loading: boolean
  error: boolean
  onPrev: () => void
  onNext: () => void
  onRetry: () => void
}) {
  if (error) return <ErrorCard onRetry={onRetry} />
  if (loading && !data) return <LoadingCard text="감정 기록을 불러오는 중..." />
  if (!data) return null

  const firstWeekday = data.days.length > 0 ? (data.days[0].weekday + 1) % 7 : 0
  const maxCount = data.mood_counts.length > 0 ? data.mood_counts[0].count : 1

  return (
    <div className="flex flex-col gap-5">
      <CardShell>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-extrabold">감정 흐름</h2>

          <div className="flex items-center gap-2">
            <NavArrow direction="prev" disabled={!data.prev_month} onClick={onPrev} />
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: "#F8EFE7", color: "#C9856A" }}
            >
              {data.year}년 {data.month}월
            </span>
            <NavArrow direction="next" disabled={!data.next_month} onClick={onNext} />
          </div>
        </div>

        <p className="text-xs mb-4" style={{ color: "#9A8F87" }}>
          기록한 날만 색으로 표시돼요
        </p>

        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEKDAY_HEADERS.map((w) => (
            <span
              key={w}
              className="text-[10px] font-bold text-center"
              style={{ color: "#9A8F87" }}
            >
              {w}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}

          {data.days.map((d) => (
            <div
              key={d.date}
              className="aspect-square rounded-lg flex items-center justify-center"
              style={{ background: d.color || EMPTY_CELL }}
              title={d.label ? `${d.day}일 · ${d.label}` : `${d.day}일`}
            >
              <span
                className="text-[9px] font-bold"
                style={{ color: d.color ? "#3D3530" : "#BCB3AA" }}
              >
                {d.day}
              </span>
            </div>
          ))}
        </div>

        {data.recorded_days === 0 && (
          <p className="text-sm text-center mt-5" style={{ color: "#9A8F87" }}>
            이 달엔 기록이 없어요.
          </p>
        )}
      </CardShell>

      {data.mood_counts.length > 0 && (
        <CardShell>
          <h2 className="text-base font-extrabold mb-4">감정별 일수</h2>

          <div className="flex flex-col gap-2.5">
            {data.mood_counts.map((m) => (
              <div key={m.mood} className="flex items-center gap-2.5">
                <span
                  className="text-xs font-bold w-8 flex-shrink-0"
                  style={{ color: "#6B625C" }}
                >
                  {m.label}
                </span>

                <div
                  className="flex-1 h-4 rounded-md overflow-hidden"
                  style={{ background: "#F1EFE8" }}
                >
                  <div
                    className="h-full rounded-md transition-all"
                    style={{
                      width: `${Math.max(8, (m.count / maxCount) * 100)}%`,
                      background: m.color,
                    }}
                  />
                </div>

                <span
                  className="text-xs font-extrabold w-7 text-right flex-shrink-0"
                  style={{ color: "#3D3530" }}
                >
                  {m.count}일
                </span>
              </div>
            ))}
          </div>
        </CardShell>
      )}

      {summaryLoading && !summary && data.recorded_days > 0 && (
        <LoadingCard text="해도리가 편지를 쓰는 중..." />
      )}

      {summary && summary.insights.length > 0 && (
        <HaedoriLetter title="해도리가 본 이번 달" paragraphs={summary.insights} />
      )}
    </div>
  )
}

function WeeklyReportContent({
  data,
  loading,
  error,
  onPrev,
  onNext,
  onRetry,
}: {
  data: WeeklyReportResponse | null
  loading: boolean
  error: boolean
  onPrev: () => void
  onNext: () => void
  onRetry: () => void
}) {
  if (error) return <ErrorCard onRetry={onRetry} />
  if (loading && !data) return <LoadingCard text="이번 주 기록을 불러오는 중..." />
  if (!data) return null

  return (
    <div className="flex flex-col gap-5">
      <CardShell>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold">주간 흐름</h2>

          <div className="flex items-center gap-2">
            <NavArrow direction="prev" disabled={!data.has_prev} onClick={onPrev} />
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: "#F8EFE7", color: "#C9856A" }}
            >
              {formatRange(data.start_date, data.end_date)}
            </span>
            <NavArrow direction="next" disabled={!data.has_next} onClick={onNext} />
          </div>
        </div>

        <div className="flex gap-1.5 mb-5">
          {data.days.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full aspect-square rounded-xl"
                style={{ background: d.color || EMPTY_CELL }}
                title={d.label ? `${d.weekday_label} · ${d.label}` : d.weekday_label}
              />
              <span className="text-[10px] font-bold" style={{ color: "#9A8F87" }}>
                {d.weekday_label}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {data.highlights.map((text, i) => (
            <ReportCardNumber key={i} number={String(i + 1)} text={text} />
          ))}
        </div>
      </CardShell>

      <HaedoriLetter title="해도리가 본 이번 주" paragraphs={[data.comment]} />
    </div>
  )
}

function MonthlyReportContent({
  data,
  loading,
  error,
  year,
  month,
  onRetry,
}: {
  data: MonthlySummaryResponse | null
  loading: boolean
  error: boolean
  year: number
  month: number
  onRetry: () => void
}) {
  if (error) return <ErrorCard onRetry={onRetry} />
  if (loading && !data)
    return <LoadingCard text="해도리가 이번 달을 정리하는 중..." />
  if (!data) return null

  return (
    <div className="flex flex-col gap-5">
      <CardShell>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold">월별 리포트</h2>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: "#F8EFE7", color: "#C9856A" }}
          >
            {year}년 {month}월
          </span>
        </div>

        <p className="text-sm leading-[1.9] mb-5" style={{ color: "#6B625C" }}>
          {data.summary}
        </p>

        <div className="space-y-3">
          {data.highlights.map((text, i) => (
            <ReportCardNumber key={i} number={String(i + 1)} text={text} />
          ))}
        </div>
      </CardShell>

      <HaedoriLetter title="해도리의 편지" paragraphs={[data.comment]} />
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