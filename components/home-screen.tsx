// 기존 파일 경로: /home/dori/diary-frontend/components/home-screen.tsx
// 수정 파일 경로: /home/dori/diary-frontend/components/home-screen.tsx
// 역할: 홈 화면 UI. 오늘의 운세/연애운/재물운/학업운 카드별로 다른 type을 전달해 상세 사주 해석을 불러온다.

"use client"

import { useEffect, useMemo, useState } from "react"
import { getDailyQuestion } from "@/lib/daily-questions"
import { getQuestionUserKeyFromDashboard } from "@/lib/question-user-key"
import { useUserPearls } from "../hooks/use-user-pearls"
import { FortuneIcon, type FortuneType } from "@/components/fortune-icon"

interface HomeScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
  dashboardData?: any
  todayFortune?: {
    love?: string
    study?: string
    caution?: string
    good_thing?: string
    ritual?: string
    element_hint?: Record<string, unknown> | null
    model?: string | null
  } | null
  purchases?: any[]
  onOpenTodayFlow?: () => Promise<boolean>
  isTodayFortuneLoading?: boolean
  profile?: {
    birth_date?: string
    birth_time?: string
  } | null
}

type NotificationItem = {
  id: string
  text: string
  sub: string
  unread: boolean
  screen: string
  params?: Record<string, unknown>
}

type ManseData = {
  pillars?: Array<{
    label: string
    stem: string
    branch: string
    element?: string
    tenGod?: string
    ganji?: string
    stem_element?: Record<string, unknown> | null
    branch_element?: Record<string, unknown> | null
    hidden_stems?: string[]
  }>
  elementSummary?: Record<string, unknown>
  analysis?: string
  analysis_date?: string
  model?: string | null
  chart_provided?: boolean
  fortune_type?: FortuneType
}

function formatLetterDate(dateString?: string) {
  if (!dateString) return ""

  const date = new Date(dateString)
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

function getTodayKey() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")

  return `${y}-${m}-${d}`
}

export default function HomeScreen({
  onNavigate,
  dashboardData,
  todayFortune,
  onOpenTodayFlow,
  isTodayFortuneLoading = false,
  profile = null,
}: HomeScreenProps) {
  const today = new Date()
  const todayKey = getTodayKey()

  const dateStr = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })

  const questionUserKey = useMemo(
    () => getQuestionUserKeyFromDashboard(dashboardData),
    [dashboardData]
  )

  const todayQuestion = useMemo(() => {
    return getDailyQuestion({
      userKey: String(questionUserKey),
      date: today,
    })
  }, [questionUserKey, todayKey])

  const diaryParams = useMemo(
    () => ({
      initialQuestion: todayQuestion,
      initialQuestionDate: todayKey,
      initialQuestionSource: "rule_365",
    }),
    [todayQuestion, todayKey]
  )

  const API_BASE_URL = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "", [])

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  const authHeaders = useMemo((): Record<string, string> => {
    const h: Record<string, string> = {}
    if (token) h.Authorization = `Bearer ${token}`
    return h
  }, [token])

  const pearls = useUserPearls()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showFlowModal, setShowFlowModal] = useState(false)
  const [localReadMap, setLocalReadMap] = useState<Record<string, boolean>>({})

  const [showManse, setShowManse] = useState(false)
  const [manseDataMap, setManseDataMap] = useState<
    Partial<Record<FortuneType, ManseData>>
  >({})
  const [selectedFortuneType, setSelectedFortuneType] =
    useState<FortuneType>("daily")
  const [selectedFortuneTitle, setSelectedFortuneTitle] =
    useState("오늘의 운세")
  const [manseLoading, setManseLoading] = useState(false)
  const [manseError, setManseError] = useState<string | null>(null)

  const manseData = manseDataMap[selectedFortuneType] ?? null

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const raw = window.localStorage.getItem("home_notification_reads")
      if (raw) setLocalReadMap(JSON.parse(raw))
    } catch (error) {
      console.error("Failed to load notification read map:", error)
    }
  }, [])

  const fortuneHint =
    todayFortune &&
    todayFortune.element_hint &&
    typeof todayFortune.element_hint === "object"
      ? todayFortune.element_hint
      : null

  const dominant =
    typeof fortuneHint?.dominant === "string" ? fortuneHint.dominant : "unknown"

  const dominantEmojiMap: Record<string, string> = {
    wood: "🌱",
    fire: "🔥",
    earth: "🌾",
    metal: "✨",
    water: "🌊",
    unknown: "🌤",
  }

  const hasTodayFortune = Boolean(todayFortune)

  const flowKeyword =
    typeof fortuneHint?.keyword === "string"
      ? fortuneHint.keyword
      : "오늘 흐름 보기"

  // 이 모달은 todayFortune 이 있을 때만 열리므로 폴백은 거의 쓰이지 않습니다.
  const flowSummary =
    typeof fortuneHint?.summary === "string"
      ? fortuneHint.summary
      : typeof fortuneHint?.message === "string"
        ? fortuneHint.message
        : ""

  const flowSections = [
    {
      title: "조심할 것",
      content: todayFortune?.caution || "",
      icon: "⚠️",
    },
    {
      title: "기대해도 좋은 일",
      content: todayFortune?.good_thing || "",
      icon: "✨",
    },
    {
      title: "한 줄 조언",
      content: todayFortune?.ritual || "",
      icon: "💬",
    },
  ].filter((s) => s.content)

  const fortuneCards: Array<{
    type: FortuneType
    title: string
  }> = [
    { type: "daily", title: "오늘의 운세" },
    { type: "love", title: "오늘의 연애운" },
    { type: "money", title: "오늘의 재물운" },
    { type: "study", title: "오늘의 학업운" },
  ]

  const manseSummary = profile?.birth_date
    ? "오늘의 흐름과 별개로 생년월일시 기반 사주 해석을 불러와요."
    : "생년월일을 입력하면 더 자세한 사주 해석을 볼 수 있어요."

  async function fetchManse(fortuneType: FortuneType) {
    setManseLoading(true)
    setManseError(null)

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/saju/manse?type=${fortuneType}`,
        {
          headers: authHeaders,
          credentials: "include",
          cache: "no-store",
        }
      )

      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "사주 해석을 불러오지 못했습니다.")
      }

      const data = (await res.json()) as ManseData

      setManseDataMap((prev) => ({
        ...prev,
        [fortuneType]: data,
      }))
    } catch (err: any) {
      setManseError(err?.message || "사주 해석을 불러오지 못했습니다.")
    } finally {
      setManseLoading(false)
    }
  }

  async function handleOpenManse(
    fortuneType: FortuneType = "daily",
    title = "오늘의 운세"
  ) {
    if (manseLoading) return

    setSelectedFortuneType(fortuneType)
    setSelectedFortuneTitle(title)
    setShowManse(true)
    setManseError(null)

    if (!manseDataMap[fortuneType]) {
      await fetchManse(fortuneType)
    }
  }

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = []

    const todayLetter = dashboardData?.today_letter as
      | { id?: number; letter_date?: string; is_read?: boolean }
      | undefined

    const consecutiveDays = Number(
      dashboardData?.diary_stats?.consecutive_days ?? 0
    )

    const hasTodayDiary =
      typeof dashboardData?.diary_stats?.has_today === "boolean"
        ? dashboardData.diary_stats.has_today
        : Boolean(dashboardData?.today_diary)

    if (todayLetter?.id) {
      items.push({
        id: `reply-${todayLetter.id}`,
        text: "해도리가 답장을 썼어요!",
        sub: `${formatLetterDate(todayLetter.letter_date)} 일기에 대한 편지가 도착했어요`,
        unread: !Boolean(todayLetter.is_read),
        screen: "letter-detail",
        params: {
          letter: todayLetter.id,
        },
      })
    }

    if (!hasTodayDiary) {
      const reminderKey = `reminder-${todayKey}`

      items.push({
        id: reminderKey,
        text: "오늘 일기를 잊으셨나요?",
        sub: "하루를 기록해보아요. 해도리가 기다려요",
        unread: !Boolean(localReadMap[reminderKey]),
        screen: "diary",
        params: diaryParams,
      })
    }

    if (consecutiveDays > 0) {
      const streakKey = `streak-${todayKey}-${consecutiveDays}`

      items.push({
        id: streakKey,
        text: `${consecutiveDays}일 연속 기록 달성!`,
        sub: `오늘도 기록하면 ${consecutiveDays + 1}일이에요`,
        unread: !Boolean(localReadMap[streakKey]),
        screen: "calendar",
      })
    }

    return items
  }, [dashboardData, localReadMap, todayKey, diaryParams])

  const navItems = [
    { id: "diary", label: "일기", bg: "#F2C4A8", emoji: "📖" },
    { id: "calendar", label: "달력", bg: "#C8DCC5", emoji: "📅" },
    { id: "haedori", label: "해도리", bg: "#F4E4A8", emoji: "🦦" },
    { id: "profile", label: "마이", bg: "#DDD5CC", emoji: "👤" },
  ]

  const handleFlowButtonClick = async () => {
    if (isTodayFortuneLoading) return

    if (hasTodayFortune) {
      setShowFlowModal(true)
      return
    }

    if (!onOpenTodayFlow) return

    const success = await onOpenTodayFlow()
    if (success) setShowFlowModal(true)
  }

  return (
    <div
      className="relative font-sans overflow-hidden"
      style={{
        background: "#F8F6F2",
        height: "100dvh",
        maxHeight: "100dvh",
      }}
    >
      <div
        className="h-full overflow-y-auto overscroll-y-contain pb-32"
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
        }}
      >
        <div className="flex items-center justify-between px-5 pt-12 pb-3 flex-shrink-0">
          <div>
            <p className="text-xs font-semibold" style={{ color: "#9A8F87" }}>
              {dateStr}
            </p>
            <p className="text-lg font-extrabold" style={{ color: "#3D3530" }}>
              좋은 하루예요
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate("pearl-shop")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-95"
              style={{
                background: "#FFFCF8",
                border: "1.5px solid #E5DDD5",
              }}
              aria-label="진주 상점 열기"
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 35% 35%, #EDD5A0, #C9A060)",
                }}
              />
              <span className="text-sm font-bold" style={{ color: "#3D3530" }}>
                {pearls ?? 0}
              </span>
            </button>

            <button
              onClick={() => setShowNotifications(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center relative transition-all active:scale-95"
              style={{
                background: "#FFFCF8",
                border: "1.5px solid #E5DDD5",
              }}
              aria-label="알림"
            >
              🔔
              {notifications.some((n) => n.unread) && (
                <span
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ background: "#C9856A" }}
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </div>

        <div className="px-4 flex-shrink-0">
          <div className="relative">
            <div
              className="relative w-full overflow-hidden rounded-[28px]"
              style={{
                background: "#FFFCF8",
                border: "1.5px solid #E5DDD5",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              }}
            >
              <img
                src="/images/haedori-room.jpg"
                alt="해도리 방"
                className="w-full h-auto block"
              />
            </div>

            <button
              onClick={handleFlowButtonClick}
              disabled={isTodayFortuneLoading}
              className="absolute top-4 left-4 z-20"
              style={{ background: "none", border: "none", padding: 0 }}
              aria-label="오늘의 흐름 보기"
            >
              <div
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95"
                style={{
                  background: "rgba(255,252,248,0.88)",
                  color: "#3D3530",
                  backdropFilter: "blur(6px)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  opacity: isTodayFortuneLoading ? 0.75 : 1,
                }}
              >
                <span>
                  {hasTodayFortune
                    ? dominantEmojiMap[dominant] || dominantEmojiMap.unknown
                    : "🌤"}
                </span>
                <span>
                  {isTodayFortuneLoading
                    ? "해도리가 오늘의 흐름을 살펴보고 있어요..."
                    : hasTodayFortune
                      ? `오늘 흐름: ${flowKeyword}`
                      : "오늘 흐름 보기"}
                </span>
              </div>
            </button>
          </div>
        </div>

        <div className="px-4 pt-4 pb-5 space-y-4">
          <div
            className="rounded-[28px] p-5"
            style={{
              background: "#FFFCF8",
              border: "1.5px solid #E5DDD5",
              boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            }}
          >
            <p className="text-xs font-bold mb-2" style={{ color: "#C9856A" }}>
              오늘의 질문
            </p>

            <h2
              className="text-lg font-extrabold leading-7 mb-4"
              style={{ color: "#3D3530" }}
            >
              {todayQuestion}
            </h2>

            <button
              onClick={() => onNavigate("diary", diaryParams)}
              className="w-full py-3.5 rounded-2xl text-sm font-extrabold transition-all active:scale-[0.98]"
              style={{
                background: "#C9856A",
                color: "#FFFCF8",
                boxShadow: "0 8px 18px rgba(201,133,106,0.18)",
              }}
            >
              일기 쓰러가기
            </button>
          </div>

          <div
            className="rounded-3xl p-5"
            style={{
              background: "#FFF7F1",
              border: "1.5px solid #F1D7C9",
              boxShadow: "0 2px 12px rgba(201,133,106,0.10)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p
                  className="text-xs font-bold mb-1"
                  style={{ color: "#B07A62" }}
                >
                  사주 해석
                </p>
                <p
                  className="text-sm font-extrabold"
                  style={{ color: "#3D3530" }}
                >
                  오늘 기준으로 다시 읽는 나의 흐름
                </p>
                <p
                  className="text-xs leading-5 mt-2"
                  style={{ color: "#8C7A70" }}
                >
                  {manseSummary}
                </p>
              </div>

              <button
                onClick={() => void handleOpenManse("daily", "오늘의 운세")}
                disabled={manseLoading}
                className="px-4 py-2 rounded-2xl text-sm font-bold whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background: "#C9856A",
                  color: "#FFFCF8",
                  boxShadow: "0 8px 18px rgba(201,133,106,0.18)",
                }}
              >
                {manseLoading && selectedFortuneType === "daily"
                  ? "불러오는 중..."
                  : "사주 보기"}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-base font-extrabold"
                style={{ color: "#3D3530" }}
              >
                오늘의 운세
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {fortuneCards.map((card) => (
                <div
                  key={card.type}
                  className="aspect-square rounded-[26px] p-4 flex flex-col items-center justify-between overflow-hidden"
                  style={{
                    background: "#FFFCF8",
                    border: "1.5px solid #E5DDD5",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.045)",
                  }}
                >
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <FortuneIcon type={card.type} size={48} />

                    <p
                      className="text-sm font-extrabold text-center"
                      style={{ color: "#3D3530" }}
                    >
                      {card.title}
                    </p>
                  </div>

                  <button
                    onClick={() => void handleOpenManse(card.type, card.title)}
                    disabled={manseLoading}
                    className="w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-70"
                    style={{
                      background: "#F7EEE7",
                      color: "#C9856A",
                    }}
                  >
                    {manseLoading && selectedFortuneType === card.type
                      ? "불러오는 중..."
                      : "자세히 보기"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div
            className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
            style={{
              background: "#FFFCF8",
              border: "1.5px solid #E5DDD5",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: "#EDE8E0" }}
              >
                🔥
              </div>

              <div>
                <p className="text-sm font-bold" style={{ color: "#3D3530" }}>
                  {dashboardData?.diary_stats?.consecutive_days > 0
                    ? "연속 기록 중"
                    : "기록 시작해보세요!"}
                </p>
                <p className="text-xs" style={{ color: "#9A8F87" }}>
                  {dashboardData?.diary_stats?.consecutive_days > 0
                    ? `오늘도 기록하면 ${
                        dashboardData.diary_stats.consecutive_days + 1
                      }일 달성!`
                    : "해도리가 응원해요"}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p
                className="text-2xl font-extrabold"
                style={{ color: "#C9856A" }}
              >
                {dashboardData?.diary_stats?.consecutive_days ?? 0}
              </p>
              <p className="text-xs" style={{ color: "#9A8F87" }}>
                일
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute left-0 right-0 bottom-0 z-40 px-4 pt-3 pb-5"
        style={{
          background:
            "linear-gradient(to top, rgba(248,246,242,1) 0%, rgba(248,246,242,0.96) 72%, rgba(248,246,242,0) 100%)",
        }}
      >
        <div
          className="flex items-center justify-around px-3 py-3 rounded-3xl"
          style={{
            background: "#FFFCF8",
            border: "1.5px solid #E5DDD5",
            boxShadow: "0 4px 18px rgba(61,53,48,0.10)",
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "diary") {
                  onNavigate("diary", diaryParams)
                  return
                }

                onNavigate(item.id)
              }}
              className="flex flex-col items-center gap-1.5 transition-all active:scale-90"
              aria-label={item.label}
              type="button"
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
                style={{
                  background: item.bg,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                }}
              >
                {item.emoji}
              </div>

              <span className="text-xs font-bold" style={{ color: "#3D3530" }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {showFlowModal && todayFortune && (
        <div
          className="absolute inset-0 z-50 flex items-end"
          style={{ background: "rgba(61,53,48,0.35)" }}
          onClick={() => setShowFlowModal(false)}
        >
          <div
            className="w-full rounded-t-3xl pb-8 pt-5 px-5"
            style={{
              background: "#F8F6F2",
              boxShadow: "0 -4px 30px rgba(0,0,0,0.1)",
              animation: "slideUp 0.28s cubic-bezier(0.34,1.3,0.64,1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div
                className="w-10 h-1 rounded-full"
                style={{ background: "#E5DDD5" }}
              />
            </div>

            <div className="flex items-center justify-between mb-5">
              <h3
                className="text-base font-extrabold"
                style={{ color: "#3D3530" }}
              >
                오늘의 흐름
              </h3>
              <button
                onClick={() => setShowFlowModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#EDE8E0" }}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <div
              className="flex items-center gap-3 px-4 py-4 rounded-2xl mb-4"
              style={{
                background: "#FFFCF8",
                border: "1.5px solid #E5DDD5",
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "#EDE8E0" }}
              >
                {dominantEmojiMap[dominant] || dominantEmojiMap.unknown}
              </div>

              <div>
                <p
                  className="text-xs font-semibold mb-0.5"
                  style={{ color: "#9A8F87" }}
                >
                  오늘의 키워드
                </p>
                <p
                  className="text-base font-extrabold"
                  style={{ color: "#3D3530" }}
                >
                  {flowKeyword}
                </p>
              </div>
            </div>

            {flowSummary && (
              <div
                className="px-4 py-4 rounded-2xl mb-3"
                style={{
                  background: "#F2C4A820",
                  border: "1.5px solid #F2C4A850",
                }}
              >
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#3D3530" }}
                >
                  {flowSummary}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {flowSections.map((s) => (
                <div
                  key={s.title}
                  className="flex items-start gap-3 px-4 py-3 rounded-2xl"
                  style={{
                    background: "#FFFCF8",
                    border: "1.5px solid #E5DDD5",
                  }}
                >
                  <span className="text-base mt-0.5">{s.icon}</span>
                  <div>
                    <p
                      className="text-xs font-bold mb-0.5"
                      style={{ color: "#9A8F87" }}
                    >
                      {s.title}
                    </p>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#3D3530" }}
                    >
                      {s.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showManse && (
        <div
          className="absolute inset-0 z-50 flex items-end justify-center px-4 py-6"
          style={{ background: "rgba(61,53,48,0.45)" }}
          onClick={() => setShowManse(false)}
        >
          <div
            className="w-full max-w-xl rounded-[28px] overflow-hidden"
            style={{
              background: "#FFFCF8",
              border: "1.5px solid #E5DDD5",
              boxShadow: "0 16px 40px rgba(61,53,48,0.18)",
              maxHeight: "90vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid #F0EAE3" }}
            >
              <div>
                <p className="text-xs font-bold" style={{ color: "#B07A62" }}>
                  사주 해석
                </p>
                <h3
                  className="text-base font-extrabold mt-0.5"
                  style={{ color: "#3D3530" }}
                >
                  {selectedFortuneTitle}
                </h3>
              </div>

              <button
                onClick={() => setShowManse(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "#F7F1EB", color: "#6E625B" }}
                aria-label="사주 해석 닫기"
              >
                ×
              </button>
            </div>

            <div
              className="px-5 py-4 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 72px)" }}
            >
              {manseLoading && (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-[#E8D2C6] border-t-[#C9856A] animate-spin mx-auto" />
                  <p
                    className="text-sm font-semibold mt-4"
                    style={{ color: "#8C7A70" }}
                  >
                    {selectedFortuneTitle}을 불러오는 중이에요.
                  </p>
                </div>
              )}

              {!manseLoading && manseError && (
                <div
                  className="rounded-2xl p-4 text-sm leading-6"
                  style={{
                    background: "#FFF1EE",
                    border: "1px solid #F3CCC3",
                    color: "#9D4F45",
                  }}
                >
                  {manseError}
                </div>
              )}

              {!manseLoading && !manseError && manseData && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {manseData.analysis_date && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: "#F7EEE7", color: "#8C6F5E" }}
                      >
                        기준일 {manseData.analysis_date}
                      </span>
                    )}

                    {manseData.model && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: "#F3F0E8", color: "#7E735C" }}
                      >
                        모델 {manseData.model}
                      </span>
                    )}
                  </div>

                  <div
                    className="rounded-[24px] p-5 text-sm leading-7 whitespace-pre-line"
                    style={{
                      background: "#FFF9F4",
                      border: "1px solid #F2E3D7",
                      color: "#3D3530",
                    }}
                  >
                    {manseData.analysis || "사주 해석 결과가 아직 없어요."}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showNotifications && (
        <div
          className="absolute inset-0 z-50 flex items-end"
          style={{ background: "rgba(61,53,48,0.35)" }}
          onClick={() => setShowNotifications(false)}
        >
          <div
            className="w-full rounded-t-3xl pb-8 pt-5 px-5"
            style={{
              background: "#F8F6F2",
              boxShadow: "0 -4px 30px rgba(0,0,0,0.1)",
              animation: "slideUp 0.28s cubic-bezier(0.34,1.3,0.64,1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div
                className="w-10 h-1 rounded-full"
                style={{ background: "#E5DDD5" }}
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-base font-extrabold"
                style={{ color: "#3D3530" }}
              >
                알림
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#EDE8E0" }}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <div className="space-y-2.5">
              {notifications.length === 0 ? (
                <div
                  className="w-full px-4 py-6 rounded-2xl text-center"
                  style={{
                    background: "#FFFCF8",
                    border: "1.5px solid #E5DDD5",
                  }}
                >
                  <p
                    className="text-sm font-bold"
                    style={{ color: "#3D3530" }}
                  >
                    아직 알림이 없어요
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#9A8F87" }}>
                    해도리가 소식을 가져오면 여기서 알려줄게요
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => {
                      if (!notif.id.startsWith("reply-")) {
                        const nextMap = { ...localReadMap, [notif.id]: true }
                        setLocalReadMap(nextMap)

                        if (typeof window !== "undefined") {
                          window.localStorage.setItem(
                            "home_notification_reads",
                            JSON.stringify(nextMap)
                          )
                        }
                      }

                      setShowNotifications(false)
                      onNavigate(notif.screen, notif.params)
                    }}
                    className="w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
                    style={{
                      background: notif.unread ? "#FFFCF8" : "#F8F6F2",
                      border: notif.unread
                        ? "1.5px solid #F2C4A870"
                        : "1.5px solid #E5DDD5",
                      boxShadow: notif.unread
                        ? "0 2px 10px rgba(201,133,106,0.08)"
                        : "none",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: "#EDE8E0" }}
                    >
                      🦦
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {notif.unread && (
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: "#C9856A" }}
                          />
                        )}
                        <p
                          className="text-sm font-bold truncate"
                          style={{ color: "#3D3530" }}
                        >
                          {notif.text}
                        </p>
                      </div>
                      <p
                        className="text-xs leading-snug"
                        style={{ color: "#9A8F87" }}
                      >
                        {notif.sub}
                      </p>
                    </div>

                    <span
                      className="flex-shrink-0 mt-1"
                      style={{ color: "#C4B8B0" }}
                    >
                      ›
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}