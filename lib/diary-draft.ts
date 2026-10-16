// /home/dori/diary-frontend/lib/diary-draft.ts
// 역할: 작성 중인 일기를 기기(localStorage)에 임시저장하고 복구하는 유틸
// - 키: 사용자 ID + 일기 날짜 + 일기 종류(질문형/자유형)
// - 새 글 초안과 수정 초안을 구분(mode, entryId, baseUpdatedAt)
// - 서버에는 아무것도 보내지 않음 → 진주 보상·답장·통계에 영향 없음

export type DraftDiaryType = "question" | "free"

export type DiaryDraft = {
  v: 1
  userId: string
  entryDate: string
  diaryType: DraftDiaryType
  // new: 아직 서버에 없는 일기 / edit: 저장된 일기를 고치는 중
  mode: "new" | "edit"
  entryId: number | null
  // 수정 초안을 만들 때 기준이 된 서버 일기의 updated_at (다른 곳에서 바뀌었는지 비교용)
  baseUpdatedAt: string | null
  content: string
  weather: string
  mood: string
  savedAt: number
}

const PREFIX = "haedori_diary_draft:"
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export function draftKey(
  userId: string,
  entryDate: string,
  diaryType: DraftDiaryType
) {
  return `${PREFIX}${userId}:${entryDate}:${diaryType}`
}

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null
    return window.localStorage
  } catch {
    return null
  }
}

export function loadDraft(
  userId: string,
  entryDate: string,
  diaryType: DraftDiaryType
): DiaryDraft | null {
  const s = storage()
  if (!s) return null

  try {
    const raw = s.getItem(draftKey(userId, entryDate, diaryType))
    if (!raw) return null

    const draft = JSON.parse(raw) as DiaryDraft
    if (draft?.v !== 1 || typeof draft.content !== "string") return null

    if (Date.now() - (draft.savedAt || 0) > MAX_AGE_MS) {
      s.removeItem(draftKey(userId, entryDate, diaryType))
      return null
    }

    return draft
  } catch {
    return null
  }
}

// 저장 성공 여부를 돌려준다 (용량 초과·사생활 보호 모드 등에서 실패할 수 있음)
export function saveDraft(draft: Omit<DiaryDraft, "v" | "savedAt">): boolean {
  const s = storage()
  if (!s) return false

  try {
    const value: DiaryDraft = { ...draft, v: 1, savedAt: Date.now() }
    s.setItem(
      draftKey(draft.userId, draft.entryDate, draft.diaryType),
      JSON.stringify(value)
    )
    return true
  } catch {
    return false
  }
}

export function removeDraft(
  userId: string,
  entryDate: string,
  diaryType: DraftDiaryType
) {
  const s = storage()
  if (!s) return

  try {
    s.removeItem(draftKey(userId, entryDate, diaryType))
  } catch {
    // 무시
  }
}

// 이 기기에 남아 있는 일기 초안 개수 (로그아웃 전 안내용)
export function countDrafts(): number {
  const s = storage()
  if (!s) return 0

  try {
    let count = 0
    for (let i = 0; i < s.length; i++) {
      const key = s.key(i)
      if (key && key.startsWith(PREFIX)) count++
    }
    return count
  } catch {
    return 0
  }
}

// 로그아웃 시 이 기기에 남은 모든 일기 초안 삭제
export function clearAllDrafts() {
  const s = storage()
  if (!s) return

  try {
    const keys: string[] = []
    for (let i = 0; i < s.length; i++) {
      const key = s.key(i)
      if (key && key.startsWith(PREFIX)) keys.push(key)
    }
    keys.forEach((key) => s.removeItem(key))
  } catch {
    // 무시
  }
}

// 오래된 초안 정리 (작성 화면 진입 시 호출)
export function pruneOldDrafts() {
  const s = storage()
  if (!s) return

  try {
    const now = Date.now()
    const stale: string[] = []
    for (let i = 0; i < s.length; i++) {
      const key = s.key(i)
      if (!key || !key.startsWith(PREFIX)) continue
      try {
        const draft = JSON.parse(s.getItem(key) || "null") as DiaryDraft | null
        if (!draft || now - (draft.savedAt || 0) > MAX_AGE_MS) stale.push(key)
      } catch {
        stale.push(key)
      }
    }
    stale.forEach((key) => s.removeItem(key))
  } catch {
    // 무시
  }
}
