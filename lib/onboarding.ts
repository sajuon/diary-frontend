// /home/dori/diary-frontend/lib/onboarding.ts
// 역할: 첫 사용자 소개(온보딩) 진행 상태를 기기(localStorage)에 저장
// - 회원가입을 마친 신규 사용자에게만 자동으로 보여준다 (기존 사용자·재로그인은 안 띄움)
// - 일기 초안과 분리된 키를 쓴다 → 로그아웃해도 유지, 초안 삭제와 무관
// - 이름·생년월일·일기 내용 같은 개인정보는 저장하지 않는다
// - 저장이 실패해도 앱 진입을 막지 않고, 이번 실행에서는 다시 띄우지 않는다

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

const STATE_KEY = "haedori_onboarding"
// 저장이 실패했을 때 이번 실행(탭)에서 중복 노출을 막는 표시
const SHOWN_THIS_RUN_KEY = "haedori_onboarding_shown"
let shownThisRun = false

// 이 시간 안에 만들어진 계정이면 신규 가입으로 본다
// (로그인 화면의 카카오·구글 로그인도 처음이면 계정을 새로 만든다)
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
  if (!s) return null

  try {
    const raw = s.getItem(STATE_KEY)
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
  if (!s) return false

  try {
    s.setItem(STATE_KEY, JSON.stringify(state))
    return true
  } catch (error) {
    console.warn("[onboarding] state save failed:", error)
    return false
  }
}

function markShownThisRun() {
  shownThisRun = true
  try {
    session()?.setItem(SHOWN_THIS_RUN_KEY, "1")
  } catch {
    // 무시
  }
}

function wasShownThisRun() {
  if (shownThisRun) return true
  try {
    return session()?.getItem(SHOWN_THIS_RUN_KEY) === "1"
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
  if (wasShownThisRun()) return false
  const stored = readStored()
  if (!stored) return false
  return stored.status === "not_started" || stored.status === "in_progress"
}

/**
 * 신규 사용자 표시 → 다음 이동에서 소개를 보여준다
 * - signup: 회원가입 화면을 마친 경우. 같은 기기에서 다른 사람이 이미 봤어도 새 사용자니까 다시 보여준다
 * - login: 로그인 화면의 소셜 로그인으로 계정이 막 생긴 경우. 이 기기에 기록이 없을 때만
 *   (가입 직후 로그아웃→재로그인으로 다시 뜨는 것 방지)
 */
export function markOnboardingForNewUser(source: "signup" | "login") {
  const stored = readStored()
  if (stored?.status === "in_progress") return
  if (source === "login" && stored) return
  writeOnboarding(defaultState())
}

/** 계정 생성 시각이 방금이면 신규 가입으로 본다 */
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

/** 로그인·회원가입 성공 후 이동할 경로 (신규 가입이면 소개부터) */
export function postAuthPath(): string {
  return shouldAutoShowOnboarding() ? "/intro" : "/home"
}
