// 해도리 방 소품 카탈로그. 키는 백엔드 shop_items.item_key(item_type='room_item')와 같아야 한다.
//
// zone   : wall(벽에 걸기) / floor(바닥에 놓기)
// width  : 방 화면 너비 대비 % (높이는 그림 비율대로)
// layer  : floor 소품 중 러그처럼 항상 맨 아래 깔리는 것은 "under"
// image  : 실제 그림(PNG) 경로. 비어 있으면 components/room-item-art.tsx의 임시 그림을 쓴다.
//          scripts/process-room-items.py 가 처리한 그림을 public/room-items/ 에 넣고 경로를 채우면 된다.

export type RoomItemZone = "wall" | "floor"

export type RoomItemDef = {
  key: string
  name: string
  zone: RoomItemZone
  width: number
  layer?: "under"
  image?: string
  /** image를 쓸 때 그림 비율 (높이/너비). 임시 그림은 SVG viewBox에서 계산한다. */
  aspect?: number
}

export const ROOM_ITEMS: Record<string, RoomItemDef> = {
  wall_clock: { key: "wall_clock", name: "벽시계", zone: "wall", width: 20, image: "/room-items/wall_clock.png", aspect: 0.996 },
  heart_frame: { key: "heart_frame", name: "하트 액자", zone: "wall", width: 15, image: "/room-items/heart_frame.png", aspect: 1.399 },
  round_window: { key: "round_window", name: "동그란 창문", zone: "wall", width: 30, image: "/room-items/round_window.png", aspect: 0.994 },
  calendar: { key: "calendar", name: "달력", zone: "wall", width: 15, image: "/room-items/calendar.png", aspect: 1.174 },
  wall_shelf: { key: "wall_shelf", name: "벽 선반", zone: "wall", width: 30, image: "/room-items/wall_shelf.png", aspect: 0.594 },
  plant: { key: "plant", name: "화분", zone: "floor", width: 15, image: "/room-items/plant.png", aspect: 1.185 },
  floor_lamp: { key: "floor_lamp", name: "스탠드 조명", zone: "floor", width: 13, image: "/room-items/floor_lamp.png", aspect: 2.474 },
  bookshelf: { key: "bookshelf", name: "책장", zone: "floor", width: 26, image: "/room-items/bookshelf.png", aspect: 1.505 },
  cushion: { key: "cushion", name: "쿠션", zone: "floor", width: 24, image: "/room-items/cushion.png", aspect: 0.640 },
  rug: { key: "rug", name: "러그", zone: "floor", width: 72, layer: "under", image: "/room-items/rug.png", aspect: 0.531 },
}

/** scale: 크기 배율 (꾸미기에서 모서리를 끌어 조절, 없으면 1) */
export type Placement = { item_key: string; x: number; y: number; scale?: number }

export const MIN_SCALE = 0.6
export const MAX_SCALE = 1.8

/** 배치 배율을 반영한 소품 너비 (방 너비 대비 %) */
export function placedWidth(item: RoomItemDef, p: Placement): number {
  return item.width * (p.scale ?? 1)
}

// 방 화면 안에서 소품을 놓을 수 있는 범위 (%)
// 벽 소품: 중심 기준 / 바닥 소품: 바닥에 닿는 아래 중앙 기준
// 위아래로 자유롭게 옮길 수 있게 넓게 잡는다 (예: 화분을 벽 선반 위에 올리기, 책장을 벽 쪽으로 올리기).
// 화면 밖으로만 안 나가게 막는다. 겹침 순서는 zIndexFor 규칙(아래에 있을수록 앞)을 그대로 따른다.
export const ZONE_BOUNDS: Record<RoomItemZone, { minY: number; maxY: number }> = {
  wall: { minY: 12, maxY: 92 },
  floor: { minY: 30, maxY: 99 },
}

/** 처음 놓을 때 기본 위치 */
// 해도리(가운데)를 피해서 좌우로 번갈아 놓는다
const DEFAULT_XS = [24, 76, 16, 84, 34, 66]

export function defaultPlacement(item: RoomItemDef, index: number): Placement {
  const x = DEFAULT_XS[index % DEFAULT_XS.length]
  if (item.zone === "wall") return { item_key: item.key, x, y: 34 }
  if (item.layer === "under") return { item_key: item.key, x: 50, y: 88 }
  return { item_key: item.key, x, y: 80 }
}

export function clampScale(item: RoomItemDef, scale: number): number {
  // 방 너비의 95%를 넘지 않게
  const maxByRoom = 95 / item.width
  return Math.min(MAX_SCALE, maxByRoom, Math.max(MIN_SCALE, scale))
}

export function clampPlacement(item: RoomItemDef, p: Placement): Placement {
  const scale = clampScale(item, p.scale ?? 1)
  const half = (item.width * scale) / 2
  const bounds = ZONE_BOUNDS[item.zone]
  return {
    item_key: p.item_key,
    x: Math.min(100 - half, Math.max(half, p.x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, p.y)),
    ...(Math.abs(scale - 1) > 0.001 ? { scale: Math.round(scale * 100) / 100 } : {}),
  }
}

/**
 * 겹치는 순서. 벽 소품 < 러그 < 해도리 뒤 바닥 소품 < 해도리(20) < 해도리 앞 바닥 소품.
 * 바닥 소품은 아래(y가 클수록)에 있을수록 앞에 그려진다.
 */
export function zIndexFor(item: RoomItemDef, p: Placement): number {
  if (item.zone === "wall") return 2
  if (item.layer === "under") return 3
  const inFront = p.y >= 88
  return (inFront ? 21 : 5) + Math.round(p.y / 10)
}
