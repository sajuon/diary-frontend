// /home/dori/diary-frontend/components/profile-screen.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { apiClient } from "@/lib/api"

interface ProfileScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
  profile: {
    birth_date?: string
    birth_time?: string
    birth_place?: string
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

  const [user, setUser] = useState<UserMe | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editNickname, setEditNickname] = useState("")
  const [editProfileImage, setEditProfileImage] = useState("")
  const [editBirth, setEditBirth] = useState("")
  const [editBirthTime, setEditBirthTime] = useState("")
  const [editBirthPlace, setEditBirthPlace] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = (await apiClient.getMe()) as UserMe
        setUser(data)
      } catch {
        // noop
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    if (user && editOpen) {
      setEditNickname(user.nickname || "")
      setEditProfileImage(user.profile_image || "")
      setEditBirth(profile?.birth_date ?? "")
      setEditBirthTime(
        profile?.birth_time ? profile.birth_time.slice(0, 5) : ""
      )
      setEditBirthPlace(profile?.birth_place ?? "")
    }
  }, [user, editOpen, profile])

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEditLoading(true)
    setEditError(null)

    try {
      await apiClient.put("/api/auth/profile", {
        nickname: editNickname,
        profile_image: editProfileImage,
      })

      await onUpdateProfile({
        birth_date: editBirth || null,
        birth_time: editBirthTime
          ? editBirthTime.length === 5
            ? `${editBirthTime}:00`
            : editBirthTime
          : null,
        birth_place: editBirthPlace.trim() || null,
        sex: null,
        timezone: "Asia/Seoul",
      })

      const me = (await apiClient.getMe()) as UserMe
      setUser(me)

      setEditOpen(false)
    } catch (err: any) {
      setEditError(err?.message || "수정 실패")
    } finally {
      setEditLoading(false)
    }
  }

  const handleLogout = async () => {
    if (logoutLoading) return

    setLogoutLoading(true)

    try {
      await apiClient.logout()
      window.location.replace("/login")
    } catch (error) {
      console.error("logout failed:", error)
      alert("로그아웃 중 오류가 발생했어.")
    } finally {
      setLogoutLoading(false)
    }
  }

  const handleSettingsClick = async (label: string) => {
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
      await handleLogout()
    }
  }

  const streak = dashboardData?.diary_stats?.consecutive_days ?? 0
  const totalDiaries = dashboardData?.diary_stats?.total_diaries ?? 0
  const pearls = user?.pearls ?? 0

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
                              const token =
                                typeof window !== "undefined"
                                  ? localStorage.getItem("access_token") ||
                                    sessionStorage.getItem("access_token")
                                  : null

                              const headers: Record<string, string> = {}
                              if (token) {
                                headers.Authorization = `Bearer ${token}`
                              }

                              const res = await fetch(
                                `${API_BASE_URL}/api/users/me/profile-image`,
                                {
                                  method: "POST",
                                  headers,
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

                      <label
                        className="text-xs font-semibold"
                        style={{ color: "#9A8F87" }}
                      >
                        출생 지역
                        <input
                          type="text"
                          value={editBirthPlace}
                          onChange={(e) => setEditBirthPlace(e.target.value)}
                          className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E5DDD5]"
                          maxLength={100}
                          placeholder="예: 부산, 서울, 대구"
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

              <div className="mt-2 space-y-1 text-xs" style={{ color: "#9A8F87" }}>
                {profile?.birth_date && <p>생년월일: {profile.birth_date}</p>}
                {profile?.birth_time && <p>출생 시간: {profile.birth_time.slice(0, 5)}</p>}
                {profile?.birth_place && <p>출생 지역: {profile.birth_place}</p>}
              </div>
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
          <p
            className="text-xs font-bold px-5 pt-4 pb-2"
            style={{ color: "#9A8F87" }}
          >
            설정
          </p>

          {settingsItems.map((item, idx) => (
            <div key={item.label}>
              <button
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all active:bg-[#EDE8E0] disabled:opacity-50"
                onClick={() => handleSettingsClick(item.label)}
                disabled={logoutLoading && item.label === "로그아웃"}
              >
                <span className="text-base">{item.icon}</span>
                <span
                  className="flex-1 text-sm font-semibold"
                  style={{ color: item.danger ? "#C95050" : "#3D3530" }}
                >
                  {item.label === "로그아웃" && logoutLoading
                    ? "로그아웃 중..."
                    : item.label}
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
      </div>
    </div>
  )
}