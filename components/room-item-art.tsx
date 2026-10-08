// 해도리 방 소품 임시 그림 (정면).
// 홈 화면 해도리 방 그림체(갈색 외곽선 + 파스텔)에 맞춘 단순한 SVG.
// 실제 그림(PNG)이 생기면 lib/room-items.ts의 image 경로만 채우면 이 그림 대신 쓰인다.

import type { ReactNode } from "react"

const LINE = "#8A5A3C"
const S = { stroke: LINE, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const }

const WOOD = "#E8B98A"
const WOOD_DARK = "#D29C6B"
const MINT = "#BFE3CF"
const PINK = "#F6C1CC"
const CREAM = "#FFF6E8"
const LEAF = "#9FCB8E"
const LEAF_DARK = "#7FB06E"

export const ROOM_ITEM_ART: Record<string, { viewBox: [number, number]; svg: ReactNode }> = {
  wall_clock: {
    viewBox: [100, 100],
    svg: (
      <>
        <circle cx="50" cy="50" r="44" fill={PINK} {...S} />
        <circle cx="50" cy="50" r="35" fill={CREAM} {...S} />
        {[0, 90, 180, 270].map((deg) => (
          <line
            key={deg}
            x1="50"
            y1="20"
            x2="50"
            y2="25"
            transform={`rotate(${deg} 50 50)`}
            {...S}
            strokeWidth={2.5}
          />
        ))}
        <line x1="50" y1="50" x2="50" y2="31" {...S} />
        <line x1="50" y1="50" x2="64" y2="56" {...S} />
        <circle cx="50" cy="50" r="3" fill={LINE} />
      </>
    ),
  },

  heart_frame: {
    viewBox: [80, 100],
    svg: (
      <>
        <path d="M40 4 L22 24 M40 4 L58 24" {...S} fill="none" strokeWidth={2.5} />
        <circle cx="40" cy="4" r="3" fill={LINE} />
        <rect x="8" y="24" width="64" height="72" rx="4" fill={MINT} {...S} />
        <rect x="16" y="32" width="48" height="56" rx="2" fill={CREAM} {...S} strokeWidth={2.5} />
        <path
          d="M40 74 C28 64 24 58 24 52 C24 46 29 43 33 43 C36.5 43 39 45 40 48 C41 45 43.5 43 47 43 C51 43 56 46 56 52 C56 58 52 64 40 74 Z"
          fill={PINK}
          {...S}
          strokeWidth={2.5}
        />
      </>
    ),
  },

  round_window: {
    viewBox: [100, 100],
    svg: (
      <>
        <circle cx="50" cy="50" r="46" fill={WOOD} {...S} />
        <circle cx="50" cy="50" r="38" fill="#DDF0FA" {...S} />
        <path d="M30 34 Q42 22 56 24" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
        <line x1="50" y1="12" x2="50" y2="88" {...S} strokeWidth={5} stroke={WOOD_DARK} />
        <line x1="12" y1="50" x2="88" y2="50" {...S} strokeWidth={5} stroke={WOOD_DARK} />
        <circle cx="50" cy="50" r="38" fill="none" {...S} />
      </>
    ),
  },

  calendar: {
    viewBox: [80, 100],
    svg: (
      <>
        <rect x="6" y="14" width="68" height="80" rx="5" fill={CREAM} {...S} />
        <rect x="6" y="14" width="68" height="18" rx="5" fill={MINT} {...S} />
        {[20, 34, 46, 60].map((x) => (
          <line key={x} x1={x} y1="8" x2={x} y2="20" {...S} strokeWidth={2.5} />
        ))}
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3, 4].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={14 + col * 11}
              y={42 + row * 12}
              width="7"
              height="7"
              rx="1.5"
              fill={row === 1 && col === 2 ? PINK : "#EADCC8"}
            />
          ))
        )}
      </>
    ),
  },

  wall_shelf: {
    viewBox: [120, 70],
    svg: (
      <>
        <path d="M44 34 C44 26 50 22 56 26 C58 18 66 18 68 26 C74 22 80 28 76 34" fill={LEAF} {...S} strokeWidth={2.5} />
        <path d="M46 34 H74 L71 50 H49 Z" fill={PINK} {...S} />
        <rect x="84" y="36" width="16" height="14" rx="3" fill={MINT} {...S} strokeWidth={2.5} />
        <rect x="18" y="30" width="10" height="20" rx="1.5" fill={MINT} {...S} strokeWidth={2.5} />
        <rect x="29" y="34" width="9" height="16" rx="1.5" fill={PINK} {...S} strokeWidth={2.5} />
        <rect x="6" y="50" width="108" height="10" rx="3" fill={WOOD} {...S} />
        <path d="M20 60 L20 66 M100 60 L100 66" {...S} />
      </>
    ),
  },

  plant: {
    viewBox: [80, 110],
    svg: (
      <>
        <path d="M40 62 C30 50 14 46 10 30 C24 28 36 40 40 54" fill={LEAF} {...S} />
        <path d="M40 62 C50 48 66 44 70 26 C56 26 44 40 40 54" fill={LEAF_DARK} {...S} />
        <path d="M40 60 C38 40 40 22 48 8 C54 22 50 42 40 60" fill={LEAF} {...S} />
        <path d="M14 62 H66 L60 104 H20 Z" fill={WOOD} {...S} />
        <rect x="10" y="58" width="60" height="12" rx="4" fill={WOOD_DARK} {...S} />
      </>
    ),
  },

  floor_lamp: {
    viewBox: [70, 170],
    svg: (
      <>
        <ellipse cx="35" cy="40" rx="34" ry="12" fill="#FFE7A8" opacity="0.45" />
        <path d="M14 46 L22 8 H48 L56 46 Z" fill="#FFE2A0" {...S} />
        <line x1="35" y1="46" x2="35" y2="156" {...S} strokeWidth={5} stroke={WOOD_DARK} />
        <line x1="35" y1="46" x2="35" y2="156" {...S} fill="none" strokeWidth={3} />
        <ellipse cx="35" cy="160" rx="24" ry="7" fill={WOOD} {...S} />
      </>
    ),
  },

  bookshelf: {
    viewBox: [100, 150],
    svg: (
      <>
        <rect x="6" y="6" width="88" height="138" rx="5" fill={WOOD} {...S} />
        <rect x="14" y="14" width="72" height="122" rx="2" fill={WOOD_DARK} {...S} strokeWidth={2.5} />
        <line x1="14" y1="56" x2="86" y2="56" {...S} />
        <line x1="14" y1="96" x2="86" y2="96" {...S} />
        <rect x="20" y="26" width="10" height="30" rx="1.5" fill={PINK} {...S} strokeWidth={2.5} />
        <rect x="31" y="22" width="10" height="34" rx="1.5" fill={MINT} {...S} strokeWidth={2.5} />
        <rect x="42" y="30" width="9" height="26" rx="1.5" fill={CREAM} {...S} strokeWidth={2.5} />
        <path d="M54 56 L64 30 L72 33 L62 57" fill="#C9D9F0" {...S} strokeWidth={2.5} />
        <rect x="20" y="74" width="30" height="10" rx="2" fill={MINT} {...S} strokeWidth={2.5} />
        <rect x="23" y="64" width="26" height="10" rx="2" fill={PINK} {...S} strokeWidth={2.5} />
        <circle cx="68" cy="84" r="9" fill={LEAF} {...S} strokeWidth={2.5} />
        <rect x="20" y="104" width="60" height="32" rx="2" fill={WOOD} {...S} strokeWidth={2.5} />
        <circle cx="50" cy="120" r="3" fill={LINE} />
      </>
    ),
  },

  cushion: {
    viewBox: [110, 70],
    svg: (
      <>
        <path
          d="M10 34 C8 14 26 8 55 10 C84 8 102 14 100 34 C102 54 84 62 55 60 C26 62 8 54 10 34 Z"
          fill={PINK}
          {...S}
        />
        <path d="M30 22 C40 28 70 28 80 22" fill="none" {...S} strokeWidth={2.5} opacity="0.6" />
        <circle cx="55" cy="35" r="3" fill={LINE} opacity="0.7" />
      </>
    ),
  },

  rug: {
    viewBox: [220, 50],
    svg: (
      <>
        <ellipse cx="110" cy="25" rx="104" ry="20" fill={MINT} {...S} />
        <ellipse cx="110" cy="25" rx="88" ry="13" fill="none" {...S} strokeWidth={2} strokeDasharray="6 6" />
      </>
    ),
  },
}
