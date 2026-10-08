import React from "react";

/**
 * 해도리 날씨 하늘 타일
 *
 * 물 위에 누운 해달이 올려다본 하늘 한 조각.
 *
 * 그림체 규칙 (해도리 일러스트와 맞춤):
 *   - 모든 주요 형태에 모카색 외곽선 (#C4A182, 2px)
 *   - 따뜻한 파스텔 채색. 차가운 회청색 금지.
 *   - 빗방울/눈송이 같은 작은 요소는 외곽선 생략 (작은 크기에서 뭉개짐)
 *
 * 감정 조약돌과의 구분 규칙:
 *   - 돌은 불규칙한 타원, 표정이 있다. 감정은 사용자의 것이다.
 *   - 하늘은 반듯한 사각 타일, 표정이 없다. 날씨는 세상의 것이다.
 */

/* ------------------------------------------------------------------ */
/* 날씨 정의                                                            */
/*                                                                     */
/* key 값은 DB의 diary_entries.weather 에 그대로 저장됩니다.             */
/* 기존 값(sunny/cloudy/rainy/snowy/windy)을 유지하므로                  */
/* 마이그레이션이 필요 없습니다.                                          */
/* ------------------------------------------------------------------ */

export type WeatherKey = "sunny" | "cloudy" | "rainy" | "snowy" | "windy";

export interface Weather {
  key: WeatherKey;
  label: string;
  /** 하늘 배경색 */
  sky: string;
}

/** 해도리 일러스트 외곽선 색 */
const LINE = "#C4A182";
const LINE_WIDTH = 2;

/** 구름 채색 */
const CLOUD_FILL = "#FDFAF6";

export const WEATHERS: Weather[] = [
  { key: "sunny", label: "맑음", sky: "#CCE8F4" },
  { key: "cloudy", label: "흐림", sky: "#E8E2DB" },
  { key: "rainy", label: "비", sky: "#BFDAE8" },
  { key: "snowy", label: "눈", sky: "#E4EDF2" },
  { key: "windy", label: "바람", sky: "#D5E8DD" },
];

export const WEATHER_MAP: Record<WeatherKey, Weather> = WEATHERS.reduce(
  (acc, w) => ({ ...acc, [w.key]: w }),
  {} as Record<WeatherKey, Weather>
);

export const FALLBACK_WEATHER: WeatherKey = "sunny";

export function isWeatherKey(value: unknown): value is WeatherKey {
  return typeof value === "string" && value in WEATHER_MAP;
}

/* ------------------------------------------------------------------ */
/* 하늘 속 요소                                                         */
/* ------------------------------------------------------------------ */

/**
 * 뭉게구름.
 * 원 여러 개가 아니라 단일 path 입니다.
 * 원을 겹치면 외곽선이 구름 안쪽까지 그어져서 라인아트가 지저분해집니다.
 */
const CLOUD_PATH =
  "M-16,9 C-24,9 -24,-2 -15,-2 C-15,-11 -3,-14 2,-8 C6,-13 16,-11 15,-2 C22,-1 22,9 15,9 Z";

const Cloud = ({ y = 0, scale = 1 }: { y?: number; scale?: number }) => (
  <g transform={`translate(0,${y}) scale(${scale})`}>
    <path
      d={CLOUD_PATH}
      fill={CLOUD_FILL}
      stroke={LINE}
      // scale이 걸리면 선도 같이 줄어드므로 보정
      strokeWidth={LINE_WIDTH / scale}
      strokeLinejoin="round"
    />
  </g>
);

const SKIES: Record<WeatherKey, React.ReactNode> = {
  sunny: (
    <circle
      cx={0}
      cy={0}
      r={13}
      fill="#F9CE8A"
      stroke={LINE}
      strokeWidth={LINE_WIDTH}
    />
  ),

  cloudy: <Cloud />,

  rainy: (
    <>
      <Cloud y={-7} scale={0.82} />
      <g stroke="#7FA8BF" strokeWidth={3} strokeLinecap="round" fill="none">
        <path d="M-9,7 L-11,15" />
        <path d="M0,8 L-2,16" />
        <path d="M9,7 L7,15" />
      </g>
    </>
  ),

  snowy: (
    <>
      <Cloud y={-7} scale={0.82} />
      <g fill="#FFFFFF">
        <circle cx={-9} cy={10} r={3} />
        <circle cx={1} cy={15} r={3} />
        <circle cx={10} cy={9} r={3} />
      </g>
    </>
  ),

  windy: (
    <g stroke="#8FB5A2" strokeWidth={3.2} strokeLinecap="round" fill="none">
      <path d="M-15,-8 Q0,-13 11,-8 Q15,-6 13,-3" />
      <path d="M-15,1 Q2,-4 15,1" />
      <path d="M-15,10 Q-2,5 8,10 Q12,12 10,15" />
    </g>
  ),
};

/* ------------------------------------------------------------------ */
/* 타일 하나                                                            */
/* ------------------------------------------------------------------ */

interface WeatherTileProps {
  weather: WeatherKey | string;
  /** 한 변 길이(px). 기본 48 */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function WeatherTile({
  weather,
  size = 48,
  className,
  style,
}: WeatherTileProps) {
  const key = isWeatherKey(weather) ? weather : FALLBACK_WEATHER;
  const w = WEATHER_MAP[key];

  return (
    <svg
      width={size}
      height={size}
      viewBox="-32 -32 64 64"
      className={className}
      style={style}
      role="img"
      aria-label={w.label}
    >
      <rect
        x={-30}
        y={-30}
        width={60}
        height={60}
        rx={20}
        fill={w.sky}
        stroke={LINE}
        strokeWidth={LINE_WIDTH}
      />
      {SKIES[key]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 날씨 고르기                                                          */
/* ------------------------------------------------------------------ */

interface WeatherTilePickerProps {
  value: WeatherKey;
  onChange: (weather: WeatherKey) => void;
  label?: string;
  disabled?: boolean;
}

export function WeatherTilePicker({
  value,
  onChange,
  label = "오늘 날씨",
  disabled = false,
}: WeatherTilePickerProps) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1.5">
      {WEATHERS.map((w) => {
        const selected = value === w.key;

        return (
          <button
            key={w.key}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={w.label}
            disabled={disabled}
            onClick={() => onChange(w.key)}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 transition-all active:scale-95"
            style={{
              minWidth: 0,
              background: selected ? "#FFFCF8" : "transparent",
              border: selected
                ? "1.5px solid #C9856A"
                : "1.5px solid transparent",
              opacity: disabled ? 0.4 : selected ? 1 : 0.55,
            }}
          >
            <WeatherTile
              weather={w.key}
              size={selected ? 44 : 40}
              style={{ transition: "all 0.15s" }}
            />

            <span
              className="font-semibold whitespace-nowrap"
              style={{
                fontSize: "10px",
                color: selected ? "#C9856A" : "#9A8F87",
              }}
            >
              {w.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}