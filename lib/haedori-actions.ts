// 해도리가 방 소품을 쓰는 동작 (정면 방 1단계).
//
// 소품마다 "해도리가 설 자리(spot)"와 "자세(pose)"를 정한다.
// - spot: 소품 위치 기준 오프셋 (방 너비/높이 대비 %). y는 해도리 발끝 기준.
// - pose: 자세 이름. HAEDORI_POSES에 그림이 있으면 그 그림으로, 없으면 기본 해도리 그림 + 표시 이모지.
//
// 나중에 단계적으로 바꿀 곳
// - 자세 그림: public/images/haedori-poses/<pose>.png 를 넣고 HAEDORI_POSES에 경로를 채운다
//   (scripts/process-room-items.py 에 pose_<이름>.png 로 넣으면 자동 처리)
// - 걷기 애니메이션 / 아이소메트릭: 이 파일의 spot 계산과 page의 이동 로직만 바꾸면 된다

import type { Placement, RoomItemDef } from "@/lib/room-items"
import { ROOM_ITEMS } from "@/lib/room-items"

export type HaedoriPose = "stand" | "sit" | "lie" | "read" | "water" | "look"

export const HAEDORI_POSES: Record<HaedoriPose, { image?: string; scale?: number }> = {
  stand: {},
  sit: { image: "/images/haedori-poses/sit.png" },
  lie: { image: "/images/haedori-poses/lie.png" },
  read: { image: "/images/haedori-poses/read.png" },
  water: { image: "/images/haedori-poses/water.png" },
  look: { image: "/images/haedori-poses/look.png" },
}

export const HAEDORI_DEFAULT_IMAGE = "/images/haedori-body.png"

export type ItemAction = {
  pose: HaedoriPose
  /** 해도리 머리 위에 잠깐 뜨는 표시 */
  emoji: string
  /** 소품을 눌러서 보냈을 때 말풍선 */
  line: string
  /** 소품 기준 해도리 위치 오프셋. wall 소품은 dy 대신 바닥 floorY를 쓴다 */
  dx: number
  dy?: number
  floorY?: number
}

export const ITEM_ACTIONS: Record<string, ItemAction> = {
  cushion: { pose: "sit", emoji: "😌", line: "폭신폭신~ 여기 앉아 있으니까 좋다", dx: 0, dy: -1 },
  rug: { pose: "lie", emoji: "💤", line: "러그 위에서 뒹굴뒹굴…", dx: 0, dy: -2 },
  bookshelf: { pose: "read", emoji: "📖", line: "이 책 재밌다. 나중에 얘기해줄게!", dx: 22, dy: 2 },
  plant: { pose: "water", emoji: "💧", line: "쑥쑥 자라라~", dx: 15, dy: 2 },
  floor_lamp: { pose: "read", emoji: "💡", line: "불 켜니까 아늑해졌어", dx: 15, dy: 2 },
  round_window: { pose: "look", emoji: "👀", line: "밖에 날씨 어때 보여?", dx: 0, floorY: 86 },
  wall_clock: { pose: "look", emoji: "🕰️", line: "벌써 시간이 이렇게 됐네", dx: 0, floorY: 86 },
  calendar: { pose: "look", emoji: "📅", line: "오늘이 며칠이더라?", dx: 0, floorY: 86 },
  heart_frame: { pose: "look", emoji: "💕", line: "이 그림 볼 때마다 기분 좋아", dx: 0, floorY: 86 },
  wall_shelf: { pose: "look", emoji: "🌱", line: "선반 위 화분도 잘 크고 있어", dx: 0, floorY: 86 },
}

/** 해도리 위치. x: 가운데 기준 %, y: 발끝 기준 % (방 위에서부터) */
export type HaedoriSpot = { x: number; y: number }

export const HOME_SPOT: HaedoriSpot = { x: 50, y: 88 }

// 해도리가 화면 밖으로 안 나가게 (해도리 너비가 대략 방 너비의 45%)
const MIN_X = 22
const MAX_X = 78
const MIN_Y = 80
const MAX_Y = 91 // 아래쪽 버튼 줄에 발이 가리지 않게

export function clampSpot(spot: HaedoriSpot): HaedoriSpot {
  return {
    x: Math.min(MAX_X, Math.max(MIN_X, spot.x)),
    y: Math.min(MAX_Y, Math.max(MIN_Y, spot.y)),
  }
}

/** 소품을 쓸 때 해도리가 갈 자리. 소품이 오른쪽에 있으면 왼쪽 옆에 선다. */
export function spotForItem(item: RoomItemDef, placement: Placement): HaedoriSpot | null {
  const action = ITEM_ACTIONS[item.key]
  if (!action) return null
  const side = placement.x > 50 ? -1 : 1
  const x = placement.x + action.dx * (placement.scale ?? 1) * side // 소품이 커지면 옆으로 더 비켜 선다
  const y = item.zone === "wall" ? action.floorY ?? HOME_SPOT.y : placement.y + (action.dy ?? 0)
  return clampSpot({ x, y })
}

/** 방에 놓인 소품 중 해도리가 쓸 수 있는 것 */
export function usablePlacements(placements: Placement[]): Placement[] {
  return placements.filter((p) => ROOM_ITEMS[p.item_key] && ITEM_ACTIONS[p.item_key])
}

/** 해도리 겹침 순서. 바닥 소품과 같은 규칙(아래에 있을수록 앞)이라 소품 앞뒤로 자연스럽게 섞인다. */
export function haedoriZIndex(y: number): number {
  return (y >= 88 ? 21 : 5) + Math.round(y / 10)
}
