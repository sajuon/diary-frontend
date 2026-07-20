//변환 끝
// diary-frontend/components/room-edit.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import {
  ROOM_SIZES,
  clampGridPosition,
  floorCellToPoint,
  getCellFootprintQuad,
  inferWallDirectionByColumn,
  isGridRectOverlapping,
  loadRoomLayout,
  type Point,
  type RoomLayout,
  type RoomSize,
} from "@/data/roomLayout"
import {
  furnitureMeta,
  getFurnitureImageUrl,
  type FurnitureDirection,
  type FurnitureKey,
} from "@/data/furnitureMeta"

interface RoomEditProps {
  onEditModeChange?: (isEditing: boolean) => void
  purchases?: any[]
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
  furnitureKey?: FurnitureKey
}

type PlacedFurnitureItem = {
  id: string
  furnitureKey: FurnitureKey
  label: string
  col: number
  row: number
  colSpan: number
  rowSpan: number
  direction: FurnitureDirection
  scale: number
}

const ROOM_HEIGHT = 310
const EDIT_BAR_HEIGHT = 72
const INVENTORY_MIN_HEIGHT = 180
const INVENTORY_DEFAULT_HEIGHT = 180
const INVENTORY_MAX_HEIGHT = 560
const EDIT_LAYOUT_HEIGHT = ROOM_HEIGHT + EDIT_BAR_HEIGHT + INVENTORY_MIN_HEIGHT

const inventoryMetaByBackendId: Record<
  number,
  Omit<InventoryItem, "ownedCount">
> = {
  1: {
    id: "fn1",
    backendId: 1,
    name: "원목 책상",
    category: "furniture",
    emoji: "🪑",
    placeable: true,
    furnitureKey: "accentChair",
  },
  2: {
    id: "fn2",
    backendId: 2,
    name: "빈백 소파",
    category: "furniture",
    emoji: "🛋️",
    placeable: true,
    furnitureKey: "sofa",
  },
  3: {
    id: "fn3",
    backendId: 3,
    name: "별모양 램프",
    category: "furniture",
    emoji: "⭐",
    placeable: true,
    furnitureKey: "accentChair",
  },
  4: {
    id: "fn4",
    backendId: 4,
    name: "미니 책장",
    category: "furniture",
    emoji: "📚",
    placeable: true,
    furnitureKey: "bookshelf",
  },
  5: {
    id: "fn5",
    backendId: 5,
    name: "둥근 침대",
    category: "furniture",
    emoji: "🛏️",
    placeable: true,
    furnitureKey: "bed",
  },
  6: {
    id: "fn6",
    backendId: 6,
    name: "창문 커튼",
    category: "furniture",
    emoji: "🪟",
    placeable: false,
  },

  7: {
    id: "dc1",
    backendId: 7,
    name: "해달 인형",
    category: "deco",
    emoji: "🦦",
    placeable: false,
  },
  8: {
    id: "dc2",
    backendId: 8,
    name: "미니 화분",
    category: "deco",
    emoji: "🌱",
    placeable: false,
  },
  9: {
    id: "dc3",
    backendId: 9,
    name: "무지개 모빌",
    category: "deco",
    emoji: "🌈",
    placeable: false,
  },
  10: {
    id: "dc4",
    backendId: 10,
    name: "달 거울",
    category: "deco",
    emoji: "🌙",
    placeable: false,
  },
  11: {
    id: "dc5",
    backendId: 11,
    name: "리본 액자",
    category: "deco",
    emoji: "🎀",
    placeable: false,
  },
  12: {
    id: "dc6",
    backendId: 12,
    name: "초 세트",
    category: "deco",
    emoji: "🕯️",
    placeable: false,
  },

  13: {
    id: "fd1",
    backendId: 13,
    name: "딸기 케이크",
    category: "food",
    emoji: "🍓",
    placeable: false,
  },
  14: {
    id: "fd2",
    backendId: 14,
    name: "마카롱 세트",
    category: "food",
    emoji: "🍬",
    placeable: false,
  },
  15: {
    id: "fd3",
    backendId: 15,
    name: "버블티",
    category: "food",
    emoji: "🧋",
    placeable: false,
  },
  16: {
    id: "fd4",
    backendId: 16,
    name: "귤 바구니",
    category: "food",
    emoji: "🍊",
    placeable: false,
  },
  17: {
    id: "fd5",
    backendId: 17,
    name: "꿀단지",
    category: "food",
    emoji: "🍯",
    placeable: false,
  },
  18: {
    id: "fd6",
    backendId: 18,
    name: "쿠키 상자",
    category: "food",
    emoji: "🍪",
    placeable: false,
  },
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

function getEffectiveSpan(key: FurnitureKey) {
  const meta = furnitureMeta[key]
  return {
    colSpan: meta.gridW,
    rowSpan: meta.gridH,
  }
}

function getDefaultPlacedItems(): PlacedFurnitureItem[] {
  const chairMeta = furnitureMeta.accentChair
  const chairSpan = getEffectiveSpan("accentChair")

  return [
    {
      id: "placed-1",
      furnitureKey: "accentChair",
      label: chairMeta.label,
      col: 0,
      row: 0,
      colSpan: chairSpan.colSpan,
      rowSpan: chairSpan.rowSpan,
      direction: "right",
      scale: chairMeta.defaultScale,
    },
  ]
}

function getPointerPositionInElement(
  clientX: number,
  clientY: number,
  element: HTMLElement,
) {
  const rect = element.getBoundingClientRect()
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
    width: rect.width,
    height: rect.height,
  }
}

function canPlaceItem(
  nextItem: PlacedFurnitureItem,
  placed: PlacedFurnitureItem[],
  ignoreId?: string,
) {
  return !placed.some((item) => {
    if (item.id === ignoreId) return false

    return isGridRectOverlapping(
      {
        col: nextItem.col,
        row: nextItem.row,
        colSpan: nextItem.colSpan,
        rowSpan: nextItem.rowSpan,
      },
      {
        col: item.col,
        row: item.row,
        colSpan: item.colSpan,
        rowSpan: item.rowSpan,
      },
    )
  })
}

function togglePlacedFurnitureDirection(
  layout: RoomLayout,
  item: PlacedFurnitureItem,
): PlacedFurnitureItem {
  const meta = furnitureMeta[item.furnitureKey]

  if (!meta.directions.includes("left")) {
    return item
  }

  if (meta.wallAttachable) {
    const nextDirection = item.direction === "right" ? "left" : "right"
    const nextCol =
      nextDirection === "left"
        ? 0
        : layout.placement.cols - item.colSpan

    return {
      ...item,
      direction: nextDirection,
      col: nextCol,
    }
  }

  return {
    ...item,
    direction: item.direction === "right" ? "left" : "right",
  }
}

function getAllowedGridPosition(
  layout: RoomLayout,
  item: PlacedFurnitureItem,
  col: number,
  row: number,
) {
  const base = clampGridPosition(layout, col, row, item.colSpan, item.rowSpan)
  const meta = furnitureMeta[item.furnitureKey]

  if (meta.wallAttachable) {
    const fixedDirection =
      item.direction ?? inferWallDirectionByColumn(layout, base.col, item.colSpan)

    if (fixedDirection === "left") {
      return {
        col: 0,
        row: clamp(base.row, 0, layout.placement.rows - item.rowSpan),
      }
    }

    return {
      col: layout.placement.cols - item.colSpan,
      row: clamp(base.row, 0, layout.placement.rows - item.rowSpan),
    }
  }

  return {
    col: base.col,
    row: clamp(base.row, 0, layout.placement.rows - item.rowSpan),
  }
}

function getSpriteAnchor(item: PlacedFurnitureItem) {
  const meta = furnitureMeta[item.furnitureKey]
  const baseX = meta.spriteAnchorXRatio ?? 0.5
  const baseY = meta.spriteAnchorYRatio ?? 1

  if (item.furnitureKey === "accentChair") {
    if (item.direction === "left") {
      return {
        x: 0.66,
        y: 0.73,
      }
    }

    return {
      x: 0.34,
      y: 0.73,
    }
  }

  return {
    x: item.direction === "left" ? 1 - baseX : baseX,
    y: baseY,
  }
}

function getVisualSize(item: PlacedFurnitureItem, layout: RoomLayout) {
  const quad = getCellFootprintQuad(
    layout,
    item.col,
    item.row,
    item.colSpan,
    item.rowSpan,
  )

  const backLeft = quad[0]
  const backRight = quad[1]
  const frontRight = quad[2]
  const frontLeft = quad[3]

  const bottomWidth = distance(frontLeft, frontRight)
  const leftDepth = distance(backLeft, frontLeft)
  const rightDepth = distance(backRight, frontRight)
  const avgDepth = (leftDepth + rightDepth) / 2

  if (item.furnitureKey === "accentChair") {
    return {
      width: Math.max(34, bottomWidth * 0.78 * item.scale),
      height: Math.max(62, avgDepth * 1.58 * item.scale),
    }
  }

  if (item.furnitureKey === "sofa") {
    return {
      width: Math.max(54, bottomWidth * 1.02 * item.scale),
      height: Math.max(76, avgDepth * 2.0 * item.scale),
    }
  }

  if (item.furnitureKey === "bed") {
    return {
      width: Math.max(74, bottomWidth * 1.04 * item.scale),
      height: Math.max(92, avgDepth * 1.9 * item.scale),
    }
  }

  if (item.furnitureKey === "bookshelf") {
    return {
      width: Math.max(44, bottomWidth * 0.92 * item.scale),
      height: Math.max(120, avgDepth * 3.2 * item.scale),
    }
  }

  return {
    width: Math.max(40, bottomWidth * 0.95 * item.scale),
    height: Math.max(80, avgDepth * 2.2 * item.scale),
  }
}

function getFootprintAnchorPoint(
  layout: RoomLayout,
  item: PlacedFurnitureItem,
): Point {
  const meta = furnitureMeta[item.furnitureKey]

  if (meta.wallAttachable) {
    return floorCellToPoint(
      layout,
      item.col,
      item.row,
      item.direction === "left" ? 0 : 1,
      1,
      item.colSpan,
      item.rowSpan,
    )
  }

  if (item.furnitureKey === "accentChair") {
    return floorCellToPoint(layout, item.col, item.row, 0, 0, item.colSpan, item.rowSpan)
  }

  let anchorU =
    item.direction === "left"
      ? 1 - (meta.anchorU ?? 0.5)
      : (meta.anchorU ?? 0.5)

  const anchorV = meta.anchorV ?? 1

  return floorCellToPoint(
    layout,
    item.col,
    item.row,
    anchorU,
    anchorV,
    item.colSpan,
    item.rowSpan,
  )
}

function getPlacementReferencePoint(
  layout: RoomLayout,
  item: PlacedFurnitureItem,
): Point {
  const meta = furnitureMeta[item.furnitureKey]

  if (meta.wallAttachable) {
    return floorCellToPoint(
      layout,
      item.col,
      item.row,
      item.direction === "left" ? 0 : 1,
      0,
      item.colSpan,
      item.rowSpan,
    )
  }

  if (item.furnitureKey === "accentChair") {
    return floorCellToPoint(layout, item.col, item.row, 0, 0, item.colSpan, item.rowSpan)
  }

  return floorCellToPoint(layout, item.col, item.row, 0.5, 0.5, item.colSpan, item.rowSpan)
}

function getPlacementReferencePointForCell(
  layout: RoomLayout,
  item: PlacedFurnitureItem,
  col: number,
  row: number,
): Point {
  const meta = furnitureMeta[item.furnitureKey]

  if (meta.wallAttachable) {
    return floorCellToPoint(
      layout,
      col,
      row,
      item.direction === "left" ? 0 : 1,
      0,
      item.colSpan,
      item.rowSpan,
    )
  }

  if (item.furnitureKey === "accentChair") {
    return floorCellToPoint(layout, col, row, 0, 0, item.colSpan, item.rowSpan)
  }

  return floorCellToPoint(layout, col, row, 0.5, 0.5, item.colSpan, item.rowSpan)
}

function pickNearestCell(
  layout: RoomLayout,
  x: number,
  y: number,
  item: PlacedFurnitureItem,
) {
  let best: { col: number; row: number; distance: number } | null = null

  for (let row = 0; row <= layout.placement.rows - item.rowSpan; row += 1) {
    for (let col = 0; col <= layout.placement.cols - item.colSpan; col += 1) {
      const point = getPlacementReferencePointForCell(layout, item, col, row)
      const dx = point.x - x
      const dy = point.y - y
      const distance = dx * dx + dy * dy

      if (!best || distance < best.distance) {
        best = { col, row, distance }
      }
    }
  }

  return best
}

function getFloorBounds(layout: RoomLayout) {
  const quad = getCellFootprintQuad(
    layout,
    0,
    0,
    layout.placement.cols,
    layout.placement.rows,
  )

  const xs = quad.map((point) => point.x)
  const ys = quad.map((point) => point.y)

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  }
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export default function RoomEdit({
  onEditModeChange,
  purchases = [],
}: RoomEditProps) {
  const [editMode, setEditMode] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [roomSize, setRoomSize] = useState<RoomSize>("M")
  const [roomLayout, setRoomLayout] = useState<RoomLayout | null>(null)

  const [furniture, setFurniture] = useState<PlacedFurnitureItem[]>(
    getDefaultPlacedItems(),
  )
  const [savedFurniture, setSavedFurniture] = useState<PlacedFurnitureItem[]>(
    getDefaultPlacedItems(),
  )

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

  const filteredInventory = useMemo(() => {
    if (selectedInventoryCategory === "all") return inventoryItems
    return inventoryItems.filter((item) => item.category === selectedInventoryCategory)
  }, [inventoryItems, selectedInventoryCategory])

  const selectedInventoryItem =
    inventoryItems.find((item) => item.id === selectedInventoryId) ?? null

  const isSelectedItemPlaceable =
    !!selectedInventoryItem?.placeable && !!selectedInventoryItem?.furnitureKey

  const selectedPlacedFurniture =
    furniture.find((item) => item.id === selectedId) ?? null

  const selectedPlacedFurnitureMeta =
    selectedPlacedFurniture ? furnitureMeta[selectedPlacedFurniture.furnitureKey] : null

  useEffect(() => {
    onEditModeChange?.(editMode)
  }, [editMode, onEditModeChange])

  useEffect(() => {
    let mounted = true

    loadRoomLayout(roomSize)
      .then((layout) => {
        if (!mounted) return
        setRoomLayout(layout)
      })
      .catch((error) => {
        console.error("room layout load error", error)
      })

    return () => {
      mounted = false
    }
  }, [roomSize])

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

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (!editMode || isInventoryResizing || !roomLayout || !roomRef.current) return

    e.preventDefault()
    setSelectedId(id)

    const targetItem = furniture.find((item) => item.id === id)
    if (!targetItem) return

    const pointer = getPointerPositionInElement(e.clientX, e.clientY, roomRef.current)
    const sceneX = (pointer.x / pointer.width) * roomLayout.renderWidth
    const sceneY = (pointer.y / pointer.height) * roomLayout.renderHeight
    const placementPoint = getPlacementReferencePoint(roomLayout, targetItem)

    draggingRef.current = {
      id,
      offsetX: sceneX - placementPoint.x,
      offsetY: sceneY - placementPoint.y,
    }

    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (inventoryResizeRef.current) {
      const deltaY = inventoryResizeRef.current.startY - e.clientY
      const nextHeight = clamp(
        inventoryResizeRef.current.startHeight + deltaY,
        INVENTORY_MIN_HEIGHT,
        INVENTORY_MAX_HEIGHT,
      )
      setInventoryHeight(nextHeight)
      return
    }

    if (!draggingRef.current || !roomRef.current || !roomLayout) return

    const pointer = getPointerPositionInElement(e.clientX, e.clientY, roomRef.current)
    const sceneX = (pointer.x / pointer.width) * roomLayout.renderWidth
    const sceneY = (pointer.y / pointer.height) * roomLayout.renderHeight

    const targetItem = furniture.find((item) => item.id === draggingRef.current?.id)
    if (!targetItem) return

    const refX = sceneX - draggingRef.current.offsetX
    const refY = sceneY - draggingRef.current.offsetY

    const nearest = pickNearestCell(roomLayout, refX, refY, targetItem)
    if (!nearest) return

    const allowed = getAllowedGridPosition(
      roomLayout,
      targetItem,
      nearest.col,
      nearest.row,
    )

    const nextDirection = furnitureMeta[targetItem.furnitureKey].wallAttachable
      ? inferWallDirectionByColumn(roomLayout, allowed.col, targetItem.colSpan)
      : targetItem.direction

    const nextItem: PlacedFurnitureItem = {
      ...targetItem,
      col: allowed.col,
      row: allowed.row,
      direction: nextDirection,
    }

    if (!canPlaceItem(nextItem, furniture, targetItem.id)) return

    setFurniture((prev) =>
      prev.map((item) => (item.id === targetItem.id ? nextItem : item)),
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

  const handlePlaceSelectedInventory = () => {
    if (!selectedInventoryItem?.furnitureKey || !roomLayout) return

    const meta = furnitureMeta[selectedInventoryItem.furnitureKey]
    const span = getEffectiveSpan(selectedInventoryItem.furnitureKey)

    const defaultCol = 0
    const defaultRow = 0

    const initialDirection = meta.wallAttachable
      ? inferWallDirectionByColumn(roomLayout, defaultCol, span.colSpan)
      : meta.directions.includes("left")
        ? "left"
        : "right"

    const newItemBase: PlacedFurnitureItem = {
      id: `placed-${Date.now()}`,
      furnitureKey: selectedInventoryItem.furnitureKey,
      label: meta.label,
      col: defaultCol,
      row: defaultRow,
      colSpan: span.colSpan,
      rowSpan: span.rowSpan,
      direction: initialDirection,
      scale: meta.defaultScale,
    }

    const allowed = getAllowedGridPosition(
      roomLayout,
      newItemBase,
      newItemBase.col,
      newItemBase.row,
    )

    const newItem: PlacedFurnitureItem = {
      ...newItemBase,
      col: allowed.col,
      row: allowed.row,
    }

    if (!canPlaceItem(newItem, furniture)) {
      alert("해당 위치에 이미 다른 가구가 있어요.")
      return
    }

    setFurniture((prev) => [...prev, newItem])
    setSelectedId(newItem.id)
  }

  const handleDeleteSelected = () => {
    if (!selectedId) return
    setFurniture((prev) => prev.filter((item) => item.id !== selectedId))
    setSelectedId(null)
  }

  const handleRotateSelected = () => {
    if (!selectedId || !roomLayout) return

    const target = furniture.find((item) => item.id === selectedId)
    if (!target) return

    const toggled = togglePlacedFurnitureDirection(roomLayout, target)
    const allowed = getAllowedGridPosition(
      roomLayout,
      toggled,
      toggled.col,
      toggled.row,
    )

    const rotatedItem: PlacedFurnitureItem = {
      ...toggled,
      col: allowed.col,
      row: allowed.row,
    }

    if (!canPlaceItem(rotatedItem, furniture, target.id)) {
      alert("방향을 바꾸면 다른 가구와 겹쳐요.")
      return
    }

    setFurniture((prev) =>
      prev.map((item) => (item.id === selectedId ? rotatedItem : item)),
    )
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
          {roomLayout ? (
            <>
              <Image
                src={roomLayout.floorBaseUrl}
                alt="floor"
                fill
                className="pointer-events-none"
                style={{ objectFit: "fill" }}
                priority
              />
              {editMode && (
                <Image
                  src={roomLayout.gridOverlayUrl}
                  alt="room grid"
                  fill
                  className="pointer-events-none"
                  style={{ objectFit: "fill" }}
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 bg-[#F4EEE8]" />
          )}

          {roomLayout && (
            <Image
              src={roomLayout.wallShellUrl}
              alt="walls"
              fill
              className="pointer-events-none"
              style={{ objectFit: "fill", zIndex: 6 }}
            />
          )}

          <div ref={roomRef} className="absolute inset-0" style={{ zIndex: 20 }}>
            {roomLayout &&
              furniture.map((item) => {
                const imageUrl = getFurnitureImageUrl(item.furnitureKey, item.direction)
                const rendered = getVisualSize(item, roomLayout)
                const spriteAnchor = getSpriteAnchor(item)
                const footprintPoint = getFootprintAnchorPoint(roomLayout, item)
                const floorBounds = getFloorBounds(roomLayout)

                let left = footprintPoint.x - rendered.width * spriteAnchor.x
                let top = footprintPoint.y - rendered.height * spriteAnchor.y

                left = clamp(left, floorBounds.minX - rendered.width * 0.2, floorBounds.maxX - rendered.width * 0.8)
                top = Math.min(top, floorBounds.maxY - rendered.height * 0.28)

                return (
                  <div
                    key={item.id}
                    onPointerDown={(e) => handlePointerDown(e, item.id)}
                    className={`absolute select-none ${
                      editMode ? "cursor-grab active:cursor-grabbing" : ""
                    }`}
                    style={{
                      left: `${(left / roomLayout.renderWidth) * 100}%`,
                      top: `${(top / roomLayout.renderHeight) * 100}%`,
                      width: rendered.width,
                      height: rendered.height,
                      zIndex: selectedId === item.id ? 50 : 40 + item.row + item.rowSpan,
                    }}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={imageUrl}
                        alt={item.label}
                        fill
                        className="object-contain pointer-events-none"
                        sizes="160px"
                      />
                    </div>
                  </div>
                )
              })}
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
                zIndex: 60,
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
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-semibold" style={{ color: "#9A8F87" }}>
                    가구를 드래그해 배치하세요
                  </p>

                  <div className="flex items-center gap-1.5">
                    {ROOM_SIZES.map((size) => {
                      const active = roomSize === size
                      return (
                        <button
                          key={size}
                          onClick={() => setRoomSize(size)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                          style={{
                            background: active ? "#C9856A" : "#EDE8E0",
                            color: active ? "#FFFCF8" : "#3D3530",
                          }}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                  <button
                    onClick={handleRotateSelected}
                    disabled={
                      !selectedPlacedFurniture ||
                      !selectedPlacedFurnitureMeta ||
                      !selectedPlacedFurnitureMeta.directions.includes("left")
                    }
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                    style={{
                      background:
                        selectedPlacedFurniture &&
                        selectedPlacedFurnitureMeta &&
                        selectedPlacedFurnitureMeta.directions.includes("left")
                          ? "#8C7CF0"
                          : "#D8D0C8",
                      color: "#FFFCF8",
                      opacity:
                        selectedPlacedFurniture &&
                        selectedPlacedFurnitureMeta &&
                        selectedPlacedFurnitureMeta.directions.includes("left")
                          ? 1
                          : 0.6,
                    }}
                  >
                    방향 전환
                  </button>

                  <button
                    onClick={handleDeleteSelected}
                    disabled={!selectedId}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                    style={{
                      background: selectedId ? "#D96C6C" : "#D8D0C8",
                      color: "#FFFCF8",
                      opacity: selectedId ? 1 : 0.6,
                    }}
                  >
                    삭제
                  </button>

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
                    className="mt-3 px-3 py-2.5 rounded-2xl flex items-center justify-between gap-3"
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
                      onClick={handlePlaceSelectedInventory}
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
                          ? "방에 놓기"
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