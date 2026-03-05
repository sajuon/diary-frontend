"use client"

import { useState, useRef } from "react"
import { useUserPearls } from "../hooks/use-user-pearls"
import Image from "next/image"

interface HomeScreenProps {
  onNavigate: (screen: string) => void
  dashboardData?: any
}

interface FurnitureItem {
  id: string
  label: string
  x: number
  y: number
  size: number
  emoji: string
}

const initialFurniture: FurnitureItem[] = [
  { id: "desk", label: "책상", x: 30, y: 55, size: 52, emoji: "🪑" },
  { id: "shelf", label: "선반", x: 68, y: 30, size: 44, emoji: "📚" },
  { id: "window", label: "창문", x: 50, y: 15, size: 40, emoji: "🪟" },
  { id: "plant", label: "식물", x: 82, y: 62, size: 36, emoji: "🪴" },
  { id: "lamp", label: "조명", x: 18, y: 30, size: 34, emoji: "💡" },
]

export default function HomeScreen({ onNavigate, dashboardData }: HomeScreenProps) {
  const today = new Date()
  const dateStr = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })
  const pearls = useUserPearls()

  const [editMode, setEditMode] = useState(false)
  const [furniture, setFurniture] = useState<FurnitureItem[]>(initialFurniture)
  const [savedFurniture, setSavedFurniture] = useState<FurnitureItem[]>(initialFurniture)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showFlowModal, setShowFlowModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, text: "해도리가 답장을 썼어요!", sub: "2월 26일 일기에 대한 편지가 도착했어요", unread: true, screen: "letterbox" },
    { id: 2, text: "어제 일기를 잊으셨나요?", sub: "하루를 기록해보아요. 해도리가 기다려요", unread: true, screen: "diary" },
    { id: 3, text: "11일 연속 기록 달성!", sub: "오늘도 기록하면 12일이에요", unread: false, screen: "calendar" },
  ])
  const roomRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (!editMode) return
    e.preventDefault()
    setSelectedId(id)
    const rect = roomRef.current?.getBoundingClientRect()
    if (!rect) return
    const item = furniture.find((f) => f.id === id)
    if (!item) return
    const itemPixelX = (item.x / 100) * rect.width
    const itemPixelY = (item.y / 100) * rect.height
    draggingRef.current = {
      id,
      offsetX: e.clientX - rect.left - itemPixelX,
      offsetY: e.clientY - rect.top - itemPixelY,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !roomRef.current) return
    const rect = roomRef.current.getBoundingClientRect()
    const newX = ((e.clientX - rect.left - draggingRef.current.offsetX) / rect.width) * 100
    const newY = ((e.clientY - rect.top - draggingRef.current.offsetY) / rect.height) * 100
    setFurniture((prev) =>
      prev.map((f) =>
        f.id === draggingRef.current!.id
          ? { ...f, x: Math.min(90, Math.max(5, newX)), y: Math.min(85, Math.max(5, newY)) }
          : f
      )
    )
  }

  const handlePointerUp = () => {
    draggingRef.current = null
  }

  const handleSave = () => {
    setSavedFurniture([...furniture])
    setEditMode(false)
    setSelectedId(null)
  }

  const handleCancel = () => {
    setFurniture([...savedFurniture])
    setEditMode(false)
    setSelectedId(null)
  }

  const navItems = [
    {
      id: "diary",
      label: "일기",
      color: "#C9856A",
      bg: "#F2C4A8",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9856A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
    {
      id: "calendar",
      label: "달력",
      color: "#A8BBA5",
      bg: "#C8DCC5",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A8BBA5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        </svg>
      ),
    },
    {
      id: "shop",
      label: "상점",
      color: "#C9A84C",
      bg: "#F4E4A8",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      id: "profile",
      label: "마이",
      color: "#9A8F87",
      bg: "#DDD5CC",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9A8F87" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full font-sans" style={{ background: "#F8F6F2" }}>
      {/* Top Bar */}
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
              style={{ background: "radial-gradient(circle at 35% 35%, #EDD5A0, #C9A060)" }}
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
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3D3530" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

      {/* Room Card */}
      <div className="px-4 flex-shrink-0">
        <div
          className="relative w-full rounded-3xl overflow-hidden"
          style={{
            height: "310px",
            background: "#E8E2D8",
            boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
          }}
        >
          {/* Room image */}
          <Image
            src="/images/haedori-room.jpg"
            alt="해도리의 방"
            fill
            className="object-cover"
          />

          {/* Edit mode: dotted grid overlay */}
          {editMode && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(201,133,106,0.25) 1.5px, transparent 1.5px)",
                backgroundSize: "24px 24px",
              }}
            />
          )}

          {/* Draggable furniture layer */}
          <div
            ref={roomRef}
            className="absolute inset-0"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {editMode &&
              furniture.map((item) => (
                <div
                  key={item.id}
                  onPointerDown={(e) => handlePointerDown(e, item.id)}
                  className="absolute flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: selectedId === item.id ? 20 : 10,
                  }}
                >
                  <div
                    className="rounded-2xl flex items-center justify-center text-2xl transition-all"
                    style={{
                      width: item.size,
                      height: item.size,
                      background:
                        selectedId === item.id
                          ? "rgba(255,252,248,0.96)"
                          : "rgba(255,252,248,0.82)",
                      border:
                        selectedId === item.id
                          ? "2px dashed #C9856A"
                          : "1.5px dashed rgba(201,133,106,0.4)",
                      boxShadow:
                        selectedId === item.id
                          ? "0 4px 16px rgba(201,133,106,0.25)"
                          : "none",
                    }}
                  >
                    {item.emoji}
                    {selectedId === item.id && (
                      <div
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "#C9856A" }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFCF8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21.5 2.5l-7 7M14.5 9.5l-4 1 1-4 7-7M3 21l5-1.5L3 15l-1.5 5L3 21z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span
                    className="text-xs font-bold mt-1 px-1.5 py-0.5 rounded-lg"
                    style={{
                      background: "rgba(255,252,248,0.9)",
                      color: "#3D3530",
                      fontSize: "10px",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
          </div>

          {/* Edit button (top-right) */}
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{
                background: "rgba(255,252,248,0.92)",
                color: "#3D3530",
                backdropFilter: "blur(8px)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9856A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              편집
            </button>
          )}

          {/* Non-edit overlay: today's flow + otter greeting */}
          {!editMode && (
            <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
              {/* Today's flow chip */}
              <button
                className="self-start pointer-events-auto"
                onClick={() => setShowFlowModal(true)}
                style={{ background: "none", border: "none", padding: 0 }}
              >
                <div
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95"
                  style={{
                    background: "rgba(255,252,248,0.88)",
                    color: "#3D3530",
                    backdropFilter: "blur(6px)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <span>🌤</span>
                  <span>오늘 흐름: 차분하고 맑음</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C9856A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </button>
            </div>
          )}

          {/* Edit mode bottom bar */}
          {editMode && (
            <div
              className="absolute bottom-0 inset-x-0 flex items-center justify-between px-5 py-3.5"
              style={{
                background: "rgba(248,246,242,0.96)",
                backdropFilter: "blur(10px)",
                borderTop: "1.5px solid #E5DDD5",
              }}
            >
              <p className="text-xs font-semibold" style={{ color: "#9A8F87" }}>
                가구를 드래그해 배치하세요
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={{ background: "#EDE8E0", color: "#3D3530" }}
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={{ background: "#C9856A", color: "#FFFCF8" }}
                >
                  저장
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal nav menu — below the room card */}
      {!editMode && (
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
                <span
                  className="text-xs font-bold"
                  style={{ color: "#3D3530" }}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom cards */}
      {!editMode && (
        <div className="px-4 pt-3 pb-4 space-y-2.5 flex-1">
          {/* Quick diary */}
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
                style={{ background: dashboardData?.diaryDone ? "#C4B8B0" : "#F2C4A8" }}
              >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C9856A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: "#3D3530" }}>
                  {dashboardData?.diaryDone ? "오늘 일기 쓰기 완료" : "오늘 일기 쓰기"}
                </p>
                <p className="text-xs" style={{ color: "#9A8F87" }}>
                  {dashboardData?.diaryDone ? "내일 또 만나요!" : "해도리가 기다리고 있어요"}
                </p>
              </div>
            </div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C4B8B0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Streak */}
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
                  {dashboardData?.diary_stats?.consecutive_days > 0 ? "연속 기록 중" : "기록 시작해보세요!"}
                </p>
                <p className="text-xs" style={{ color: "#9A8F87" }}>
                  {dashboardData?.diary_stats?.consecutive_days > 0
                    ? `오늘도 기록하면 ${dashboardData.diary_stats.consecutive_days + 1}일 달성!`
                    : "해도리가 응원해요"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold" style={{ color: "#C9856A" }}>{dashboardData?.diary_stats?.consecutive_days ?? 0}</p>
              <p className="text-xs" style={{ color: "#9A8F87" }}>일</p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Flow Modal */}
      {showFlowModal && (
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
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: "#E5DDD5" }} />
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
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9A8F87" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Keyword card */}
            <div
              className="flex items-center gap-3 px-4 py-4 rounded-2xl mb-4"
              style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "#EDE8E0" }}
              >
                🌤
              </div>
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "#9A8F87" }}>오늘의 키워드</p>
                <p className="text-base font-extrabold" style={{ color: "#3D3530" }}>
                  차분하고 맑음
                </p>
              </div>
            </div>

            {/* Fortune message */}
            <div
              className="px-4 py-4 rounded-2xl mb-3"
              style={{ background: "#F2C4A820", border: "1.5px solid #F2C4A850" }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "#3D3530" }}>
                오늘은 감정이 예민해질 수 있어요.
                <br />
                작은 말에도 마음이 흔들릴 수 있으니
                <br />
                혼자만의 시간을 조금 가져보세요.
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-2">
              {[
                { title: "조심할 것", content: "충동적인 말이나 빠른 결정", icon: "⚠️" },
                { title: "기대해도 좋은 일", content: "오후에 뜻밖의 연락이나 소식", icon: "✨" },
                { title: "한 줄 조언", content: "내 마음을 먼저 들어주는 하루가 되길", icon: "💬" },
              ].map((s) => (
                <div
                  key={s.title}
                  className="flex items-start gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
                >
                  <span className="text-base mt-0.5">{s.icon}</span>
                  <div>
                    <p className="text-xs font-bold mb-0.5" style={{ color: "#9A8F87" }}>{s.title}</p>
                    <p className="text-sm font-semibold" style={{ color: "#3D3530" }}>{s.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notification panel */}
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
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: "#E5DDD5" }} />
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold" style={{ color: "#3D3530" }}>알림</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#EDE8E0" }}
                aria-label="닫기"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9A8F87" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2.5">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    setNotifications((prev) =>
                      prev.map((n) => n.id === notif.id ? { ...n, unread: false } : n)
                    )
                    setShowNotifications(false)
                    onNavigate(notif.screen)
                  }}
                  className="w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
                  style={{
                    background: notif.unread ? "#FFFCF8" : "#F8F6F2",
                    border: notif.unread ? "1.5px solid #F2C4A870" : "1.5px solid #E5DDD5",
                    boxShadow: notif.unread ? "0 2px 10px rgba(201,133,106,0.08)" : "none",
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
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C9856A" }} />
                      )}
                      <p className="text-sm font-bold truncate" style={{ color: "#3D3530" }}>
                        {notif.text}
                      </p>
                    </div>
                    <p className="text-xs leading-snug" style={{ color: "#9A8F87" }}>
                      {notif.sub}
                    </p>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C4B8B0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-1" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
