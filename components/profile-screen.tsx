"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"

interface ProfileScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
  profile: {
    birth_date?: string
    birth_time?: string
  } | null

  dashboardData: {
    diary_stats: {
      consecutive_days: number
      total_diaries: number
      has_today?: boolean
    }
  } | null
  onUpdateProfile: (data: any) => Promise<void>
}

const elementColors: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  fire: { bg: "#F2A8A8", text: "#B85050", label: "화" },
  water: { bg: "#A8C4D4", text: "#4A7A94", label: "수" },
  wood: { bg: "#A8BBA5", text: "#4A6E47", label: "목" },
  metal: { bg: "#D4C4A8", text: "#7A6A40", label: "금" },
  earth: { bg: "#D4B8A8", text: "#7A5040", label: "토" },
}

type SettingsItem = {
  label: string
  icon: string
  danger?: boolean
}

const settingsItems: SettingsItem[] = [
  { label: "알림 설정", icon: "🔔" },
  { label: "계정 관리", icon: "👤" },
  { label: "구독 관리", icon: "💎" },
  { label: "로그아웃", icon: "🚪", danger: true },
]

type UserMe = {
  nickname: string
  email?: string | null
  pearls?: number
  profile_image?: string | null
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

export default function ProfileScreen({
  onNavigate,
  profile,
  dashboardData,
  onUpdateProfile,
}: ProfileScreenProps) {
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

  const [user, setUser] = useState<UserMe | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editNickname, setEditNickname] = useState("")
  const [editProfileImage, setEditProfileImage] = useState("")
  const [editBirth, setEditBirth] = useState("")
  const [editBirthTime, setEditBirthTime] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [showManse, setShowManse] = useState(false)
  const [manseData, setManseData] = useState<ManseData | null>(null)
  const [manseLoading, setManseLoading] = useState(false)
  const [manseError, setManseError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: authHeaders,
          credentials: "include",
        })
        if (!res.ok) return
        const data = (await res.json()) as UserMe
        setUser(data)
      } catch {
        // noop
      }
    }

    fetchUser()
  }, [API_BASE_URL, authHeaders])

  useEffect(() => {
  if (user && editOpen) {
    setEditNickname(user.nickname || "")
    setEditProfileImage(user.profile_image || "")
    setEditBirth(profile?.birth_date ?? "")
    setEditBirthTime(
      profile?.birth_time ? profile.birth_time.slice(0, 5) : ""
    )
  }
}, [user, editOpen, profile])

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

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEditLoading(true)
    setEditError(null)

    try {
      const res1 = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          nickname: editNickname,
          profile_image: editProfileImage,
        }),
        credentials: "include",
      })

      if (!res1.ok) throw new Error("닉네임/프로필 수정 실패")

      if (editBirth || editBirthTime) {
        await onUpdateProfile({
          birth_date: editBirth || null,
          birth_time: editBirthTime || null,
          birth_place: null,
          sex: null,
          timezone: "Asia/Seoul",
        })
      }

      const resMe = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: authHeaders,
        credentials: "include",
      })

      if (resMe.ok) {
        const me = (await resMe.json()) as UserMe
        setUser(me)
      }

      setEditOpen(false)
    } catch (err: any) {
      setEditError(err?.message || "수정 실패")
    } finally {
      setEditLoading(false)
    }
  }

  const handleSettingsClick = (label: string) => {
    if (label === "알림 설정") {
      onNavigate("notification-settings")
      return
    }

    if (label === "계정 관리") {
      onNavigate("account-management")
      return
    }

    if (label === "구독 관리") {
      onNavigate("subscription")
      return
    }

    if (label === "로그아웃") {
      localStorage.removeItem("access_token")
      onNavigate("login")
    }
  }

  const streak = dashboardData?.diary_stats?.consecutive_days ?? 0
  const totalDiaries = dashboardData?.diary_stats?.total_diaries ?? 0
  const pearls = user?.pearls ?? 0
  const manseSummary =
    profile?.birth_date
      ? "오늘 기준 흐름까지 반영해서 사주 해석을 다시 불러와요."
      : "생년월일을 입력하면 더 자세한 사주 해석을 볼 수 있어요."

  return (
    <div
      className="flex flex-col h-full overflow-y-auto font-sans"
      style={{ background: "#F8F6F2" }}
    >
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
        <h2
          className="text-base font-extrabold"
          style={{ color: "#3D3530" }}
        >
          마이페이지
        </h2>
        <div className="w-9" />
      </div>

      <div className="px-5 space-y-3 pb-8">
        <div
          className="rounded-3xl p-5"
          style={{
            background: "#FFFCF8",
            border: "1.5px solid #E5DDD5",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0"
              style={{ boxShadow: "0 2px 8px rgba(201,133,106,0.15)" }}
            >
              <Image
                src={
                  user?.profile_image
                    ? user.profile_image.startsWith("/static")
                      ? `${API_BASE_URL}${user.profile_image}`
                      : user.profile_image
                    : "/images/haedori-character.png"
                }
                alt="프로필"
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p
                  className="text-lg font-extrabold"
                  style={{ color: "#3D3530" }}
                >
                  {user?.nickname || "로그인 필요"}
                </p>

                <button
                  className="px-2 py-0.5 rounded-full text-xs font-bold border border-[#E5DDD5] bg-[#FFFCF8] text-[#C9856A]"
                  style={{ minWidth: 40 }}
                  onClick={() => setEditOpen(true)}
                >
                  수정
                </button>

                {editOpen && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: "rgba(61,53,48,0.4)" }}
                    onClick={() => setEditOpen(false)}
                  >
                    <form
                      onSubmit={handleEditSubmit}
                      className="bg-[#FFFCF8] rounded-2xl p-6 w-full max-w-xs shadow-xl flex flex-col gap-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3
                        className="text-base font-bold mb-2"
                        style={{ color: "#3D3530" }}
                      >
                        프로필 수정
                      </h3>

                      <label
                        className="text-xs font-semibold"
                        style={{ color: "#9A8F87" }}
                      >
                        닉네임
                        <input
                          type="text"
                          value={editNickname}
                          onChange={(e) => setEditNickname(e.target.value)}
                          className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E5DDD5]"
                          maxLength={50}
                          required
                        />
                      </label>

                      <label
                        className="text-xs font-semibold"
                        style={{ color: "#9A8F87" }}
                      >
                        프로필 사진 업로드
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E5DDD5]"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return

                            const formData = new FormData()
                            formData.append("file", file)

                            try {
                              const res = await fetch(
                                `${API_BASE_URL}/api/users/me/profile-image`,
                                {
                                  method: "POST",
                                  headers: authHeaders,
                                  body: formData,
                                  credentials: "include",
                                }
                              )
                              if (!res.ok) throw new Error("이미지 업로드 실패")
                              const data = await res.json()
                              setEditProfileImage(data.profile_image)
                            } catch (err: any) {
                              setEditError(
                                err?.message || "이미지 업로드 실패"
                              )
                            }
                          }}
                        />

                        <input
                          type="text"
                          value={editProfileImage}
                          onChange={(e) => setEditProfileImage(e.target.value)}
                          className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E5DDD5]"
                          maxLength={255}
                          placeholder="직접 URL 입력도 가능"
                        />
                      </label>

                      <label
                        className="text-xs font-semibold"
                        style={{ color: "#9A8F87" }}
                      >
                        생년월일
                        <input
                          type="date"
                          value={editBirth}
                          onChange={(e) => setEditBirth(e.target.value)}
                          className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E5DDD5]"
                        />
                      </label>

                      <label
                        className="text-xs font-semibold"
                        style={{ color: "#9A8F87" }}
                      >
                        출생 시간
                        <input
                          type="time"
                          value={editBirthTime}
                          onChange={(e) => setEditBirthTime(e.target.value)}
                          className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E5DDD5]"
                        />
                      </label>

                      {editError && (
                        <div className="text-red-500 text-xs">{editError}</div>
                      )}

                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          className="flex-1 py-2 rounded-lg bg-[#EDE8E0] text-[#3D3530] font-bold"
                          onClick={() => setEditOpen(false)}
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-lg bg-[#C9856A] text-[#FFFCF8] font-bold"
                          disabled={editLoading}
                        >
                          {editLoading ? "저장 중..." : "저장"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              <p className="text-sm mt-0.5" style={{ color: "#9A8F87" }}>
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-3xl p-5"
          style={{
            background: "#FFFCF8",
            border: "1.5px solid #E5DDD5",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}
        >
          <p className="text-xs font-bold mb-4" style={{ color: "#9A8F87" }}>
            기록 현황
          </p>
          <div className="flex items-center justify-around mb-4">
            <div className="text-center">
              <p
                className="text-3xl font-extrabold"
                style={{ color: "#C9856A" }}
              >
                {streak}
              </p>
              <p
                className="text-xs font-semibold mt-0.5"
                style={{ color: "#9A8F87" }}
              >
                연속일
              </p>
            </div>

            <div className="w-px h-10" style={{ background: "#E5DDD5" }} />

            <div className="text-center">
              <p
                className="text-3xl font-extrabold"
                style={{ color: "#A8BBA5" }}
              >
                {totalDiaries}
              </p>
              <p
                className="text-xs font-semibold mt-0.5"
                style={{ color: "#9A8F87" }}
              >
                총 기록
              </p>
            </div>

            <div className="w-px h-10" style={{ background: "#E5DDD5" }} />

            <div className="text-center">
              <p
                className="text-3xl font-extrabold"
                style={{ color: "#C9A060" }}
              >
                {pearls}
              </p>
              <p
                className="text-xs font-semibold mt-0.5"
                style={{ color: "#9A8F87" }}
              >
                진주
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "#FFFCF8",
            border: "1.5px solid #E5DDD5",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <p className="text-xs font-bold px-5 pt-4 pb-2" style={{ color: "#9A8F87" }}>
            설정
          </p>

          {settingsItems.map((item, idx) => (
            <div key={item.label}>
              <button
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all active:bg-[#EDE8E0]"
                onClick={() => handleSettingsClick(item.label)}
              >
                <span className="text-base">{item.icon}</span>
                <span
                  className="flex-1 text-sm font-semibold"
                  style={{ color: item.danger ? "#C95050" : "#3D3530" }}
                >
                  {item.label}
                </span>

                {!item.danger && (
                  <svg
                    width="14"
                    height="14"
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
                )}
              </button>

              {idx < settingsItems.length - 1 && (
                <div
                  className="mx-5"
                  style={{ height: "1px", background: "#F0EAE3" }}
                />
              )}
            </div>
          ))}
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

      {showManse && (
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

            <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 72px)" }}>
              {manseLoading && (
                <div className="py-16 text-center">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-[#E8D2C6] border-t-[#C9856A] animate-spin mx-auto"
                  />
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
    </div>
  )
}
