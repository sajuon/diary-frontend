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
  listen: { name: "들어주는 친구", emoji: "🤗" },
  playful: { name: "장난꾸러기", emoji: "😜" },
  advice: { name: "현실 조언러", emoji: "🧠" },
}

/** 성격별 해도리 말풍선 (해도리를 누를 때마다 바뀜) */
export const NEUTRAL_LINES = [
  "오늘 하루는 어땠어?",
  "오늘도 와줘서 고마워!",
  "해도리가 네 이야기를 기다리고 있어.",
  "무리하지 말고 천천히 가도 돼.",
  "간식 먹으면 어떤 해도리가 될까?",
  "마음이 복잡하면 천천히 말해줘.",
]

export const PERSONALITY_LINES: Record<HaedoriTrait, string[]> = {
  cheer: [
    "왔다!! 오늘도 내가 제일 먼저 응원할게!",
    "오늘 하루도 버틴 거 진짜 대단해!!",
    "할 수 있어! 아니 이미 하고 있어!",
    "힘 빠지면 말해. 내가 소리 질러줄게 📣",
    "오늘의 너한테 박수 백 번 👏",
    "작은 거라도 해냈으면 그건 이긴 거야!",
  ],
  listen: [
    "오늘 하루는 어땠어? 천천히 말해도 돼.",
    "무슨 일이 있었는지 다 들어줄게.",
    "힘든 날이면 그냥 여기 있어도 괜찮아.",
    "말 안 해도 괜찮아. 옆에 있을게.",
    "오늘 마음은 어떤 색이야?",
    "네 얘기라면 언제든 좋아.",
  ],
  playful: [
    "왔어? 나 방금 조개 떨어뜨렸어ㅋㅋ",
    "오늘 재밌는 일 없었어? 없으면 지어내도 돼ㅋㅋ",
    "나 물에 둥둥 떠서 낮잠 잤다~",
    "심심했지? 나도ㅋㅋ",
    "오늘 너 표정 맞혀볼까? 음… 배고픈 얼굴!",
    "간식 숨겨둔 거 있으면 나만 알려줘ㅋㅋ",
  ],
  advice: [
    "오늘 할 일 중에 딱 하나만 골라볼까?",
    "급한 것부터 하나씩 정리해보자.",
    "어제보다 1%만 나아지면 충분해.",
    "막히는 게 있으면 같이 쪼개보자.",
    "오늘은 몇 시에 쉴 건지 정해뒀어?",
    "할 일은 짧게 적어두면 머리가 가벼워져.",
  ],
}

export function linesFor(primary: HaedoriTrait | null, secondary: HaedoriTrait | null): string[] {
  if (!primary) return NEUTRAL_LINES
  return secondary ? [...PERSONALITY_LINES[primary], ...PERSONALITY_LINES[secondary].slice(0, 3)] : PERSONALITY_LINES[primary]
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
