// diary-frontend/data/roomLayout.ts

export type RoomSize = "S" | "M" | "L"

export type Point = {
  x: number
  y: number
}

export type Quad = [Point, Point, Point, Point]

export type RoomPlacement = {
  floorQuad: Quad
  cols: number
  rows: number
}

export type RoomLayout = {
  size: RoomSize
  renderWidth: number
  renderHeight: number
  cleanImageUrl: string
  wallShellUrl: string
  floorBaseUrl: string
  gridOverlayUrl: string
  manifestUrl: string
  placement: RoomPlacement
}

export type LayoutManifestPlacement = {
  normalized_floor_inner_quad: [number, number][]
}

export type LayoutManifestGrid = {
  cols: number
  rows: number
}

export type LayoutManifest = {
  grid: LayoutManifestGrid
  placement: LayoutManifestPlacement
}

const DEFAULT_RENDER_WIDTH = 1024
const DEFAULT_RENDER_HEIGHT = 1024

export const ROOM_SIZES: RoomSize[] = ["S", "M", "L"]

function scaleNormalizedQuad(
  normalizedQuad: [number, number][],
  width: number,
  height: number,
): Quad {
  if (normalizedQuad.length !== 4) {
    throw new Error("normalized_floor_inner_quad must contain exactly 4 points.")
  }

  return [
    {
      x: normalizedQuad[0][0] * width,
      y: normalizedQuad[0][1] * height,
    },
    {
      x: normalizedQuad[1][0] * width,
      y: normalizedQuad[1][1] * height,
    },
    {
      x: normalizedQuad[2][0] * width,
      y: normalizedQuad[2][1] * height,
    },
    {
      x: normalizedQuad[3][0] * width,
      y: normalizedQuad[3][1] * height,
    },
  ]
}

export function buildRoomLayoutFromManifest(
  size: RoomSize,
  manifest: LayoutManifest,
  renderWidth: number = DEFAULT_RENDER_WIDTH,
  renderHeight: number = DEFAULT_RENDER_HEIGHT,
): RoomLayout {
  const floorQuad = scaleNormalizedQuad(
    manifest.placement.normalized_floor_inner_quad,
    renderWidth,
    renderHeight,
  )

  return {
    size,
    renderWidth,
    renderHeight,
    cleanImageUrl: `/room/${size}/composite_clean.png`,
    wallShellUrl: `/room/${size}/wall_shell.png`,
    floorBaseUrl: `/room/${size}/floor_base.png`,
    gridOverlayUrl: `/room/${size}/grid_overlay.png`,
    manifestUrl: `/room/${size}/layout_manifest.json`,
    placement: {
      floorQuad,
      cols: manifest.grid.cols,
      rows: manifest.grid.rows,
    },
  }
}

export async function loadRoomLayout(size: RoomSize): Promise<RoomLayout> {
  const manifestUrl = `/room/${size}/layout_manifest.json`
  const response = await fetch(manifestUrl)

  if (!response.ok) {
    throw new Error(`Failed to load room manifest: ${manifestUrl}`)
  }

  const manifest = (await response.json()) as LayoutManifest

  return buildRoomLayoutFromManifest(size, manifest)
}

export function getRoomAssetUrls(size: RoomSize) {
  return {
    cleanImageUrl: `/room/${size}/composite_clean.png`,
    wallShellUrl: `/room/${size}/wall_shell.png`,
    floorBaseUrl: `/room/${size}/floor_base.png`,
    gridOverlayUrl: `/room/${size}/grid_overlay.png`,
    manifestUrl: `/room/${size}/layout_manifest.json`,
  }
}

export function pointOnQuad(quad: Quad, u: number, v: number): Point {
  const back = quad[0]
  const right = quad[1]
  const front = quad[2]
  const left = quad[3]

  return {
    x:
      (1 - u) * (1 - v) * back.x +
      u * (1 - v) * right.x +
      u * v * front.x +
      (1 - u) * v * left.x,
    y:
      (1 - u) * (1 - v) * back.y +
      u * (1 - v) * right.y +
      u * v * front.y +
      (1 - u) * v * left.y,
  }
}

export function floorCellToPoint(
  layout: RoomLayout,
  col: number,
  row: number,
  anchorU: number = 0.5,
  anchorV: number = 1.0,
  colSpan: number = 1,
  rowSpan: number = 1,
): Point {
  const { cols, rows, floorQuad } = layout.placement

  const leftU = col / cols
  const rightU = (col + colSpan) / cols
  const backV = row / rows
  const frontV = (row + rowSpan) / rows

  const u = leftU + (rightU - leftU) * anchorU
  const v = backV + (frontV - backV) * anchorV

  return pointOnQuad(floorQuad, u, v)
}

export function getCellFootprintQuad(
  layout: RoomLayout,
  col: number,
  row: number,
  colSpan: number = 1,
  rowSpan: number = 1,
): Quad {
  const { cols, rows, floorQuad } = layout.placement

  const leftU = col / cols
  const rightU = (col + colSpan) / cols
  const backV = row / rows
  const frontV = (row + rowSpan) / rows

  return [
    pointOnQuad(floorQuad, leftU, backV),
    pointOnQuad(floorQuad, rightU, backV),
    pointOnQuad(floorQuad, rightU, frontV),
    pointOnQuad(floorQuad, leftU, frontV),
  ]
}

export function clampGridPosition(
  layout: RoomLayout,
  col: number,
  row: number,
  colSpan: number = 1,
  rowSpan: number = 1,
) {
  const maxCol = layout.placement.cols - colSpan
  const maxRow = layout.placement.rows - rowSpan

  return {
    col: Math.max(0, Math.min(col, maxCol)),
    row: Math.max(0, Math.min(row, maxRow)),
  }
}

export function isGridRectOverlapping(
  a: { col: number; row: number; colSpan: number; rowSpan: number },
  b: { col: number; row: number; colSpan: number; rowSpan: number },
): boolean {
  return !(
    a.col + a.colSpan <= b.col ||
    b.col + b.colSpan <= a.col ||
    a.row + a.rowSpan <= b.row ||
    b.row + b.rowSpan <= a.row
  )
}

/**
 * direction 의미:
 * - right = 오른쪽 벽에 붙이는 가구
 * - left = 왼쪽 벽에 붙이는 가구
 */
export function inferWallDirectionByColumn(
  layout: RoomLayout,
  col: number,
  colSpan: number = 1,
): "left" | "right" {
  const center = col + colSpan / 2
  const half = layout.placement.cols / 2

  return center < half ? "left" : "right"
}

export function isNearLeftWall(col: number): boolean {
  return col <= 1
}

export function isNearRightWall(
  layout: RoomLayout,
  col: number,
  colSpan: number = 1,
): boolean {
  return col + colSpan >= layout.placement.cols - 1
}