// 해도리 방 테마 (벽 + 바닥). 소품(화분·조명 등)은 테마와 별개로 따로 판다.
// 키는 백엔드 shop_items.item_key와 같아야 한다. "default"는 무료 기본 테마.

export type RoomPattern = {
  image: string
  size: string
}

export type RoomTheme = {
  key: string
  name: string
  /** 화면 전체 바탕 (벽 아래까지 이어지는 그라데이션) */
  base: string
  /** 벽 위에 얹는 밝기/색 보정 레이어 */
  wall: string
  wallPattern?: RoomPattern
  /** 왼쪽 창가 빛 */
  curtain: string
  floor: string
  floorPattern?: RoomPattern
  floorBorder: string
  floorLine: string
  /** 헤더 제목 색 (어두운 테마에서 글자가 묻히지 않게) */
  title: string
}

export const DEFAULT_THEME_KEY = "default"

export const ROOM_THEMES: Record<string, RoomTheme> = {
  default: {
    key: "default",
    name: "기본",
    base: "linear-gradient(180deg, #FFF8F0 0%, #F8E8D8 58%, #E9CBB0 100%)",
    wall: "linear-gradient(180deg, rgba(255,251,246,0.58) 0%, rgba(255,241,226,0.16) 100%)",
    curtain:
      "linear-gradient(90deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.38) 55%, rgba(255,255,255,0) 100%)",
    floor: "linear-gradient(180deg, #F1D5B9 0%, #E7BE9C 100%)",
    floorBorder: "rgba(202,158,120,0.3)",
    floorLine: "rgba(211,169,131,0.28)",
    title: "#3D3530",
  },

  night_sea: {
    key: "night_sea",
    name: "밤바다",
    base: "linear-gradient(180deg, #27325A 0%, #34437A 60%, #3F4F86 100%)",
    wall: "linear-gradient(180deg, rgba(20,26,52,0.35) 0%, rgba(80,100,160,0.12) 100%)",
    wallPattern: {
      image:
        "radial-gradient(circle, rgba(255,236,170,0.95) 1.2px, transparent 1.8px), radial-gradient(circle, rgba(255,255,255,0.7) 0.8px, transparent 1.4px)",
      size: "46px 46px, 29px 29px",
    },
    curtain:
      "linear-gradient(90deg, rgba(190,210,255,0.22) 0%, rgba(190,210,255,0.08) 55%, rgba(190,210,255,0) 100%)",
    floor: "linear-gradient(180deg, #5E4C46 0%, #4A3A35 100%)",
    floorPattern: {
      image:
        "repeating-linear-gradient(90deg, rgba(0,0,0,0.14) 0 2px, transparent 2px 64px)",
      size: "auto",
    },
    floorBorder: "rgba(20,16,14,0.45)",
    floorLine: "rgba(255,255,255,0.08)",
    title: "#F4EFE6",
  },

  cherry: {
    key: "cherry",
    name: "벚꽃",
    base: "linear-gradient(180deg, #FFF1F4 0%, #FBDDE4 60%, #F2C6D0 100%)",
    wall: "linear-gradient(180deg, rgba(255,250,251,0.5) 0%, rgba(255,232,238,0.12) 100%)",
    wallPattern: {
      image: "radial-gradient(circle, rgba(236,150,172,0.55) 2.4px, transparent 3px)",
      size: "34px 34px",
    },
    curtain:
      "linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 55%, rgba(255,255,255,0) 100%)",
    floor: "linear-gradient(180deg, #F6E7DB 0%, #EBD3C2 100%)",
    floorBorder: "rgba(214,170,160,0.35)",
    floorLine: "rgba(214,170,160,0.3)",
    title: "#3D3530",
  },

  forest: {
    key: "forest",
    name: "숲속",
    base: "linear-gradient(180deg, #EEF5E8 0%, #D9E8CF 60%, #C3D8B4 100%)",
    wall: "linear-gradient(180deg, rgba(250,253,247,0.45) 0%, rgba(226,240,216,0.1) 100%)",
    wallPattern: {
      image:
        "repeating-linear-gradient(90deg, rgba(140,180,120,0.18) 0 12px, transparent 12px 40px)",
      size: "auto",
    },
    curtain:
      "linear-gradient(90deg, rgba(255,255,240,0.75) 0%, rgba(255,255,240,0.3) 55%, rgba(255,255,240,0) 100%)",
    floor: "linear-gradient(180deg, #C9A27A 0%, #B48A62 100%)",
    floorPattern: {
      image:
        "repeating-linear-gradient(90deg, rgba(110,74,44,0.18) 0 2px, transparent 2px 72px)",
      size: "auto",
    },
    floorBorder: "rgba(120,86,56,0.35)",
    floorLine: "rgba(110,74,44,0.22)",
    title: "#3D3530",
  },

  autumn: {
    key: "autumn",
    name: "가을 단풍",
    base: "linear-gradient(180deg, #FFF0E0 0%, #F8D6B4 60%, #EDBB8E 100%)",
    wall: "linear-gradient(180deg, rgba(255,247,238,0.45) 0%, rgba(250,220,190,0.12) 100%)",
    wallPattern: {
      image:
        "repeating-linear-gradient(90deg, rgba(222,150,96,0.16) 0 16px, transparent 16px 44px)",
      size: "auto",
    },
    curtain:
      "linear-gradient(90deg, rgba(255,246,230,0.8) 0%, rgba(255,246,230,0.35) 55%, rgba(255,246,230,0) 100%)",
    floor: "linear-gradient(180deg, #B98560 0%, #9C6B47 100%)",
    floorPattern: {
      image:
        "repeating-linear-gradient(90deg, rgba(90,52,30,0.2) 0 2px, transparent 2px 68px)",
      size: "auto",
    },
    floorBorder: "rgba(110,66,40,0.4)",
    floorLine: "rgba(90,52,30,0.22)",
    title: "#3D3530",
  },

  snow: {
    key: "snow",
    name: "눈 오는 날",
    base: "linear-gradient(180deg, #F4F9FD 0%, #E2EEF7 60%, #CFE0EE 100%)",
    wall: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(230,242,250,0.1) 100%)",
    wallPattern: {
      image:
        "radial-gradient(circle, rgba(255,255,255,0.95) 2.2px, transparent 2.8px), radial-gradient(circle, rgba(170,198,222,0.45) 1.6px, transparent 2.2px)",
      size: "40px 40px, 26px 26px",
    },
    curtain:
      "linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 55%, rgba(255,255,255,0) 100%)",
    floor: "linear-gradient(180deg, #F3F6F9 0%, #E3EAF1 100%)",
    floorPattern: {
      image:
        "conic-gradient(rgba(190,208,224,0.45) 25%, transparent 0 50%, rgba(190,208,224,0.45) 0 75%, transparent 0)",
      size: "44px 44px",
    },
    floorBorder: "rgba(170,190,210,0.45)",
    floorLine: "rgba(170,190,210,0.3)",
    title: "#3D3530",
  },
}

export function getRoomTheme(key?: string | null): RoomTheme {
  return (key && ROOM_THEMES[key]) || ROOM_THEMES[DEFAULT_THEME_KEY]
}

// 화면 진입 시 깜빡임 방지용 캐시 (서버 값이 오면 덮어씀)
const CACHE_KEY = "haedori:room-theme"

export function readCachedThemeKey(): string {
  try {
    return localStorage.getItem(CACHE_KEY) || DEFAULT_THEME_KEY
  } catch {
    return DEFAULT_THEME_KEY
  }
}

export function writeCachedThemeKey(key: string) {
  try {
    localStorage.setItem(CACHE_KEY, key)
  } catch {
    // 저장 실패는 무시 (다음 진입 때 서버 값으로 다시 맞춰짐)
  }
}
