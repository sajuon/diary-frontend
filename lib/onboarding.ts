// /home/dori/diary-frontend/lib/onboarding.ts
// 역할: 첫 사용자 소개(온보딩) 진행 상태를 기기(localStorage)에 저장
// - 회원가입을 마친 신규 사용자에게만 자동으로 보여준다 (기존 사용자·재로그인은 안 띄움)
// - 일기 초안과 분리된 키를 쓴다 → 로그아웃해도 유지, 초안 삭제와 무관
// - 이름·생년월일·일기 내용 같은 개인정보는 저장하지 않는다
// - 저장이 실패해도 앱 진입을 막지 않고, 이번 실행에서는 다시 띄우지 않는다
// - 상태는 계정(user id)별로 따로 저장한다 → 같은 기기의 다른 계정과 섞이지 않음
//   로그인·세션 복구 직후 setOnboardingUser(me)로 현재 계정을 지정해야 한다

export const ONBOARDING_FLOW_ID = "haedori_intro"
export const ONBOARDING_SCHEMA_VERSION = 1
export const ONBOARDING_CONTENT_VERSION = "v1"
export const ONBOARDING_TOTAL_STEPS = 3

export type OnboardingStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped"

export type OnboardingState = {
  flow_id: typeof ONBOARDING_FLOW_ID
  schema_version: number
  content_version: string
  status: OnboardingStatus
  last_step: number
  completed_at: string | null
  skipped_at: string | null
}

// 예전 공용 키 (계정 구분 없음) — 어느 계정 것인지 알 수 없어 지운다
const LEGACY_STATE_KEY = "haedori_onboarding"
const LEGACY_SHOWN_KEY = "haedori_onboarding_shown"
// 계정별 상태: haedori_onboarding:{userId}
const STATE_KEY_PREFIX = "haedori_onboarding:"
// 현재 로그인한 계정 (이 기기에서 마지막으로 확인된 계정)
const ACTIVE_USER_KEY = "haedori_onboarding_user"
// 저장이 실패했을 때 이번 실행(탭)에서 중복 노출을 막는 표시 (계정별)
const SHOWN_THIS_RUN_PREFIX = "haedori_onboarding_shown:"
const shownThisRun = new Set<string>()
let memoryActiveUser: string | null = null

// 서버가 is_new_user를 주지 않을 때(구버전 서버)만 쓰는 보조 판단:
// 이 시간 안에 만들어진 계정이면 신규 가입으로 본다
const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000

function local(): Storage | null {
  try {
    if (typeof window === "undefined") return null
    return window.localStorage
  } catch {
    return null
  }
}

function session(): Storage | null {
  try {
    if (typeof window === "undefined") return null
    return window.sessionStorage
  } catch {
    return null
  }
}

function toUserId(meOrId: unknown): string | null {
  const raw =
    meOrId && typeof meOrId === "object" ? (meOrId as { id?: unknown }).id : meOrId
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw)
  if (typeof raw === "string" && raw.trim()) return raw.trim()
  return null
}

/**
 * 현재 계정 지정. 로그인·세션 복구로 /me를 받은 직후 호출한다.
 * getMe() 응답이나 user id를 그대로 넘기면 된다.
 */
export function setOnboardingUser(meOrId: unknown): string | null {
  const userId = toUserId(meOrId)
  memoryActiveUser = userId
  const s = local()
  if (s) {
    try {
      if (userId) s.setItem(ACTIVE_USER_KEY, userId)
      else s.removeItem(ACTIVE_USER_KEY)
      s.removeItem(LEGACY_STATE_KEY)
    } catch {
      // 무시 (메모리 값으로 이번 실행은 동작)
    }
  }
  try {
    session()?.removeItem(LEGACY_SHOWN_KEY)
  } catch {
    // 무시
  }
  return userId
}

/** 로그아웃 시 현재 계정 지정 해제 (계정별 진행 상태는 남겨둔다) */
export function clearOnboardingUser() {
  memoryActiveUser = null
  try {
    local()?.removeItem(ACTIVE_USER_KEY)
  } catch {
    // 무시
  }
}

function activeUser(): string | null {
  if (memoryActiveUser) return memoryActiveUser
  try {
    const stored = local()?.getItem(ACTIVE_USER_KEY)
    if (stored) {
      memoryActiveUser = stored
      return stored
    }
  } catch {
    // 무시
  }
  return null
}

function defaultState(): OnboardingState {
  return {
    flow_id: ONBOARDING_FLOW_ID,
    schema_version: ONBOARDING_SCHEMA_VERSION,
    content_version: ONBOARDING_CONTENT_VERSION,
    status: "not_started",
    last_step: 1,
    completed_at: null,
    skipped_at: null,
  }
}

function clampStep(step: number) {
  if (!Number.isFinite(step)) return 1
  return Math.min(ONBOARDING_TOTAL_STEPS, Math.max(1, Math.round(step)))
}

/** 저장된 상태. 저장된 적이 없으면 null (= 신규 가입 표시가 없음 → 자동 노출 안 함) */
function readStored(): OnboardingState | null {
  const s = local()
  const userId = activeUser()
  if (!s || !userId) return null

  try {
    const raw = s.getItem(STATE_KEY_PREFIX + userId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<OnboardingState>
    if (parsed?.flow_id !== ONBOARDING_FLOW_ID) return null

    const status: OnboardingStatus =
      parsed.status === "in_progress" ||
      parsed.status === "completed" ||
      parsed.status === "skipped"
        ? parsed.status
        : "not_started"

    return {
      ...defaultState(),
      ...parsed,
      status,
      last_step: clampStep(Number(parsed.last_step ?? 1)),
    }
  } catch {
    return null
  }
}

export function readOnboarding(): OnboardingState {
  return readStored() ?? defaultState()
}

function writeOnboarding(state: OnboardingState): boolean {
  const s = local()
  const userId = activeUser()
  if (!s || !userId) return false

  try {
    s.setItem(STATE_KEY_PREFIX + userId, JSON.stringify(state))
    return true
  } catch (error) {
    console.warn("[onboarding] state save failed:", error)
    return false
  }
}

function markShownThisRun() {
  const userId = activeUser()
  if (!userId) return
  shownThisRun.add(userId)
  try {
    session()?.setItem(SHOWN_THIS_RUN_PREFIX + userId, "1")
  } catch {
    // 무시
  }
}

function wasShownThisRun() {
  const userId = activeUser()
  if (!userId) return false
  if (shownThisRun.has(userId)) return true
  try {
    return session()?.getItem(SHOWN_THIS_RUN_PREFIX + userId) === "1"
  } catch {
    return false
  }
}

/**
 * 소개를 자동으로 보여줄지.
 * 회원가입 직후 markOnboardingForNewUser()로 표시된 경우에만 true.
 * 보다가 앱을 껐으면 다음 진입 때 이어서 보여준다.
 */
export function shouldAutoShowOnboarding(): boolean {
  if (typeof window === "undefined") return false
  if (!activeUser()) return false
  if (wasShownThisRun()) return false
  const stored = readStored()
  if (!stored) return false
  return stored.status === "not_started" || stored.status === "in_progress"
}

/**
 * 신규 사용자 표시 → 다음 이동에서 소개를 보여준다 (현재 계정 기준)
 * 이 계정에 이미 기록(진행 중·완료·건너뜀)이 있으면 그대로 둔다
 * → 가입 직후 로그아웃→재로그인해도 다시 처음부터 뜨지 않음
 */
export function markOnboardingForNewUser() {
  if (!activeUser()) return
  if (readStored()) return
  writeOnboarding(defaultState())
}

/**
 * 이번 로그인으로 계정이 새로 만들어졌는지.
 * 서버의 is_new_user를 우선하고, 없으면(구버전 서버) 계정 생성 시각으로 추정한다.
 */
export function isNewUserLogin(authResult: unknown, me: unknown): boolean {
  const flag =
    authResult && typeof authResult === "object"
      ? (authResult as { is_new_user?: unknown }).is_new_user
      : undefined
  if (typeof flag === "boolean") return flag
  const createdAt =
    me && typeof me === "object" ? (me as { created_at?: unknown }).created_at : undefined
  return isNewlyCreatedAccount(createdAt)
}

/** 계정 생성 시각이 방금이면 신규 가입으로 본다 (is_new_user가 없을 때의 보조 판단) */
export function isNewlyCreatedAccount(createdAt: unknown): boolean {
  if (typeof createdAt !== "string" || !createdAt) return false
  // 서버가 시간대 없이 내려주면 UTC로 본다
  const hasZone = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(createdAt)
  const time = Date.parse(hasZone ? createdAt : `${createdAt}Z`)
  if (!Number.isFinite(time)) return false
  return Math.abs(Date.now() - time) <= NEW_ACCOUNT_WINDOW_MS
}

/** 자동 노출을 시작할 단계 (진행 중이었으면 그 단계부터) */
export function getResumeStep(): number {
  const state = readOnboarding()
  return state.status === "in_progress" ? state.last_step : 1
}

/** 다음·이전으로 이동할 때 단계 저장 (자동 노출 중에만 호출) */
export function saveOnboardingStep(step: number) {
  const prev = readOnboarding()
  if (prev.status === "completed" || prev.status === "skipped") return
  writeOnboarding({
    ...prev,
    status: "in_progress",
    last_step: clampStep(step),
    completed_at: null,
    skipped_at: null,
  })
}

/** 마지막 장 버튼을 눌렀을 때만 호출 */
export function markOnboardingCompleted() {
  const ok = writeOnboarding({
    ...readOnboarding(),
    content_version: ONBOARDING_CONTENT_VERSION,
    status: "completed",
    last_step: ONBOARDING_TOTAL_STEPS,
    completed_at: new Date().toISOString(),
    skipped_at: null,
  })
  markShownThisRun()
  return ok
}

/** 상단 건너뛰기 */
export function markOnboardingSkipped() {
  const prev = readOnboarding()
  const ok = writeOnboarding({
    ...prev,
    content_version: ONBOARDING_CONTENT_VERSION,
    status: "skipped",
    completed_at: null,
    skipped_at: new Date().toISOString(),
  })
  markShownThisRun()
  return ok
}

// ---------- 로그인·회원가입 후 이동 ----------

/** 로그인·회원가입 성공 후 이동할 경로 (신규 가입이면 소개부터). setOnboardingUser() 이후 호출 */
export function postAuthPath(): string {
  return shouldAutoShowOnboarding() ? "/intro" : "/home"
}
