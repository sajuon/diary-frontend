// diary-frontend/data/furnitureMeta.ts

export type FurnitureDirection = "right" | "left"

export type FurnitureCategory = "furniture" | "decoration" | "rug"

export type FurnitureMeta = {
  key: string
  label: string
  category: FurnitureCategory

  /**
   * direction 의미:
   * - right = 오른쪽 벽에 붙이는 가구
   * - left = 왼쪽 벽에 붙이는 가구
   */
  directions: FurnitureDirection[]

  /**
   * 각 direction에 대응하는 실제 이미지 경로
   * right: 오른쪽 벽 배치용 이미지
   * left: 왼쪽 벽 배치용 이미지
   */
  imageUrls: Partial<Record<FurnitureDirection, string>> & {
    right: string
  }

  /**
   * 가구가 차지하는 격자 칸 수
   */
  gridW: number
  gridH: number

  /**
   * 기본 렌더 배율
   */
  defaultScale: number

  /**
   * 방 격자 위 기준점
   * 0~1 범위
   */
  anchorU: number
  anchorV: number

  /**
   * 스프라이트 자체 내부 기준점
   * 0~1 범위
   */
  spriteAnchorXRatio?: number
  spriteAnchorYRatio?: number

  /**
   * 벽에 붙는 타입인지 여부
   */
  wallAttachable?: boolean
}

export const furnitureMeta: Record<string, FurnitureMeta> = {
  accentChair: {
    key: "accentChair",
    label: "의자",
    category: "furniture",
    directions: ["right", "left"],
    imageUrls: {
      right: "/furniture/accent-chair/right.png",
      left: "/furniture/accent-chair/left.png",
    },
    gridW: 2,
    gridH: 2,
    defaultScale: 1.0,
    anchorU: 0.5,
    anchorV: 0.78,
    spriteAnchorXRatio: 0.5,
    spriteAnchorYRatio: 0.86,
    wallAttachable: false,
  },

  sofa: {
    key: "sofa",
    label: "소파",
    category: "furniture",
    directions: ["right", "left"],
    imageUrls: {
      right: "/furniture/sofa/right.png",
      left: "/furniture/sofa/left.png",
    },
    gridW: 2,
    gridH: 1,
    defaultScale: 1.0,
    anchorU: 0.5,
    anchorV: 0.95,
    spriteAnchorXRatio: 0.5,
    spriteAnchorYRatio: 1.0,
    wallAttachable: false,
  },

  bed: {
    key: "bed",
    label: "침대",
    category: "furniture",
    directions: ["right"],
    imageUrls: {
      right: "/furniture/bed/right.png",
    },
    gridW: 2,
    gridH: 3,
    defaultScale: 1.0,
    anchorU: 0.56,
    anchorV: 0.9,
    spriteAnchorXRatio: 0.54,
    spriteAnchorYRatio: 0.98,
    wallAttachable: false,
  },

  bookshelf: {
    key: "bookshelf",
    label: "책장",
    category: "furniture",
    directions: ["right", "left"],
    imageUrls: {
      right: "/furniture/bookshelf/right.png",
      left: "/furniture/bookshelf/left.png",
    },
    gridW: 2,
    gridH: 1,
    defaultScale: 1.0,
    anchorU: 0.5,
    anchorV: 1.0,
    spriteAnchorXRatio: 0.5,
    spriteAnchorYRatio: 1.0,
    wallAttachable: true,
  },

  carpet: {
    key: "carpet",
    label: "카펫",
    category: "rug",
    directions: ["right"],
    imageUrls: {
      right: "/furniture/carpet/base.png",
    },
    gridW: 3,
    gridH: 2,
    defaultScale: 1.0,
    anchorU: 0.5,
    anchorV: 1.0,
    spriteAnchorXRatio: 0.5,
    spriteAnchorYRatio: 1.0,
    wallAttachable: false,
  },
}

export type FurnitureKey = keyof typeof furnitureMeta

export function getFurnitureMeta(key: FurnitureKey): FurnitureMeta {
  return furnitureMeta[key]
}

export function getFurnitureImageUrl(
  key: FurnitureKey,
  direction: FurnitureDirection = "right",
): string {
  const meta = furnitureMeta[key]
  return meta.imageUrls[direction] ?? meta.imageUrls.right
}

export function toggleFurnitureDirection(
  key: FurnitureKey,
  current: FurnitureDirection,
): FurnitureDirection {
  const meta = furnitureMeta[key]

  if (!meta.directions.includes("left")) {
    return "right"
  }

  return current === "right" ? "left" : "right"
}