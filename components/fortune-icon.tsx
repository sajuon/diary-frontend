import React from "react";

/**
 * 해도리 운세 아이콘
 *
 * 감정 조약돌 / 날씨 타일과 같은 그림체 규칙을 따릅니다.
 *   - 모카색 외곽선 (#C4A182)
 *   - 따뜻한 파스텔 채색
 *
 * 단, 조약돌·하늘과 달리 이쪽은 해달의 삶에서 나온 물건이 아닙니다.
 * 사주는 별개의 세계라 카테고리가 한눈에 읽히는 게 더 중요합니다.
 * 그래서 네 아이콘의 실루엣을 전부 다르게 잡았습니다.
 * (원, 하트, 주머니, 사각형 — 작은 크기에서도 구분됩니다)
 */

export type FortuneType = "daily" | "love" | "money" | "study";

const LINE = "#C4A182";

interface FortuneIconProps {
  type: FortuneType;
  /** 렌더 크기(px). 기본 44 */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** 오늘의 운세 — 수정구슬. 나머지 셋을 품는 상위 개념이라 받침대로 구분 */
const DailyGlobe = (
  <>
    <path
      d="M-15,20 Q-15,15 -9,14 L9,14 Q15,15 15,20 Z"
      fill="#E0C9AE"
      stroke={LINE}
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <circle cx={0} cy={-1} r={16} fill="#DCC9E8" stroke={LINE} strokeWidth={2} />
    <path
      d="M-8,-8 Q-4,-12 0,-11"
      stroke="#FBF7FD"
      strokeWidth={2.4}
      strokeLinecap="round"
      fill="none"
    />
    <circle cx={6} cy={4} r={2} fill="#FBF7FD" />
    <circle cx={-5} cy={6} r={1.4} fill="#FBF7FD" />
  </>
);

/** 연애운 — 하트. 여기서 다른 걸 찾으면 오히려 안 읽힙니다 */
const LoveHeart = (
  <>
    <path
      d="M0,19 C-13,9 -19,-1 -12,-8 C-6,-14 0,-9 0,-5 C0,-9 6,-14 12,-8 C19,-1 13,9 0,19 Z"
      fill="#F2AFC0"
      stroke={LINE}
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <path
      d="M-7,-6 Q-10,-3 -9,1"
      stroke="#FCE9EF"
      strokeWidth={2.4}
      strokeLinecap="round"
      fill="none"
    />
  </>
);

/** 재물운 — 복주머니. 동전보다 실루엣이 특징적입니다 */
const MoneyPouch = (
  <>
    <path
      d="M-14,-6 Q0,-13 14,-6 Q19,6 12,15 Q0,20 -12,15 Q-19,6 -14,-6 Z"
      fill="#F0D89A"
      stroke={LINE}
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <path
      d="M-14,-6 Q-8,-10 -4,-11 M4,-11 Q8,-10 14,-6"
      stroke={LINE}
      strokeWidth={2}
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M-6,-12 Q0,-16 6,-12"
      stroke={LINE}
      strokeWidth={2}
      strokeLinecap="round"
      fill="none"
    />
    <circle cx={0} cy={5} r={6.5} fill="#EFB945" stroke={LINE} strokeWidth={1.8} />
    <path
      d="M-3,5 L3,5 M0,2 L0,8"
      stroke="#FBF0D2"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </>
);

/** 학업운 — 펼친 책과 연필 */
const StudyBook = (
  <>
    <path
      d="M-17,-9 L-17,13 Q-9,10 -1,13 L-1,-6 Q-9,-9 -17,-9 Z"
      fill="#BFD8E4"
      stroke={LINE}
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <path
      d="M17,-9 L17,13 Q9,10 1,13 L1,-6 Q9,-9 17,-9 Z"
      fill="#A8C8D8"
      stroke={LINE}
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <path d="M-1,-6 L-1,13 M1,-6 L1,13" stroke={LINE} strokeWidth={1.6} />
    <g transform="translate(11,-14) rotate(24)">
      <path
        d="M-3,-8 L3,-8 L3,6 L0,11 L-3,6 Z"
        fill="#F0D89A"
        stroke={LINE}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <path d="M-3,6 L3,6" stroke={LINE} strokeWidth={1.6} />
      <path d="M-1.4,8.6 L1.4,8.6 L0,11 Z" fill="#8A6A4F" />
    </g>
  </>
);

const ICONS: Record<FortuneType, React.ReactNode> = {
  daily: DailyGlobe,
  love: LoveHeart,
  money: MoneyPouch,
  study: StudyBook,
};

const LABELS: Record<FortuneType, string> = {
  daily: "오늘의 운세",
  love: "연애운",
  money: "재물운",
  study: "학업운",
};

export function FortuneIcon({
  type,
  size = 44,
  className,
  style,
}: FortuneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-26 -26 52 52"
      className={className}
      style={style}
      role="img"
      aria-label={LABELS[type]}
    >
      {ICONS[type]}
    </svg>
  );
}