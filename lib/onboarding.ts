// /home/dori/diary-frontend/lib/onboarding.ts
// 역할: 첫 사용자 소개(온보딩) 진행 상태를 기기(localStorage)에 저장
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

// 로그인을 거친 뒤 이어갈 목적지 (허용된 내부 경로만)
const POST_AUTH_KEY = "haedori_post_auth_dest"
const POST_AUTH_MAX_AGE_MS = 24 * 60 * 60 * 1000
const ALLOWED_POST_AUTH_DESTS = ["/diary"] as const
export type PostAuthDest = (typeof ALLOWED_POST_AUTH_DESTS)[number]

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

export function readOnboarding(): OnboardingState {
  const s = local()
  if (!s) return defaultState()

  try {
    const raw = s.getItem(STATE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<OnboardingState>
    if (parsed?.flow_id !== ONBOARDING_FLOW_ID) return defaultState()

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
    return defaultState()
  }
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

/** 앱 진입 시 소개를 자동으로 보여줄지 */
export function shouldAutoShowOnboarding(): boolean {
  if (typeof window === "undefined") return false
  if (wasShownThisRun()) return false
  const { status } = readOnboarding()
  return status === "not_started" || status === "in_progress"
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

// ---------- 로그인 후 이어갈 목적지 ----------

export function storePostAuthDest(dest: PostAuthDest) {
  if (!ALLOWED_POST_AUTH_DESTS.includes(dest)) return
  try {
    local()?.setItem(POST_AUTH_KEY, JSON.stringify({ dest, at: Date.now() }))
  } catch {
    // 저장 못 하면 홈으로 간다 (홈에서 작성 버튼 사용)
  }
}

/** 저장된 목적지를 꺼내고 지운다. 없거나 허용되지 않은 값이면 null */
export function consumePostAuthDest(): PostAuthDest | null {
  const s = local()
  if (!s) return null

  try {
    const raw = s.getItem(POST_AUTH_KEY)
    if (!raw) return null
    s.removeItem(POST_AUTH_KEY)

    const parsed = JSON.parse(raw) as { dest?: string; at?: number }
    if (Date.now() - Number(parsed.at || 0) > POST_AUTH_MAX_AGE_MS) return null
    const dest = ALLOWED_POST_AUTH_DESTS.find((d) => d === parsed.dest)
    return dest ?? null
  } catch {
    return null
  }
}

/** 로그인 성공 후 이동할 경로 */
export function postAuthPath(): string {
  return consumePostAuthDest() ?? "/home"
}
