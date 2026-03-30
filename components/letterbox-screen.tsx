"use client"

import { useMemo, type MouseEvent, useState } from "react"
import { apiClient } from "@/lib/api"

interface LetterboxScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
  letters: LetterApiResponse[]
}

interface LetterApiResponse {
  id: number
  user_id: number
  diary_entry_id: number
  letter_date: string
  content: string
  element_hint?: Record<string, unknown> | null
  model?: string | null
  is_read: boolean
  is_favorite: boolean
  read_at?: string | null
  created_at: string
  updated_at: string
}

interface LetterUiItem {
  id: number
  date: string
  preview: string
  body: string
  starred: boolean
  unread: boolean
}

function formatLetterDate(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr

  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}월 ${day}일`
}

function makePreview(content: string, max = 52) {
  const oneLine = content.replace(/\n+/g, " ").trim()
  if (oneLine.length <= max) return oneLine
  return `${oneLine.slice(0, max)}...`
}

export default function LetterboxScreen({
  onNavigate,
  letters,
}: LetterboxScreenProps) {
  const [favoriteMap, setFavoriteMap] = useState<Record<number, boolean>>(
    Object.fromEntries(letters.map((letter) => [letter.id, letter.is_favorite]))
  )
  const [pendingIds, setPendingIds] = useState<Record<number, boolean>>({})

  const uiLetters = useMemo<LetterUiItem[]>(() => {
    return letters.map((letter) => ({
      id: letter.id,
      date: formatLetterDate(letter.letter_date),
      preview: makePreview(letter.content),
      body: letter.content,
      starred: favoriteMap[letter.id] ?? letter.is_favorite,
      unread: !letter.is_read,
    }))
  }, [letters, favoriteMap])

  const unreadCount = uiLetters.filter((l) => l.unread).length

  const toggleStar = async (id: number, e: MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation()

    if (pendingIds[id]) return

    const currentValue =
      favoriteMap[id] ?? letters.find((letter) => letter.id === id)?.is_favorite ?? false
    const nextValue = !currentValue

    setFavoriteMap((prev) => ({
      ...prev,
      [id]: nextValue,
    }))
    setPendingIds((prev) => ({
      ...prev,
      [id]: true,
    }))

    try {
      await apiClient.patch(`/api/letters/${id}/favorite`, {
        is_favorite: nextValue,
      })
    } catch (error) {
      console.error("즐겨찾기 저장 실패:", error)
      setFavoriteMap((prev) => ({
        ...prev,
        [id]: currentValue,
      }))
    } finally {
      setPendingIds((prev) => ({
        ...prev,
        [id]: false,
      }))
    }
  }

  const openLetter = (letter: LetterUiItem) => {
    onNavigate("letter-detail", { letter: { id: letter.id } })
  }

  return (
    <div
      className="flex flex-col h-full font-sans"
      style={{ background: "#F8F6F2" }}
    >
      <div className="flex items-center justify-between px-5 pt-12 pb-5 flex-shrink-0">
        <button
          onClick={() => onNavigate("calendar")}
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

        <div className="text-center">
          <h2
            className="text-base font-extrabold"
            style={{ color: "#3D3530" }}
          >
            해도리 편지함
          </h2>
          <p className="text-xs font-medium" style={{ color: "#9A8F87" }}>
            해도리가 남긴 편지들
          </p>
        </div>

        <div className="w-9" />
      </div>

      {unreadCount > 0 && (
        <div className="px-5 mb-4 flex-shrink-0">
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-2xl"
            style={{
              background: "#F2C4A830",
              border: "1.5px solid #F2C4A870",
            }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: "#C9856A" }}
            />
            <p className="text-xs font-semibold" style={{ color: "#C9856A" }}>
              읽지 않은 편지 {unreadCount}개가 있어요
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
        {uiLetters.length === 0 ? (
          <div
            className="rounded-2xl px-5 py-8 text-center"
            style={{
              background: "#FFFCF8",
              border: "1.5px solid #E5DDD5",
            }}
          >
            <div className="text-3xl mb-3">🦦</div>
            <p
              className="text-sm font-semibold mb-1"
              style={{ color: "#3D3530" }}
            >
              아직 받은 편지가 없어요
            </p>
            <p className="text-xs" style={{ color: "#9A8F87" }}>
              일기를 쓰고 해도리의 편지를 기다려봐
            </p>
          </div>
        ) : (
          uiLetters.map((letter) => (
            <button
              key={letter.id}
              onClick={() => openLetter(letter)}
              className="w-full text-left transition-all active:scale-[0.98]"
            >
              <div
                className="flex items-start gap-3 px-4 py-4 rounded-2xl"
                style={{
                  background: letter.unread ? "#FFFCF8" : "#FDFAF7",
                  border: letter.unread
                    ? "1.5px solid #F2C4A870"
                    : "1.5px solid #E5DDD5",
                  boxShadow: letter.unread
                    ? "0 3px 12px rgba(201,133,106,0.10)"
                    : "0 2px 6px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ background: "#EDE8E0" }}
                  aria-hidden="true"
                >
                  🦦
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold"
                        style={{ color: "#3D3530" }}
                      >
                        해도리
                      </span>
                      {letter.unread && (
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "#C9856A" }}
                        />
                      )}
                    </div>
                    <span className="text-xs" style={{ color: "#C4B8B0" }}>
                      {letter.date}
                    </span>
                  </div>

                  <p
                    className="text-xs leading-relaxed"
                    style={{
                      color: "#6B6059",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {letter.preview}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2 flex-shrink-0 self-center ml-1">
                  <span
                    onClick={(e) => void toggleStar(letter.id, e)}
                    className="w-7 h-7 flex items-center justify-center rounded-full transition-all active:scale-90 cursor-pointer"
                    style={{
                      background: letter.starred ? "#FFF3D0" : "transparent",
                      opacity: pendingIds[letter.id] ? 0.6 : 1,
                    }}
                    aria-label={letter.starred ? "즐겨찾기 해제" : "즐겨찾기"}
                    role="button"
                    tabIndex={0}
                  >
                    {letter.starred ? (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="#F4C97A"
                        stroke="#C9A060"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ) : (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#C4B8B0"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    )}
                  </span>

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
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}