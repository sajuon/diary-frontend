// 전날 일기 마감 시각 (KST). BE의 LETTER_GENERATE_HOUR(.env)와 같은 값이어야 한다.
// 자정 ~ 이 시각 사이의 전날 일기는 아직 답장 배치 전이라 "답장 쓰는 중"으로 보여준다.
export const DIARY_DAY_CUTOFF_HOUR = 3

function kstParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ""
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
  }
}

function previousDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d - 1))
  return dt.toISOString().slice(0, 10)
}

/** 아직 자동 답장 배치 전인 날짜인지 (오늘, 또는 마감 전의 전날) */
export function isLetterPendingDate(dateStr: string, now = new Date()) {
  const { date, hour } = kstParts(now)
  if (dateStr === date) return true
  return hour < DIARY_DAY_CUTOFF_HOUR && dateStr === previousDate(date)
}
