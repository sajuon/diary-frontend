const INVALIDATED_DIARY_MONTHS_KEY = "invalidated_diary_months"

function readInvalidatedMonths(): string[] {
  if (typeof window === "undefined") return []

  try {
    const raw = sessionStorage.getItem(INVALIDATED_DIARY_MONTHS_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeInvalidatedMonths(months: string[]) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(INVALIDATED_DIARY_MONTHS_KEY, JSON.stringify(months))
}

export function getDiaryMonthKeyFromDate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export function invalidateDiaryMonth(monthKey: string) {
  if (typeof window === "undefined") return

  const months = new Set(readInvalidatedMonths())
  months.add(monthKey)
  writeInvalidatedMonths([...months])

  window.dispatchEvent(
    new CustomEvent("diary-month-invalidated", {
      detail: { monthKey },
    })
  )
}

export function isDiaryMonthInvalidated(monthKey: string) {
  return readInvalidatedMonths().includes(monthKey)
}

export function clearDiaryMonthInvalidation(monthKey: string) {
  const months = readInvalidatedMonths().filter((m) => m !== monthKey)
  writeInvalidatedMonths(months)
}