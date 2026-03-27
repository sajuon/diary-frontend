"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"

interface RoomEditProps {
  onEditModeChange?: (isEditing: boolean) => void
  purchases?: any[]
}

interface FurnitureItem {
  id: string
  label: string
  x: number
  y: number
  size: number
  emoji: string
}

type InventoryCategory =
  | "all"
  | "wallpaper"
  | "floor"
  | "furniture"
  | "food"
  | "deco"

type InventoryItem = {
  id: string
  backendId: number
  name: string
  category: InventoryCategory
  emoji: string
  ownedCount: number
  placeable: boolean
}

const ROOM_HEIGHT = 310
const EDIT_BAR_HEIGHT = 72
const INVENTORY_MIN_HEIGHT = 180
const INVENTORY_DEFAULT_HEIGHT = 180
const INVENTORY_MAX_HEIGHT = 560
const EDIT_LAYOUT_HEIGHT = ROOM_HEIGHT + EDIT_BAR_HEIGHT + INVENTORY_MIN_HEIGHT

const initialFurniture: FurnitureItem[] = [
  { id: "desk", label: "책상", x: 30, y: 55, size: 52, emoji: "🪑" },
  { id: "shelf", label: "선반", x: 68, y: 30, size: 44, emoji: "📚" },
  { id: "window", label: "창문", x: 50, y: 15, size: 40, emoji: "🪟" },
  { id: "plant", label: "식물", x: 82, y: 62, size: 36, emoji: "🪴" },
  { id: "lamp", label: "조명", x: 18, y: 30, size: 34, emoji: "💡" },
]

const inventoryMetaByBackendId: Record<
  number,
  Omit<InventoryItem, "ownedCount">
> = {
  1: { id: "fn1", backendId: 1, name: "원목 책상", category: "furniture", emoji: "🪑", placeable: true },
  2: { id: "fn2", backendId: 2, name: "빈백 소파", category: "furniture", emoji: "🛋️", placeable: true },
  3: { id: "fn3", backendId: 3, name: "별모양 램프", category: "furniture", emoji: "⭐", placeable: true },
  4: { id: "fn4", backendId: 4, name: "미니 책장", category: "furniture", emoji: "📚", placeable: true },
  5: { id: "fn5", backendId: 5, name: "둥근 침대", category: "furniture", emoji: "🛏️", placeable: true },
  6: { id: "fn6", backendId: 6, name: "창문 커튼", category: "furniture", emoji: "🪟", placeable: true },

  7: { id: "dc1", backendId: 7, name: "해달 인형", category: "deco", emoji: "🦦", placeable: true },
  8: { id: "dc2", backendId: 8, name: "미니 화분", category: "deco", emoji: "🌱", placeable: true },
  9: { id: "dc3", backendId: 9, name: "무지개 모빌", category: "deco", emoji: "🌈", placeable: true },
  10: { id: "dc4", backendId: 10, name: "달 거울", category: "deco", emoji: "🌙", placeable: true },
  11: { id: "dc5", backendId: 11, name: "리본 액자", category: "deco", emoji: "🎀", placeable: true },
  12: { id: "dc6", backendId: 12, name: "초 세트", category: "deco", emoji: "🕯️", placeable: true },

  13: { id: "fd1", backendId: 13, name: "딸기 케이크", category: "food", emoji: "🍓", placeable: false },
  14: { id: "fd2", backendId: 14, name: "마카롱 세트", category: "food", emoji: "🍬", placeable: false },
  15: { id: "fd3", backendId: 15, name: "버블티", category: "food", emoji: "🧋", placeable: false },
  16: { id: "fd4", backendId: 16, name: "귤 바구니", category: "food", emoji: "🍊", placeable: false },
  17: { id: "fd5", backendId: 17, name: "꿀단지", category: "food", emoji: "🍯", placeable: false },
  18: { id: "fd6", backendId: 18, name: "쿠키 상자", category: "food", emoji: "🍪", placeable: false },
}

const inventoryCategories: { id: InventoryCategory; label: string; icon: string }[] = [
  { id: "all", label: "전체", icon: "✨" },
  { id: "furniture", label: "가구", icon: "🛋️" },
  { id: "food", label: "간식", icon: "🍰" },
  { id: "deco", label: "소품", icon: "🪴" },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function buildInventoryFromPurchases(purchases: any[] = []): InventoryItem[] {
  const countMap = new Map<number, number>()

  for (const purchase of purchases) {
    const rawId = purchase?.item_id ?? purchase?.item?.id
    const backendId = Number(rawId)

    if (!backendId || !inventoryMetaByBackendId[backendId]) continue
    countMap.set(backendId, (countMap.get(backendId) ?? 0) + 1)
  }

  return Array.from(countMap.entries())
    .map(([backendId, ownedCount]) => {
      const meta = inventoryMetaByBackendId[backendId]
      return {
        ...meta,
        ownedCount,
      }
    })
    .sort((a, b) => a.backendId - b.backendId)
}

export default function RoomEdit({
  onEditModeChange,
  purchases = [],
}: RoomEditProps) {
  const [editMode, setEditMode] = useState(false)
  const [furniture, setFurniture] = useState<FurnitureItem[]>(initialFurniture)
  const [savedFurniture, setSavedFurniture] = useState<FurnitureItem[]>(initialFurniture)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [selectedInventoryCategory, setSelectedInventoryCategory] =
    useState<InventoryCategory>("all")
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null)
  const [inventoryHeight, setInventoryHeight] = useState(INVENTORY_DEFAULT_HEIGHT)
  const [isInventoryResizing, setIsInventoryResizing] = useState(false)

  const roomRef = useRef<HTMLDivElement>(null)

  const inventoryResizeRef = useRef<{
    startY: number
    startHeight: number
  } | null>(null)

  const draggingRef = useRef<{
    id: string
    offsetX: number
    offsetY: number
  } | null>(null)

  const inventoryItems = useMemo(() => {
    return buildInventoryFromPurchases(purchases)
  }, [purchases])

  useEffect(() => {
    onEditModeChange?.(editMode)
  }, [editMode, onEditModeChange])

  useEffect(() => {
    if (!editMode) {
      setInventoryHeight(INVENTORY_DEFAULT_HEIGHT)
      setIsInventoryResizing(false)
      inventoryResizeRef.current = null
    }
  }, [editMode])

  useEffect(() => {
    if (
      selectedInventoryId &&
      !inventoryItems.some((item) => item.id === selectedInventoryId)
    ) {
      setSelectedInventoryId(null)
    }
  }, [inventoryItems, selectedInventoryId])

  const filteredInventory = useMemo(() => {
    if (selectedInventoryCategory === "all") return inventoryItems
    return inventoryItems.filter((item) => item.category === selectedInventoryCategory)
  }, [inventoryItems, selectedInventoryCategory])

  const selectedInventoryItem =
    inventoryItems.find((item) => item.id === selectedInventoryId) ?? null

  const isSelectedItemPlaceable = !!selectedInventoryItem?.placeable

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (!editMode || isInventoryResizing) return

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
    if (inventoryResizeRef.current) {
      const deltaY = inventoryResizeRef.current.startY - e.clientY
      const nextHeight = clamp(
        inventoryResizeRef.current.startHeight + deltaY,
        INVENTORY_MIN_HEIGHT,
        INVENTORY_MAX_HEIGHT
      )
      setInventoryHeight(nextHeight)
      return
    }

    if (!draggingRef.current || !roomRef.current) return

    const rect = roomRef.current.getBoundingClientRect()
    const newX =
      ((e.clientX - rect.left - draggingRef.current.offsetX) / rect.width) * 100
    const newY =
      ((e.clientY - rect.top - draggingRef.current.offsetY) / rect.height) * 100

    setFurniture((prev) =>
      prev.map((f) =>
        f.id === draggingRef.current!.id
          ? {
              ...f,
              x: Math.min(90, Math.max(5, newX)),
              y: Math.min(85, Math.max(5, newY)),
            }
          : f
      )
    )
  }

  const handlePointerUp = () => {
    draggingRef.current = null
    inventoryResizeRef.current = null
    setIsInventoryResizing(false)
  }

  const handleInventoryResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    inventoryResizeRef.current = {
      startY: e.clientY,
      startHeight: inventoryHeight,
    }

    setIsInventoryResizing(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handleSave = () => {
    setSavedFurniture([...furniture])
    setEditMode(false)
    setSelectedId(null)
    setSelectedInventoryId(null)
    setSelectedInventoryCategory("all")
    setInventoryHeight(INVENTORY_DEFAULT_HEIGHT)
  }

  const handleCancel = () => {
    setFurniture([...savedFurniture])
    setEditMode(false)
    setSelectedId(null)
    setSelectedInventoryId(null)
    setSelectedInventoryCategory("all")
    setInventoryHeight(INVENTORY_DEFAULT_HEIGHT)
  }

  return (
    <>
      <div
        className="relative w-full rounded-3xl overflow-hidden"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          height: editMode ? `${EDIT_LAYOUT_HEIGHT}px` : `${ROOM_HEIGHT}px`,
          background: "#E8E2D8",
          boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
          transition: isInventoryResizing ? "none" : "height 0.2s ease",
        }}
      >
        <div
          className="relative w-full overflow-hidden"
          style={{ height: `${ROOM_HEIGHT}px` }}
        >
          <Image
            src="/images/haedori-room.jpg"
            alt="해도리의 방"
            fill
            className="object-cover"
          />

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

          <div ref={roomRef} className="absolute inset-0">
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
                    className="relative rounded-2xl flex items-center justify-center text-2xl transition-all"
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
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#FFFCF8"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
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
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C9856A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              편집
            </button>
          )}
        </div>

        {editMode && (
          <>
            <div
              className="absolute left-0 right-0 z-20 px-5 py-3.5"
              style={{
                top: `${ROOM_HEIGHT}px`,
                height: `${EDIT_BAR_HEIGHT}px`,
                background: "rgba(248,246,242,0.96)",
                backdropFilter: "blur(10px)",
                borderTop: "1.5px solid #E5DDD5",
              }}
            >
              <div className="flex items-center justify-between">
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
            </div>

            <div
              className="absolute left-0 right-0 bottom-0 z-30 rounded-t-[28px] overflow-hidden"
              style={{
                height: `${inventoryHeight}px`,
                background: "linear-gradient(180deg, #E8DDD1 0%, #DDD0C3 100%)",
                borderTop: "1.5px solid rgba(201,133,106,0.18)",
                boxShadow: "0 -8px 24px rgba(61,53,48,0.12)",
                transition: isInventoryResizing ? "none" : "height 0.14s ease",
                touchAction: "none",
                animation: "inventoryRise 0.3s cubic-bezier(0.34,1.3,0.64,1)",
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-9 flex justify-center items-center cursor-row-resize"
                onPointerDown={handleInventoryResizeStart}
                style={{ touchAction: "none" }}
              >
                <div
                  className="w-10 h-1 rounded-full"
                  style={{
                    background: isInventoryResizing
                      ? "rgba(201,133,106,0.55)"
                      : "rgba(154,143,135,0.38)",
                  }}
                />
              </div>

              <div className="h-full flex flex-col px-4 pt-3 pb-4">
                <div className="pt-7 flex items-center justify-between mb-3 px-1 flex-shrink-0">
                  <div>
                    <p className="text-sm font-extrabold" style={{ color: "#3D3530" }}>
                      보관함
                    </p>
                    <p className="text-[11px]" style={{ color: "#8D8077" }}>
                      구매한 아이템을 여기서 확인할 수 있어요
                    </p>
                  </div>

                  <div
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold"
                    style={{
                      background: "rgba(255,252,248,0.8)",
                      color: "#7E7068",
                      border: "1px solid rgba(229,221,213,0.9)",
                    }}
                  >
                    총 {inventoryItems.length}개
                  </div>
                </div>

                <div
                  className="flex gap-2 overflow-x-auto pb-2 no-scrollbar flex-shrink-0"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {inventoryCategories.map((category) => {
                    const isActive = selectedInventoryCategory === category.id

                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedInventoryCategory(category.id)}
                        className="flex-shrink-0 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95"
                        style={{
                          background: isActive
                            ? "#FFFCF8"
                            : "rgba(255,252,248,0.42)",
                          color: isActive ? "#3D3530" : "#7E7068",
                          border: isActive
                            ? "1.5px solid #C9856A55"
                            : "1.5px solid rgba(229,221,213,0.75)",
                          boxShadow: isActive
                            ? "0 4px 10px rgba(201,133,106,0.1)"
                            : "none",
                        }}
                      >
                        <span className="mr-1">{category.icon}</span>
                        {category.label}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-3 min-h-0 flex-1 overflow-y-auto no-scrollbar pr-0.5">
                  <div
                    className="p-2 rounded-[24px]"
                    style={{
                      background: "rgba(74,63,58,0.12)",
                      border: "1px solid rgba(255,252,248,0.24)",
                    }}
                  >
                    {filteredInventory.length === 0 ? (
                      <div
                        className="w-full py-10 rounded-[18px] text-center"
                        style={{
                          background: "rgba(255,252,248,0.86)",
                          border: "1px solid rgba(229,221,213,0.95)",
                        }}
                      >
                        <p className="text-sm font-bold" style={{ color: "#3D3530" }}>
                          아직 보관함에 아이템이 없어요
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#8D8077" }}>
                          상점에서 아이템을 구매하면 여기에 쌓여요
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2.5">
                        {filteredInventory.map((item) => {
                          const isSelected = selectedInventoryId === item.id

                          return (
                            <button
                              key={item.id}
                              onClick={() => setSelectedInventoryId(item.id)}
                              className="relative aspect-square rounded-[18px] p-2 transition-all active:scale-95"
                              style={{
                                background: isSelected
                                  ? "linear-gradient(180deg, #FFF8F2 0%, #F8E7DA 100%)"
                                  : "linear-gradient(180deg, #FFFDFC 0%, #F5EEE7 100%)",
                                border: isSelected
                                  ? "1.8px solid #C9856A"
                                  : "1.4px solid #E5DDD5",
                                boxShadow: isSelected
                                  ? "0 6px 16px rgba(201,133,106,0.18)"
                                  : "0 2px 8px rgba(0,0,0,0.04)",
                              }}
                            >
                              <div className="absolute top-1.5 right-1.5">
                                <div
                                  className="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-extrabold flex items-center justify-center"
                                  style={{
                                    background: isSelected ? "#C9856A" : "#EDE8E0",
                                    color: isSelected ? "#FFFCF8" : "#7E7068",
                                  }}
                                >
                                  {item.ownedCount}
                                </div>
                              </div>

                              <div className="h-full flex flex-col items-center justify-center">
                                <div
                                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl mb-2"
                                  style={{
                                    background: isSelected
                                      ? "rgba(201,133,106,0.12)"
                                      : "rgba(237,232,224,0.9)",
                                  }}
                                >
                                  {item.emoji}
                                </div>

                                <p
                                  className="text-[11px] leading-tight font-bold text-center break-keep"
                                  style={{ color: "#3D3530" }}
                                >
                                  {item.name}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div
                    className="mt-3 px-3 py-2.5 rounded-2xl flex items-center justify-between"
                    style={{
                      background: "rgba(255,252,248,0.7)",
                      border: "1px solid rgba(229,221,213,0.9)",
                    }}
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold" style={{ color: "#9A8F87" }}>
                        선택한 아이템
                      </p>
                      <p
                        className="text-sm font-extrabold truncate"
                        style={{ color: "#3D3530" }}
                      >
                        {selectedInventoryItem
                          ? `${selectedInventoryItem.emoji} ${selectedInventoryItem.name}`
                          : "아직 선택된 아이템이 없어요"}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!selectedInventoryItem || !isSelectedItemPlaceable}
                      className="ml-3 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background:
                          !selectedInventoryItem
                            ? "rgba(196,184,176,0.8)"
                            : isSelectedItemPlaceable
                              ? "#C9856A"
                              : "#B9AEA6",
                        color: "#FFFCF8",
                        opacity: selectedInventoryItem ? 1 : 0.72,
                        cursor:
                          selectedInventoryItem && isSelectedItemPlaceable
                            ? "pointer"
                            : "default",
                      }}
                    >
                      {!selectedInventoryItem
                        ? "배치 연결 예정"
                        : isSelectedItemPlaceable
                          ? "배치 연결 예정"
                          : "배치 불가"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes inventoryRise {
          from {
            transform: translateY(24px);
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
    </>
  )
}