//변환 끝
// /home/dori/diary-frontend/components/room-item-data.tsx
export type InventoryCategory =
  | "all"
  | "wallpaper"
  | "floor"
  | "furniture"
  | "food"
  | "deco"

export type InventoryItemMeta = {
  id: string
  backendId: number
  name: string
  category: InventoryCategory
  emoji: string
  placeable: boolean
  gridW: number
  gridH: number
}

export type PlacedFurniture = {
  id: string
  itemId: string
  backendId: number
  label: string
  emoji: string
  category: InventoryCategory
  gridX: number
  gridY: number
  gridW: number
  gridH: number
  rotation: 0 | 90
}

export const initialPlacedFurniture: PlacedFurniture[] = [
  {
    id: "desk-default",
    itemId: "fn1",
    backendId: 1,
    label: "원목 책상",
    emoji: "🪑",
    category: "furniture",
    gridX: 1,
    gridY: 3,
    gridW: 2,
    gridH: 1,
    rotation: 0,
  },
  {
    id: "bookshelf-default",
    itemId: "fn4",
    backendId: 4,
    label: "미니 책장",
    emoji: "📚",
    category: "furniture",
    gridX: 4,
    gridY: 1,
    gridW: 1,
    gridH: 2,
    rotation: 90,
  },
  {
    id: "plant-default",
    itemId: "dc2",
    backendId: 8,
    label: "미니 화분",
    emoji: "🌱",
    category: "deco",
    gridX: 4,
    gridY: 4,
    gridW: 1,
    gridH: 1,
    rotation: 0,
  },
]

export const inventoryMetaByBackendId: Record<number, InventoryItemMeta> = {
  1: {
    id: "fn1",
    backendId: 1,
    name: "원목 책상",
    category: "furniture",
    emoji: "🪑",
    placeable: true,
    gridW: 2,
    gridH: 1,
  },
  2: {
    id: "fn2",
    backendId: 2,
    name: "빈백 소파",
    category: "furniture",
    emoji: "🛋️",
    placeable: true,
    gridW: 2,
    gridH: 2,
  },
  3: {
    id: "fn3",
    backendId: 3,
    name: "별모양 램프",
    category: "furniture",
    emoji: "⭐",
    placeable: true,
    gridW: 1,
    gridH: 1,
  },
  4: {
    id: "fn4",
    backendId: 4,
    name: "미니 책장",
    category: "furniture",
    emoji: "📚",
    placeable: true,
    gridW: 1,
    gridH: 2,
  },
  5: {
    id: "fn5",
    backendId: 5,
    name: "둥근 침대",
    category: "furniture",
    emoji: "🛏️",
    placeable: true,
    gridW: 3,
    gridH: 2,
  },
  6: {
    id: "fn6",
    backendId: 6,
    name: "창문 커튼",
    category: "furniture",
    emoji: "🪟",
    placeable: true,
    gridW: 2,
    gridH: 1,
  },
  7: {
    id: "dc1",
    backendId: 7,
    name: "해달 인형",
    category: "deco",
    emoji: "🦦",
    placeable: true,
    gridW: 1,
    gridH: 1,
  },
  8: {
    id: "dc2",
    backendId: 8,
    name: "미니 화분",
    category: "deco",
    emoji: "🌱",
    placeable: true,
    gridW: 1,
    gridH: 1,
  },
  9: {
    id: "dc3",
    backendId: 9,
    name: "무지개 모빌",
    category: "deco",
    emoji: "🌈",
    placeable: true,
    gridW: 1,
    gridH: 1,
  },
  10: {
    id: "dc4",
    backendId: 10,
    name: "달 거울",
    category: "deco",
    emoji: "🌙",
    placeable: true,
    gridW: 1,
    gridH: 1,
  },
  11: {
    id: "dc5",
    backendId: 11,
    name: "리본 액자",
    category: "deco",
    emoji: "🎀",
    placeable: true,
    gridW: 1,
    gridH: 1,
  },
  12: {
    id: "dc6",
    backendId: 12,
    name: "초 세트",
    category: "deco",
    emoji: "🕯️",
    placeable: true,
    gridW: 1,
    gridH: 1,
  },
  13: {
    id: "fd1",
    backendId: 13,
    name: "딸기 케이크",
    category: "food",
    emoji: "🍓",
    placeable: false,
    gridW: 1,
    gridH: 1,
  },
  14: {
    id: "fd2",
    backendId: 14,
    name: "마카롱 세트",
    category: "food",
    emoji: "🍬",
    placeable: false,
    gridW: 1,
    gridH: 1,
  },
  15: {
    id: "fd3",
    backendId: 15,
    name: "버블티",
    category: "food",
    emoji: "🧋",
    placeable: false,
    gridW: 1,
    gridH: 1,
  },
  16: {
    id: "fd4",
    backendId: 16,
    name: "귤 바구니",
    category: "food",
    emoji: "🍊",
    placeable: false,
    gridW: 1,
    gridH: 1,
  },
  17: {
    id: "fd5",
    backendId: 17,
    name: "꿀단지",
    category: "food",
    emoji: "🍯",
    placeable: false,
    gridW: 1,
    gridH: 1,
  },
  18: {
    id: "fd6",
    backendId: 18,
    name: "쿠키 상자",
    category: "food",
    emoji: "🍪",
    placeable: false,
    gridW: 1,
    gridH: 1,
  },
}

export const inventoryCategories: {
  id: InventoryCategory
  label: string
  icon: string
}[] = [
  { id: "all", label: "전체", icon: "✨" },
  { id: "furniture", label: "가구", icon: "🛋️" },
  { id: "food", label: "간식", icon: "🍰" },
  { id: "deco", label: "소품", icon: "🪴" },
]