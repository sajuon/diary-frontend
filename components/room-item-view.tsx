"use client"

import type { PointerEvent as ReactPointerEvent } from "react"
import { ROOM_ITEM_ART } from "@/components/room-item-art"
import type { Placement, RoomItemDef } from "@/lib/room-items"
import { placedWidth, zIndexFor } from "@/lib/room-items"

/** 소품 그림만 (상점 미리보기·꾸미기 트레이에서도 사용) */
export function RoomItemArt({ item, className }: { item: RoomItemDef; className?: string }) {
  if (item.image) {
    return <img src={item.image} alt={item.name} className={className} draggable={false} />
  }
  const art = ROOM_ITEM_ART[item.key]
  if (!art) return null
  const [w, h] = art.viewBox
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} role="img" aria-label={item.name}>
      {art.svg}
    </svg>
  )
}

// 크기 조절 점 4개. 어느 점을 끌어도 소품 가운데 기준으로 커지고 작아진다
const RESIZE_CORNERS = [
  { key: "tl", label: "왼쪽 위", pos: { left: 0, top: 0 }, cursor: "nwse-resize" },
  { key: "tr", label: "오른쪽 위", pos: { left: "100%", top: 0 }, cursor: "nesw-resize" },
  { key: "bl", label: "왼쪽 아래", pos: { left: 0, top: "100%" }, cursor: "nesw-resize" },
  { key: "br", label: "오른쪽 아래", pos: { left: "100%", top: "100%" }, cursor: "nwse-resize" },
] as const

/** 방 안에 놓인 소품 */
export default function RoomItemView({
  item,
  placement,
  editing = false,
  selected = false,
  onPointerDown,
  onRemove,
  onTap,
  onResizeStart,
}: {
  item: RoomItemDef
  placement: Placement
  editing?: boolean
  selected?: boolean
  onPointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void
  onRemove?: () => void
  /** 꾸미기 중이 아닐 때 소품을 누르면 (해도리가 쓰러 감) */
  onTap?: () => void
  /** 선택된 소품 오른쪽 아래 모서리 핸들을 누를 때 (크기 조절 시작) */
  onResizeStart?: (e: ReactPointerEvent<HTMLDivElement>) => void
}) {
  const isWall = item.zone === "wall"
  return (
    <div
      className="absolute"
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        width: `${placedWidth(item, placement)}%`,
        transform: isWall ? "translate(-50%, -50%)" : "translate(-50%, -100%)",
        zIndex: zIndexFor(item, placement) + (selected ? 30 : 0),
        touchAction: editing ? "none" : undefined,
        cursor: editing ? "grab" : onTap ? "pointer" : undefined,
        pointerEvents: editing || onTap ? "auto" : "none",
      }}
      onPointerDown={editing ? onPointerDown : undefined}
      onClick={!editing && onTap ? onTap : undefined}
    >
      <div
        className="relative"
        style={{
          // 선택하면 캔바처럼 테두리 상자 + 네 모서리 점
          outline: selected ? "1.5px solid #C9856A" : editing ? "1px dashed rgba(201,133,106,0.45)" : "none",
          outlineOffset: 0,
          borderRadius: 2,
          filter: isWall ? undefined : "drop-shadow(0 6px 6px rgba(61,53,48,0.12))",
        }}
      >
        <RoomItemArt item={item} className="block h-auto w-full select-none" />

        {selected && onRemove && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="absolute left-1/2 flex h-7 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11px] font-extrabold"
            style={{
              top: -38,
              transform: "translateX(-50%)",
              background: "#3D3530",
              color: "#FFFCF8",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
            aria-label={`${item.name} 치우기`}
          >
            ✕ 치우기
          </button>
        )}

        {selected &&
          onResizeStart &&
          RESIZE_CORNERS.map((corner) => (
            <div
              key={corner.key}
              role="button"
              aria-label={`${item.name} 크기 조절 (${corner.label})`}
              onPointerDown={(e) => {
                e.stopPropagation()
                onResizeStart(e)
              }}
              className="absolute flex h-7 w-7 items-center justify-center"
              style={{
                ...corner.pos,
                transform: "translate(-50%, -50%)",
                touchAction: "none",
                cursor: corner.cursor,
              }}
            >
              {/* 보이는 점은 작게, 누르는 영역은 넉넉하게 */}
              <span
                className="block h-3.5 w-3.5 rounded-full"
                style={{ background: "#FFFFFF", border: "2px solid #C9856A", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }}
              />
            </div>
          ))}
      </div>
    </div>
  )
}
