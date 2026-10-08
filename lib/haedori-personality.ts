// 해도리 성격 4가지의 화면 표시용 색. 이름·설명·간식 정보는 백엔드(/api/haedori)가 준다.
import type { HaedoriTrait } from "@/lib/api"

export const TRAIT_ORDER: HaedoriTrait[] = ["cheer", "listen", "playful", "advice"]

export const TRAIT_STYLE: Record<HaedoriTrait, { color: string; bg: string; bar: string }> = {
  cheer: { color: "#C65A2A", bg: "#FFE9DE", bar: "#F0956A" },
  listen: { color: "#B8506E", bg: "#FFE6EE", bar: "#EE9AB3" },
  playful: { color: "#5A68C2", bg: "#E8EBFF", bar: "#97A3F0" },
  advice: { color: "#3F7D5A", bg: "#E2F4EA", bar: "#86C4A0" },
}

export const TRAIT_SHORT: Record<HaedoriTrait, { name: string; emoji: string }> = {
  cheer: { name: "응원단장", emoji: "📣" },
  listen: { name: "들어주는 친구", emoji: "🫂" },
  playful: { name: "장난꾸러기", emoji: "😜" },
  advice: { name: "현실 조언러", emoji: "🧠" },
}

/** 간식 카드 배경색 */
export const SNACK_BG: Record<string, string> = {
  strawberry_cake: "#F0C4C4",
  honey_pot: "#F4D9A0",
  bubble_tea: "#C8D8E8",
  tangerine: "#F4E8A8",
  macaron: "#F2C4A8",
  cookie_box: "#D4B8A8",
}
