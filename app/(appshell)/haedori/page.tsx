// /home/dori/diary-frontend/app/(appshell)/haedori/page.tsx
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { useRouter } from "next/navigation"
import RoomBackground from "@/components/room-background"
import RoomItemView, { RoomItemArt } from "@/components/room-item-view"
import { FeedSheet, PersonalityCardSheet } from "@/components/haedori-personality"
import { apiClient, type FeedSnackResult, type HaedoriState } from "@/lib/api"
import { NEUTRAL_LINES, TRAIT_STYLE, linesFor } from "@/lib/haedori-personality"
import {
  ROOM_ITEMS,
  clampPlacement,
  defaultPlacement,
  type Placement,
} from "@/lib/room-items"
import {
  DEFAULT_THEME_KEY,
  getRoomTheme,
  readCachedThemeKey,
  writeCachedThemeKey,
} from "@/lib/room-themes"

const menuItems = [
  { label: "해도리 상점", image: "/images/icons/snackmarket.png", path: "/shop" },
  { label: "해도리 답장", image: "/images/icons/mailbox.png", path: "/letterbox" },
  { label: "편지지 상점", image: "/images/icons/pearlshop.png", path: "/letter-shop" },
]

type DragState = { key: string; pointerId: number; dx: number; dy: number }

type FeedEffect = { id: number; gained: FeedSnackResult["fed"]["gained"] }

export default function HaedoriPage() {
  const router = useRouter()
  const roomRef = useRef<HTMLDivElement>(null)

  const [message, setMessage] = useState(NEUTRAL_LINES[0])
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY)
  const theme = getRoomTheme(themeKey)

  const [ownedItemKeys, setOwnedItemKeys] = useState<string[]>([])
  const [placements, setPlacements] = useState<Placement[]>([])

  // 꾸미기 모드
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Placement[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [trayOpen, setTrayOpen] = useState(true)
  const dragRef = useRef<DragState | null>(null)

  // 성격 + 간식
  const [haedori, setHaedori] = useState<HaedoriState | null>(null)
  const [cardOpen, setCardOpen] = useState(false)
  const [feedOpen, setFeedOpen] = useState(false)
  const [feedingKey, setFeedingKey] = useState<string | null>(null)
  const [feedEffect, setFeedEffect] = useState<FeedEffect | null>(null)

  useEffect(() => {
    // 캐시로 먼저 그리고, 서버 값으로 맞춘다
    setThemeKey(readCachedThemeKey())
    apiClient
      .getRoom()
      .then((room) => {
        setThemeKey(room.theme_key)
        writeCachedThemeKey(room.theme_key)
        setOwnedItemKeys(room.owned_room_item_keys ?? [])
        setPlacements(room.placements ?? [])
        // 상점에서 '배치하기'로 들어온 경우 바로 꾸미기 모드
        if (new URLSearchParams(window.location.search).get("decorate")) {
          setDraft(room.placements ?? [])
          setEditing(true)
        }
      })
      .catch((err) => console.warn("Failed to load room:", err))

    apiClient
      .getHaedori()
      .then((state) => {
        setHaedori(state)
        const lines = linesFor(state.personality.type.primary, state.personality.type.secondary)
        setMessage(lines[Math.floor(Math.random() * lines.length)])
        // 상점에서 간식을 사고 '주기'로 들어온 경우 바로 간식 시트
        if (new URLSearchParams(window.location.search).get("feed")) setFeedOpen(true)
      })
      .catch((err) => console.warn("Failed to load haedori:", err))
  }, [])

  const feed = async (snackKey: string) => {
    try {
      setFeedingKey(snackKey)
      const result = await apiClient.feedSnack(snackKey)
      setHaedori(result)
      setFeedOpen(false)
      setMessage(
        result.fed.type_changed
          ? `${result.fed.reaction}\n(해도리가 '${result.personality.type.name}'가 됐어!)`
          : result.fed.reaction
      )
      setFeedEffect({ id: Date.now(), gained: result.fed.gained })
    } catch (error: any) {
      alert(error?.message || "간식을 주지 못했어요.")
    } finally {
      setFeedingKey(null)
    }
  }

  useEffect(() => {
    if (!feedEffect) return
    const timer = setTimeout(() => setFeedEffect(null), 1800)
    return () => clearTimeout(timer)
  }, [feedEffect])

  const changeMessage = () => {
    // 해도리 성격에 맞는 말풍선
    const type = haedori?.personality.type
    const lines = linesFor(type?.primary ?? null, type?.secondary ?? null)
    const candidates = lines.filter((m) => m !== message)
    setMessage(candidates[Math.floor(Math.random() * candidates.length)])
  }

  // ===== 꾸미기 =====

  const startEditing = () => {
    setDraft(placements)
    setSelectedKey(null)
    setTrayOpen(true)
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setSelectedKey(null)
  }

  const saveEditing = async () => {
    try {
      setSaving(true)
      const room = await apiClient.setRoomPlacements(draft)
      setPlacements(room.placements ?? [])
      setOwnedItemKeys(room.owned_room_item_keys ?? [])
      setEditing(false)
      setSelectedKey(null)
    } catch (error: any) {
      alert(error?.message || "배치를 저장하지 못했어요.")
    } finally {
      setSaving(false)
    }
  }

  const togglePlace = (key: string) => {
    const item = ROOM_ITEMS[key]
    if (!item) return
    if (draft.some((p) => p.item_key === key)) {
      setSelectedKey(key)
      return
    }
    setDraft((prev) => [...prev, clampPlacement(item, defaultPlacement(item, prev.length))])
    setSelectedKey(key)
  }

  const removeItem = (key: string) => {
    setDraft((prev) => prev.filter((p) => p.item_key !== key))
    setSelectedKey(null)
  }

  const toPercent = useCallback((clientX: number, clientY: number) => {
    const rect = roomRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    }
  }, [])

  const handleItemPointerDown = (key: string) => (e: ReactPointerEvent<HTMLDivElement>) => {
    const current = draft.find((p) => p.item_key === key)
    if (!current) return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const point = toPercent(e.clientX, e.clientY)
    dragRef.current = { key, pointerId: e.pointerId, dx: current.x - point.x, dy: current.y - point.y }
    setSelectedKey(key)
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const item = ROOM_ITEMS[drag.key]
    if (!item) return
    const point = toPercent(e.clientX, e.clientY)
    const next = clampPlacement(item, { item_key: drag.key, x: point.x + drag.dx, y: point.y + drag.dy })
    setDraft((prev) => prev.map((p) => (p.item_key === drag.key ? next : p)))
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null
  }

  const shown = editing ? draft : placements
  const ownedItems = ownedItemKeys.map((k) => ROOM_ITEMS[k]).filter(Boolean)

  return (
    <div
      ref={roomRef}
      className="relative h-[100dvh] max-h-full overflow-hidden px-5 pt-5 pb-0"
      style={{ background: theme.base }}
      onPointerMove={editing ? handlePointerMove : undefined}
      onPointerUp={editing ? handlePointerUp : undefined}
      onPointerCancel={editing ? handlePointerUp : undefined}
      onPointerDown={() => {
        // 소품이 아닌 곳을 누르면 선택 해제 (소품은 이벤트 전파를 막음)
        if (editing) setSelectedKey(null)
      }}
    >
      <RoomBackground theme={theme} />

      {/* 소품 */}
      {shown.map((p) => {
        const item = ROOM_ITEMS[p.item_key]
        if (!item) return null
        return (
          <RoomItemView
            key={p.item_key}
            item={item}
            placement={p}
            editing={editing}
            selected={editing && selectedKey === p.item_key}
            onPointerDown={handleItemPointerDown(p.item_key)}
            onRemove={() => removeItem(p.item_key)}
          />
        )
      })}

      {/* 해도리: 바닥 중간쯤에 서 있음. 이보다 아래 놓인 바닥 소품은 해도리 앞에 그려진다 */}
      <div
        className="pointer-events-none absolute bottom-[12%] left-1/2 z-[19] h-7 w-[44%] -translate-x-1/2 translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(61,53,48,0.16) 0%, rgba(61,53,48,0.06) 48%, rgba(61,53,48,0) 74%)",
        }}
      />
      <button
        onClick={changeMessage}
        className="absolute bottom-[12%] left-1/2 z-20 -translate-x-1/2 transition-all active:scale-95"
        style={{ border: "none", background: "transparent", padding: 0, pointerEvents: editing ? "none" : "auto" }}
        aria-label="해도리 말 걸기"
      >
        <img src="/images/haedori-body.png" alt="해도리" className="h-48 w-48 object-contain drop-shadow-xl" />
      </button>

      {/* 헤더 */}
      <div className="relative z-[60] flex items-center justify-between">
        {editing ? (
          <>
            <button
              onClick={cancelEditing}
              className="rounded-full px-4 py-2 text-sm font-bold"
              style={{ background: "rgba(255,255,255,0.9)", border: "1.5px solid #E5D1C3", color: "#6B6059" }}
            >
              취소
            </button>
            <h1 className="text-base font-extrabold" style={{ color: theme.title }}>
              꾸미는 중
            </h1>
            <button
              onClick={saveEditing}
              disabled={saving}
              className="rounded-full px-4 py-2 text-sm font-extrabold disabled:opacity-60"
              style={{ background: "#C9856A", color: "#FFFCF8" }}
            >
              {saving ? "저장 중" : "저장"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push("/home")}
              className="flex h-11 w-11 items-center justify-center rounded-full text-lg transition-all active:scale-95"
              style={{
                background: "rgba(255,255,255,0.88)",
                border: "1.5px solid #E5D1C3",
                color: "#3D3530",
                boxShadow: "0 4px 12px rgba(61,53,48,0.05)",
              }}
              aria-label="뒤로가기"
            >
              ‹
            </button>
            <h1 className="text-lg font-extrabold" style={{ color: theme.title }}>
              해도리
            </h1>
            <button
              onClick={startEditing}
              className="flex h-11 items-center gap-1 rounded-full px-3 text-xs font-extrabold transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.88)", border: "1.5px solid #E5D1C3", color: "#6B6059" }}
              aria-label="방 꾸미기"
            >
              🪴 꾸미기
            </button>
          </>
        )}
      </div>

      {!editing && (
        <>
          {/* 우측 메뉴 */}
          <div className="absolute right-4 top-[92px] z-[60] flex flex-col items-center gap-4">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center gap-1 transition-all active:scale-95"
                style={{ background: "transparent", border: "none" }}
                aria-label={item.label}
              >
                <img src={item.image} alt="" className="h-14 w-14 object-contain drop-shadow-xl" />
                <span
                  className="whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                  style={{ background: "rgba(61,53,48,0.62)", color: "#FFF7EF" }}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* 말풍선 */}
          <div className="absolute left-[8%] top-[13%] z-[55] w-[62%] max-w-[260px]">
            <div
              className="relative whitespace-pre-line rounded-[28px] px-5 py-4 text-center text-sm font-extrabold leading-6"
              style={{
                background: "rgba(255,252,248,0.96)",
                color: "#3D3530",
                border: "1.5px solid #E5D1C3",
                boxShadow: "0 8px 20px rgba(61,53,48,0.09)",
              }}
            >
              {message}
              <div
                className="absolute -bottom-2 left-[70%] h-4 w-4"
                style={{
                  background: "rgba(255,252,248,0.96)",
                  borderRight: "1.5px solid #E5D1C3",
                  borderBottom: "1.5px solid #E5D1C3",
                  transform: "translateX(-50%) rotate(45deg)",
                }}
              />
            </div>
          </div>

          {/* 간식 먹은 효과: 해도리 머리 위로 떠오름 */}
          {feedEffect && (
            <div
              key={feedEffect.id}
              className="haedori-feed-pop pointer-events-none absolute bottom-[calc(12%+12rem)] left-1/2 z-[56] flex flex-col items-center gap-1"
            >
              {feedEffect.gained.map((g) => (
                <span
                  key={g.trait}
                  className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-extrabold shadow"
                  style={{ background: TRAIT_STYLE[g.trait].bg, color: TRAIT_STYLE[g.trait].color }}
                >
                  {g.emoji} {g.name} +{g.amount}
                </span>
              ))}
            </div>
          )}

          {/* 아래: 성격 카드 + 간식 주기 */}
          <div className="absolute bottom-4 left-4 right-4 z-[60] flex items-center gap-2">
            <button
              onClick={() => haedori && setCardOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-3.5 py-2.5 text-left transition-all active:scale-[0.98]"
              style={{
                background: "rgba(255,252,248,0.94)",
                border: "1.5px solid #E5D1C3",
                boxShadow: "0 4px 12px rgba(61,53,48,0.08)",
              }}
              aria-label="해도리 성격 보기"
            >
              <span className="text-xl">{haedori?.personality.type.emoji ?? "🦦"}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold" style={{ color: "#9A8F87" }}>
                  해도리 성격
                </span>
                <span className="block text-[13px] font-extrabold leading-tight" style={{ color: "#3D3530", wordBreak: "keep-all" }}>
                  {haedori?.personality.type.name ?? "불러오는 중"}
                </span>
              </span>
              <span className="text-sm" style={{ color: "#B8ACA3" }}>
                ›
              </span>
            </button>
            <button
              onClick={() => haedori && setFeedOpen(true)}
              className="flex h-[54px] flex-shrink-0 items-center gap-1 rounded-2xl px-4 text-sm font-extrabold transition-all active:scale-95"
              style={{ background: "#C9856A", color: "#FFFCF8", boxShadow: "0 4px 12px rgba(201,133,106,0.3)" }}
            >
              🍪 간식 주기
            </button>
          </div>
        </>
      )}

      {cardOpen && haedori && <PersonalityCardSheet state={haedori} onClose={() => setCardOpen(false)} />}
      {feedOpen && haedori && (
        <FeedSheet
          state={haedori}
          feedingKey={feedingKey}
          onFeed={feed}
          onGoShop={() => router.push("/shop?tab=food")}
          onClose={() => setFeedOpen(false)}
        />
      )}

      {/* 꾸미기 트레이 (접으면 바닥 아래쪽 소품도 옮길 수 있음) */}
      {editing && !trayOpen && (
        <button
          onClick={() => setTrayOpen(true)}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-full px-4 py-2 text-xs font-extrabold"
          style={{ background: "rgba(61,53,48,0.78)", color: "#FFF7EF", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
        >
          소품 목록 ▲
        </button>
      )}
      {editing && trayOpen && (
        <div
          className="absolute bottom-0 left-0 right-0 z-[70] rounded-t-3xl px-4 pb-6 pt-3"
          style={{ background: "rgba(255,252,248,0.97)", boxShadow: "0 -6px 24px rgba(61,53,48,0.12)" }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setTrayOpen(false)}
            className="mx-auto mb-1 flex w-full items-center justify-center py-1"
            aria-label="소품 목록 접기"
          >
            <span className="text-[10px] font-bold" style={{ color: "#B8ACA3" }}>
              접기 ▼
            </span>
          </button>
          {ownedItems.length === 0 ? (
            <div className="py-3 text-center">
              <p className="text-sm font-bold" style={{ color: "#6B6059" }}>
                아직 가진 소품이 없어요
              </p>
              <button
                onClick={() => router.push("/shop?tab=items")}
                className="mt-3 rounded-2xl px-4 py-2 text-xs font-extrabold"
                style={{ background: "#C9856A", color: "#FFFCF8" }}
              >
                소품 사러 가기
              </button>
            </div>
          ) : (
            <>
              <p className="mb-2 text-[11px]" style={{ color: "#9A8F87" }}>
                눌러서 놓고, 끌어서 옮겨요. 선택한 소품의 ✕로 치울 수 있어요.
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {ownedItems.map((item) => {
                  const placed = draft.some((p) => p.item_key === item.key)
                  return (
                    <button
                      key={item.key}
                      onClick={() => togglePlace(item.key)}
                      className="relative flex w-[72px] flex-shrink-0 flex-col items-center gap-1 rounded-2xl p-2"
                      style={{
                        background: placed ? "#F3EEE8" : "#FFFFFF",
                        border: selectedKey === item.key ? "2px solid #C9856A" : "1.5px solid #E5DDD5",
                      }}
                    >
                      <div className="flex h-11 w-11 items-center justify-center">
                        <RoomItemArt item={item} className="max-h-11 max-w-11" />
                      </div>
                      <span className="w-full truncate text-center text-[10px] font-bold" style={{ color: "#6B6059" }}>
                        {item.name}
                      </span>
                      {placed && (
                        <span
                          className="absolute right-1 top-1 rounded-full px-1 text-[9px] font-extrabold"
                          style={{ background: "#D4EACF", color: "#55724F" }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
