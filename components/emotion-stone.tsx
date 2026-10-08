import React from "react";

/**
 * 해도리 감정 조약돌
 *
 * 해달은 마음에 드는 돌 하나를 겨드랑이 주머니에 넣고 다닌다.
 * 사용자는 매일 감정 돌을 하나 골라 해도리에게 건네고,
 * 해도리는 그 돌을 배 위에 올려둔 채 편지를 쓴다.
 */

/* ------------------------------------------------------------------ */
/* 감정 정의 — 프론트/백엔드 공통 계약                                    */
/*                                                                     */
/* key 값은 DB의 diary_entries.mood_tags 배열에 그대로 저장됩니다.        */
/* 한글 label은 절대 저장하지 마세요. 문구만 바꾸고 싶을 때 막힙니다.       */
/* 백엔드 app/schemas/diary.py 의 MoodTag Enum 과 반드시 일치해야 합니다.  */
/* ------------------------------------------------------------------ */

export type EmotionKey =
  | "happy"
  | "excited"
  | "calm"
  | "grateful"
  | "proud"
  | "neutral"
  | "blank"
  | "tired"
  | "worried"
  | "sad"
  | "upset"
  | "lonely"
  | "angry";

export type EmotionTone = "positive" | "neutral" | "negative";

export interface Emotion {
  key: EmotionKey;
  label: string;
  color: string;
  tone: EmotionTone;
  /** 돌을 살짝 기울여 표정을 보조합니다 (deg) */
  tilt?: number;
}

const INK = "#453B36";
const INK_OPACITY = 0.85;

const stroke = {
  stroke: INK,
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
  opacity: INK_OPACITY,
};

const Dot = ({ cx, cy, r = 2.6 }: { cx: number; cy: number; r?: number }) => (
  <circle cx={cx} cy={cy} r={r} fill={INK} opacity={INK_OPACITY} />
);

/** 조약돌 실루엣 — 13종 전부 이 하나를 공유합니다 */
const STONE_PATH =
  "M-38,2 C-38,-18 -20,-30 2,-30 C24,-30 38,-16 38,4 C38,22 22,30 0,30 C-22,30 -38,20 -38,2 Z";

export const EMOTIONS: Emotion[] = [
  { key: "happy", label: "행복", color: "#F2B84B", tone: "positive" },
  { key: "excited", label: "설렘", color: "#EFA0B4", tone: "positive" },
  { key: "calm", label: "평온", color: "#9DC49A", tone: "positive" },
  { key: "grateful", label: "감사", color: "#B6A5D6", tone: "positive", tilt: -8 },
  { key: "proud", label: "뿌듯함", color: "#EE9463", tone: "positive" },
  { key: "neutral", label: "무덤덤", color: "#C2BFB4", tone: "neutral" },
  { key: "blank", label: "멍함", color: "#B3C0CB", tone: "neutral" },
  { key: "tired", label: "피곤", color: "#C6B49B", tone: "negative" },
  { key: "worried", label: "걱정", color: "#93B9BE", tone: "negative" },
  { key: "sad", label: "슬픔", color: "#A0BDD2", tone: "negative" },
  { key: "upset", label: "속상함", color: "#8BA0C6", tone: "negative" },
  { key: "lonely", label: "외로움", color: "#7A86A8", tone: "negative", tilt: 7 },
  { key: "angry", label: "화남", color: "#C87A6C", tone: "negative" },
];

export const EMOTION_MAP: Record<EmotionKey, Emotion> = EMOTIONS.reduce(
  (acc, e) => ({ ...acc, [e.key]: e }),
  {} as Record<EmotionKey, Emotion>
);

/** 4-5-4 배치. 격자보다 조약돌 무더기처럼 보입니다. */
const PICKER_ROWS: EmotionKey[][] = [
  ["happy", "excited", "calm", "grateful"],
  ["proud", "neutral", "blank", "tired", "worried"],
  ["sad", "upset", "lonely", "angry"],
];

/** 알 수 없는 값이 들어왔을 때 (구버전 데이터, 손상된 값) 쓸 기본값 */
export const FALLBACK_EMOTION: EmotionKey = "calm";

export function isEmotionKey(value: unknown): value is EmotionKey {
  return typeof value === "string" && value in EMOTION_MAP;
}

/* ------------------------------------------------------------------ */
/* 표정                                                                */
/* ------------------------------------------------------------------ */

const FACES: Record<EmotionKey, React.ReactNode> = {
  happy: (
    <>
      <Dot cx={-12} cy={-5} r={2.8} />
      <Dot cx={12} cy={-5} r={2.8} />
      <path d="M-9,6 Q0,15 9,6" {...stroke} />
    </>
  ),
  excited: (
    <>
      <ellipse cx={-22} cy={6} rx={5} ry={3.5} fill="#FFFFFF" opacity={0.4} />
      <ellipse cx={22} cy={6} rx={5} ry={3.5} fill="#FFFFFF" opacity={0.4} />
      <Dot cx={-12} cy={-6} r={2.8} />
      <Dot cx={12} cy={-6} r={2.8} />
      <ellipse cx={0} cy={8} rx={4} ry={4} fill={INK} opacity={INK_OPACITY} />
    </>
  ),
  calm: (
    <>
      <path d="M-17,-6 Q-12,0 -7,-6" {...stroke} />
      <path d="M7,-6 Q12,0 17,-6" {...stroke} />
      <path d="M-6,8 Q0,13 6,8" {...stroke} />
    </>
  ),
  grateful: (
    <>
      <path d="M-17,-4 Q-12,-11 -7,-4" {...stroke} />
      <path d="M7,-4 Q12,-11 17,-4" {...stroke} />
      <path d="M-5,8 Q0,12 5,8" {...stroke} />
    </>
  ),
  proud: (
    <>
      <path d="M-18,-5 Q-12,-10 -6,-5" {...stroke} />
      <path d="M6,-5 Q12,-10 18,-5" {...stroke} />
      <path d="M-8,9 Q2,15 11,5" {...stroke} />
    </>
  ),
  neutral: (
    <>
      <Dot cx={-12} cy={-5} />
      <Dot cx={12} cy={-5} />
      <path d="M-6,9 L6,9" {...stroke} />
    </>
  ),
  blank: (
    <>
      <Dot cx={-12} cy={-5} r={2.1} />
      <Dot cx={12} cy={-5} r={2.1} />
      <circle cx={0} cy={9} r={3} {...stroke} />
    </>
  ),
  tired: (
    <>
      <path d="M-17,-5 L-7,-5" {...stroke} />
      <path d="M7,-5 L17,-5" {...stroke} />
      <path d="M-8,9 Q-4,5 0,9 Q4,13 8,9" {...stroke} />
    </>
  ),
  worried: (
    <>
      <path d="M-18,-12 L-8,-14" {...stroke} />
      <path d="M8,-14 L18,-12" {...stroke} />
      <Dot cx={-12} cy={-4} />
      <Dot cx={12} cy={-4} />
      <path d="M-6,10 Q0,6 6,10" {...stroke} />
    </>
  ),
  sad: (
    <>
      <path d="M-19,-8 L-7,-13" {...stroke} />
      <path d="M7,-13 L19,-8" {...stroke} />
      <Dot cx={-12} cy={-3} />
      <Dot cx={12} cy={-3} />
      <path d="M-6,11 Q0,7 6,11" {...stroke} />
      <path d="M-12,3 Q-16,9 -12,12 Q-8,9 -12,3 Z" fill="#FFFFFF" opacity={0.75} />
    </>
  ),
  upset: (
    <>
      <Dot cx={-12} cy={-4} />
      <Dot cx={12} cy={-4} />
      <path d="M-7,12 Q0,4 7,12" {...stroke} />
    </>
  ),
  lonely: (
    <>
      <path d="M-17,-3 Q-12,1 -7,-3" {...stroke} />
      <path d="M7,-3 Q12,1 17,-3" {...stroke} />
      <path d="M-5,10 L5,10" {...stroke} />
    </>
  ),
  angry: (
    <>
      <path d="M-19,-13 L-7,-7" {...stroke} />
      <path d="M7,-7 L19,-13" {...stroke} />
      <Dot cx={-12} cy={-2} />
      <Dot cx={12} cy={-2} />
      <path d="M-7,12 Q0,5 7,12" {...stroke} />
    </>
  ),
};

/* ------------------------------------------------------------------ */
/* 돌 하나                                                              */
/* ------------------------------------------------------------------ */

interface EmotionStoneProps {
  emotion: EmotionKey | string;
  /** 렌더 폭(px). 기본 64 */
  size?: number;
  /** 표정 없이 돌만 (보관함에서 밀도 낮출 때) */
  faceless?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function EmotionStone({
  emotion,
  size = 64,
  faceless = false,
  className,
  style,
}: EmotionStoneProps) {
  const key = isEmotionKey(emotion) ? emotion : FALLBACK_EMOTION;
  const e = EMOTION_MAP[key];

  return (
    <svg
      width={size}
      height={size * (72 / 88)}
      viewBox="-44 -36 88 72"
      className={className}
      style={style}
      role="img"
      aria-label={e.label}
    >
      <g transform={e.tilt ? `rotate(${e.tilt})` : undefined}>
        <path d={STONE_PATH} fill={e.color} />
        {!faceless && FACES[key]}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 돌 고르기                                                            */
/*                                                                     */
/* 스타일은 diary-screen 의 날씨 선택 버튼과 같은 언어를 씁니다.           */
/* (선택: 흰 카드 + 감정색 테두리 / 미선택: 흐린 테두리 + 반투명)          */
/* ------------------------------------------------------------------ */

interface EmotionStonePickerProps {
  value: EmotionKey;
  onChange: (emotion: EmotionKey) => void;
  label?: string;
  disabled?: boolean;
}

export function EmotionStonePicker({
  value,
  onChange,
  label = "오늘의 돌",
  disabled = false,
}: EmotionStonePickerProps) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-1.5">
      {PICKER_ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1.5">
          {row.map((key) => {
            const e = EMOTION_MAP[key];
            const selected = value === key;

            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={e.label}
                disabled={disabled}
                onClick={() => onChange(key)}
                className="flex flex-col items-center gap-0.5 rounded-2xl py-2 transition-all active:scale-95"
                style={{
                  width: "19%",
                  minWidth: 0,
                  background: selected ? "#FFFCF8" : "transparent",
                  border: selected
                    ? `1.5px solid ${e.color}`
                    : "1.5px solid transparent",
                  opacity: disabled ? 0.4 : selected ? 1 : 0.55,
                }}
              >
                <EmotionStone
                  emotion={key}
                  size={selected ? 48 : 44}
                  style={{ transition: "all 0.15s" }}
                />

                <span
                  className="font-semibold whitespace-nowrap"
                  style={{
                    fontSize: "10px",
                    color: selected ? "#3D3530" : "#9A8F87",
                  }}
                >
                  {e.label}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}