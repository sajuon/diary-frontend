// /home/dori/diary-frontend/lib/auth-storage.ts

export type SignupDraft = {
  name: string
  birthDate: string
  birthTime: string
  birthPlace: string
}

const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"
const REMEMBER_ME_KEY = "remember_me"
const SIGNUP_DRAFT_KEY = "signup_draft"

const isBrowser = () => typeof window !== "undefined"

export function storeAccessToken(token: string, rememberMe: boolean) {
  if (!isBrowser()) return

  localStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)

  if (rememberMe) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
    localStorage.setItem(REMEMBER_ME_KEY, "true")
  } else {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
    localStorage.setItem(REMEMBER_ME_KEY, "false")
  }
}

export function getStoredAccessToken(): string | null {
  if (!isBrowser()) return null
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY)
  )
}

/**
 * TWA(안드로이드 앱)에서는 카카오 OAuth 왕복 중 httpOnly 쿠키가 유실되어
 * refresh 쿠키가 살아남지 못한다. 그래서 refresh token을 스토리지에도 보관해
 * 쿠키가 없을 때 fallback으로 사용한다.
 */
export function storeRefreshToken(token: string, rememberMe: boolean) {
  if (!isBrowser()) return

  localStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)

  if (rememberMe) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } else {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token)
  }
}

export function getStoredRefreshToken(): string | null {
  if (!isBrowser()) return null
  return (
    localStorage.getItem(REFRESH_TOKEN_KEY) ||
    sessionStorage.getItem(REFRESH_TOKEN_KEY)
  )
}

export function storeTokens(
  accessToken: string,
  refreshToken: string | null | undefined,
  rememberMe: boolean
) {
  storeAccessToken(accessToken, rememberMe)
  if (refreshToken) storeRefreshToken(refreshToken, rememberMe)
}

export function clearAccessToken() {
  if (!isBrowser()) return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(REMEMBER_ME_KEY)
}

export function isRememberMeEnabled(): boolean {
  if (!isBrowser()) return false
  return localStorage.getItem(REMEMBER_ME_KEY) === "true"
}

export function storeSignupDraft(draft: SignupDraft) {
  if (!isBrowser()) return
  sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft))
}

export function getSignupDraft(): SignupDraft | null {
  if (!isBrowser()) return null
  const raw = sessionStorage.getItem(SIGNUP_DRAFT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SignupDraft
  } catch {
    return null
  }
}

export function clearSignupDraft() {
  if (!isBrowser()) return
  sessionStorage.removeItem(SIGNUP_DRAFT_KEY)
}