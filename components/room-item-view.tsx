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
          outline: selected ? "2px dashed #C9856A" : editing ? "1px dashed rgba(201,133,106,0.45)" : "none",
          outlineOffset: 4,
          borderRadius: 8,
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
            className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold"
            style={{ background: "#3D3530", color: "#FFFCF8", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
            aria-label={`${item.name} 치우기`}
          >
            ✕
          </button>
        )}

        {selected && onResizeStart && (
          <div
            role="button"
            aria-label={`${item.name} 크기 조절`}
            onPointerDown={(e) => {
              e.stopPropagation()
              onResizeStart(e)
            }}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full"
            style={{
              background: "#C9856A",
              color: "#FFFCF8",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              touchAction: "none",
              cursor: "nwse-resize",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M7 17L17 7M17 7h-6M17 7v6M7 17h6M7 17v-6" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
