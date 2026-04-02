// /home/dori/diary-frontend/lib/oauth-state.ts
export type OAuthState = {
  mode: "login" | "signup"
  rememberMe: boolean
}

export function createOAuthState(payload: OAuthState): string {
  if (typeof window === "undefined") {
    return ""
  }

  return window.btoa(JSON.stringify(payload))
}

export function parseOAuthState(raw: string | null | undefined): OAuthState | null {
  if (typeof window === "undefined") return null
  if (!raw) return null

  try {
    return JSON.parse(window.atob(raw)) as OAuthState
  } catch {
    return null
  }
}