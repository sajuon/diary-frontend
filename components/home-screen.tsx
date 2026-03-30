"use client"

import { useEffect, useMemo, useState } from "react"
import { useUserPearls } from "../hooks/use-user-pearls"
import RoomEdit from "./room-edit"

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
  pillars: Array<{
    label: string
    stem: string
    branch: string
    element: "화" | "수" | "목" | "금" | "토" | string
    tenGod: string
  }>
  elementSummary: Record<string, number>
  analysis?: string
  analysis_date?: string
  model?: string | null
  chart_provided?: boolean
}

function formatLetterDate(dateString?: string) {
  if (!dateString) return ""
  const date = new Date(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}월 ${day}일`
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
  purchases = [],
  onOpenTodayFlow,
  isTodayFortuneLoading = false,
  profile = null,
}: HomeScreenProps) {
  const today = new Date()
  const dateStr = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })

  const API_BASE_URL = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "",
    []
  )

  const token = useMemo(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("access_token")
  }, [])

  const authHeaders = useMemo((): Record<string, string> => {
    const h: Record<string, string> = {}
    if (token) h.Authorization = `Bearer ${token}`
    return h
  }, [token])

  const pearls = useUserPearls()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showFlowModal, setShowFlowModal] = useState(false)
  const [localReadMap, setLocalReadMap] = useState<Record<string, boolean>>({})
  const [isRoomEditing, setIsRoomEditing] = useState(false)

  const [showManse, setShowManse] = useState(false)
  const [manseData, setManseData] = useState<ManseData | null>(null)
  const [manseLoading, setManseLoading] = useState(false)
  const [manseError, setManseError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem("home_notification_reads")
      if (raw) {
        setLocalReadMap(JSON.parse(raw))
      }
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

  const flowSummary =
    typeof fortuneHint?.summary === "string"
      ? fortuneHint.summary
      : typeof fortuneHint?.message === "string"
        ? fortuneHint.message
        : "버튼을 눌러 오늘의 흐름을 확인해보세요."

  const flowSections = [
    {
      title: "조심할 것",
      content: todayFortune?.caution || "버튼을 누르면 오늘의 흐름이 생성돼요",
      icon: "⚠️",
    },
    {
      title: "기대해도 좋은 일",
      content: todayFortune?.good_thing || "생성 후 오늘의 좋은 기운을 확인할 수 있어요",
      icon: "✨",
    },
    {
      title: "한 줄 조언",
      content: todayFortune?.ritual || "오늘의 하루를 눌러 확인해보세요",
      icon: "💬",
    },
  ]

  const manseSummary =
    profile?.birth_date
      ? "오늘 기준 흐름까지 반영해서 사주 해석을 다시 불러와요."
      : "생년월일을 입력하면 더 자세한 사주 해석을 볼 수 있어요."

  async function fetchManse() {
    setManseLoading(true)
    setManseError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/saju/manse`, {
        headers: authHeaders,
        credentials: "include",
        cache: "no-store",
      })

      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "사주 해석을 불러오지 못했습니다.")
      }

      const data = (await res.json()) as ManseData
      setManseData(data)
    } catch (err: any) {
      setManseError(err?.message || "사주 해석을 불러오지 못했습니다.")
    } finally {
      setManseLoading(false)
    }
  }

  useEffect(() => {
    if (showManse) {
      void fetchManse()
    }
  }, [showManse, API_BASE_URL, authHeaders])

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = []
    const todayKey = getTodayKey()

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
        text: "어제 일기를 잊으셨나요?",
        sub: "하루를 기록해보아요. 해도리가 기다려요",
        unread: !Boolean(localReadMap[reminderKey]),
        screen: "diary",
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
  }, [dashboardData, localReadMap])

  const navItems = [
    {
      id: "diary",
      label: "일기",
      bg: "#F2C4A8",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C9856A"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
    {
      id: "calendar",
      label: "달력",
      bg: "#C8DCC5",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#A8BBA5"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        </svg>
      ),
    },
    {
      id: "shop",
      label: "상점",
      bg: "#F4E4A8",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C9A84C"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      id: "profile",
      label: "마이",
      bg: "#DDD5CC",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9A8F87"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ]

  const handleFlowButtonClick = async () => {
    if (isTodayFortuneLoading) return

    if (hasTodayFortune) {
      setShowFlowModal(true)
      return
    }

    if (!onOpenTodayFlow) return

    const success = await onOpenTodayFlow()
    if (success) {
      setShowFlowModal(true)
    }
  }

  return (
    <div
      className="relative flex flex-col h-full font-sans"
      style={{ background: "#F8F6F2" }}
    >
      {!isRoomEditing && (
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
              style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
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
              style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
              aria-label="알림"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3D3530"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>

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
      )}

      <div className={isRoomEditing ? "px-0 pt-0 flex-1" : "px-4 flex-shrink-0"}>
        <div className={isRoomEditing ? "relative h-full" : "relative"}>
          <RoomEdit
            onEditModeChange={setIsRoomEditing}
            purchases={purchases}
          />

          {!isRoomEditing && (
            <button
              onClick={handleFlowButtonClick}
              disabled={isTodayFortuneLoading}
              className="absolute top-4 left-4 z-20"
              style={{ background: "none", border: "none", padding: 0 }}
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
                {!isTodayFortuneLoading && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9856A"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </div>
            </button>
          )}
        </div>
      </div>

      {!isRoomEditing && (
        <>
          <div className="px-4 pt-4 flex-shrink-0">
            <div
              className="flex items-center justify-around px-3 py-3 rounded-3xl"
              style={{
                background: "#FFFCF8",
                border: "1.5px solid #E5DDD5",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              }}
            >
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="flex flex-col items-center gap-1.5 transition-all active:scale-90"
                  aria-label={item.label}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: item.bg,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                    }}
                  >
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold" style={{ color: "#3D3530" }}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 pt-3 pb-4 space-y-2.5 flex-1">
            <button
              onClick={() => onNavigate("diary")}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
              style={{
                background: dashboardData?.diaryDone ? "#EDE8E0" : "#FFFCF8",
                border: "1.5px solid #E5DDD5",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
              disabled={dashboardData?.diaryDone}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: dashboardData?.diaryDone ? "#C4B8B0" : "#F2C4A8",
                  }}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9856A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>

                <div className="text-left">
                  <p className="text-sm font-bold" style={{ color: "#3D3530" }}>
                    {dashboardData?.diaryDone
                      ? "오늘 일기 쓰기 완료"
                      : "오늘 일기 쓰기"}
                  </p>
                  <p className="text-xs" style={{ color: "#9A8F87" }}>
                    {dashboardData?.diaryDone
                      ? "내일 또 만나요!"
                      : "해도리가 기다리고 있어요"}
                  </p>
                </div>
              </div>

              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C4B8B0"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

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
                      ? `오늘도 기록하면 ${dashboardData.diary_stats.consecutive_days + 1}일 달성!`
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
                  <p className="text-xs font-bold mb-1" style={{ color: "#B07A62" }}>
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
                  onClick={() => setShowManse(true)}
                  className="px-4 py-2 rounded-2xl text-sm font-bold whitespace-nowrap"
                  style={{
                    background: "#C9856A",
                    color: "#FFFCF8",
                    boxShadow: "0 8px 18px rgba(201,133,106,0.18)",
                  }}
                >
                  사주 보기
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {!isRoomEditing && showFlowModal && todayFortune && (
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
              <h3 className="text-base font-extrabold" style={{ color: "#3D3530" }}>
                오늘의 흐름
              </h3>
              <button
                onClick={() => setShowFlowModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#EDE8E0" }}
                aria-label="닫기"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9A8F87"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div
              className="flex items-center gap-3 px-4 py-4 rounded-2xl mb-4"
              style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "#EDE8E0" }}
              >
                {dominantEmojiMap[dominant] || dominantEmojiMap.unknown}
              </div>
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "#9A8F87" }}>
                  오늘의 키워드
                </p>
                <p className="text-base font-extrabold" style={{ color: "#3D3530" }}>
                  {flowKeyword}
                </p>
              </div>
            </div>

            <div
              className="px-4 py-4 rounded-2xl mb-3"
              style={{
                background: "#F2C4A820",
                border: "1.5px solid #F2C4A850",
              }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "#3D3530" }}>
                {flowSummary}
              </p>
            </div>

            <div className="space-y-2">
              {flowSections.map((s) => (
                <div
                  key={s.title}
                  className="flex items-start gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
                >
                  <span className="text-base mt-0.5">{s.icon}</span>
                  <div>
                    <p className="text-xs font-bold mb-0.5" style={{ color: "#9A8F87" }}>
                      {s.title}
                    </p>
                    <p className="text-sm font-semibold" style={{ color: "#3D3530" }}>
                      {s.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isRoomEditing && showManse && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center px-4 py-6"
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
                  오늘의 흐름을 반영한 해석
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => void fetchManse()}
                  className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{
                    background: "#F7EEE7",
                    color: "#B07A62",
                    border: "1px solid #F1D7C9",
                  }}
                >
                  다시 불러오기
                </button>
                <button
                  onClick={() => setShowManse(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "#F7F1EB", color: "#6E625B" }}
                  aria-label="사주 해석 닫기"
                >
                  ×
                </button>
              </div>
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
                    오늘의 사주 해석을 불러오는 중이에요.
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
                    {!profile?.birth_date && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: "#F8F2DB", color: "#8A7344" }}
                      >
                        생년월일 입력 시 더 정확해져요
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

      {!isRoomEditing && showNotifications && (
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
              <h3 className="text-base font-extrabold" style={{ color: "#3D3530" }}>
                알림
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#EDE8E0" }}
                aria-label="닫기"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9A8F87"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
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
                  <p className="text-sm font-bold" style={{ color: "#3D3530" }}>
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
                      aria-hidden="true"
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

                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#C4B8B0"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0 mt-1"
                      aria-hidden="true"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
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

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}