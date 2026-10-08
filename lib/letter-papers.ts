// 해도리 편지지. 키는 백엔드 shop_items.item_key(item_type='letter_paper')와 같아야 한다.
// "default"는 무료 기본 편지지.

export type LetterPaper = {
  key: string
  name: string
  background: string
  /** 줄·모눈 같은 종이 무늬 (없으면 민무늬) */
  pattern?: { image: string; size: string; position?: string }
  border: string
  text: string
  shadow: string
  /** 모서리 장식 */
  corners?: { topLeft?: string; bottomRight?: string }
  /** 오른쪽 위 우표 */
  stamp?: { emoji: string; background: string; border: string }
}

export const DEFAULT_PAPER_KEY = "default"

// 편지 본문 줄 간격 (px). 줄노트의 줄과 글자 줄을 맞추는 데 쓴다.
export const LETTER_LINE_HEIGHT = 27

export const LETTER_PAPERS: Record<string, LetterPaper> = {
  default: {
    key: "default",
    name: "크림 편지지",
    background: "#FFFCF8",
    border: "1.5px solid #E5DDD5",
    text: "#3D3530",
    shadow: "0 4px 20px rgba(0,0,0,0.05)",
  },

  lined: {
    key: "lined",
    name: "줄노트",
    background: "#FFFDF7",
    pattern: {
      image: `linear-gradient(90deg, transparent 15px, rgba(232,150,150,0.35) 15px 16px, transparent 16px), repeating-linear-gradient(180deg, transparent 0 ${LETTER_LINE_HEIGHT - 1}px, rgba(160,184,212,0.45) ${LETTER_LINE_HEIGHT - 1}px ${LETTER_LINE_HEIGHT}px)`,
      size: "auto",
      position: "0 0, 0 22px",
    },
    border: "1.5px solid #E6E1D6",
    text: "#3D3530",
    shadow: "0 4px 20px rgba(0,0,0,0.05)",
  },

  grid: {
    key: "grid",
    name: "모눈 노트",
    background: "#FDFDFA",
    pattern: {
      image:
        "linear-gradient(rgba(150,186,164,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(150,186,164,0.25) 1px, transparent 1px)",
      size: "18px 18px",
    },
    border: "1.5px solid #DDE6DE",
    text: "#3D3530",
    shadow: "0 4px 20px rgba(0,0,0,0.05)",
  },

  flower: {
    key: "flower",
    name: "꽃 편지",
    background: "linear-gradient(180deg, #FFF7F8 0%, #FFF1F3 100%)",
    border: "1.5px solid #F4CBD4",
    text: "#4A3A3D",
    shadow: "0 4px 20px rgba(214,140,160,0.12)",
    corners: { topLeft: "🌸", bottomRight: "🌷" },
  },

  night_sky: {
    key: "night_sky",
    name: "밤하늘 편지",
    background: "linear-gradient(180deg, #2B3561 0%, #374680 100%)",
    pattern: {
      image:
        "radial-gradient(circle, rgba(255,236,170,0.9) 1px, transparent 1.6px), radial-gradient(circle, rgba(255,255,255,0.55) 0.8px, transparent 1.3px)",
      size: "52px 52px, 31px 31px",
    },
    border: "1.5px solid rgba(255,255,255,0.14)",
    text: "#F4EFE6",
    shadow: "0 6px 24px rgba(30,38,80,0.3)",
    corners: { bottomRight: "🌙" },
  },

  sea_stamp: {
    key: "sea_stamp",
    name: "바다 우표",
    background: "linear-gradient(180deg, #F0F8FC 0%, #E4F1F8 100%)",
    border: "1.5px solid #C4DFEC",
    text: "#2F4550",
    shadow: "0 4px 20px rgba(90,150,180,0.12)",
    stamp: { emoji: "🐚", background: "#FFFDF7", border: "2px dashed #9CC6DA" },
  },
}

export function getLetterPaper(key?: string | null): LetterPaper {
  return (key && LETTER_PAPERS[key]) || LETTER_PAPERS[DEFAULT_PAPER_KEY]
}

const CACHE_KEY = "haedori:letter-paper"

export function readCachedPaperKey(): string {
  try {
    return localStorage.getItem(CACHE_KEY) || DEFAULT_PAPER_KEY
  } catch {
    return DEFAULT_PAPER_KEY
  }
}

export function writeCachedPaperKey(key: string) {
  try {
    localStorage.setItem(CACHE_KEY, key)
  } catch {
    // 저장 실패는 무시 (다음 진입 때 서버 값으로 다시 맞춰짐)
  }
}
