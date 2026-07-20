// /home/dori/diary-frontend/lib/api.ts

import {
  clearAccessToken,
  getStoredAccessToken,
  storeAccessToken,
} from "@/lib/auth-storage"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

type BirthProfilePayload = {
  birth_date?: string | null
  birth_time?: string | null
  birth_place?: string | null
  sex?: string | null
  timezone?: string | null
}

export type DiaryType = "question" | "free"

type DiaryPayload = {
  entry_date?: string
  content: string
  weather: string
  mood_tags: string[]
  diary_type?: DiaryType
  question_id?: string | null
  question_text?: string | null
}

export type QuestionHistoryItem = {
  id: number
  user_id: number
  entry_date: string
  content: string
  weather?: string | null
  mood_tags?: string[] | null
  summary_tag?: string | null
  diary_type?: DiaryType | null
  question_id?: string | null
  question_text?: string | null
  created_at: string
  updated_at: string
}

export type QuestionHistoryResponse = {
  month_day?: string | null
  question_id?: string | null
  question_text?: string | null
  items: QuestionHistoryItem[]
}

class ApiClient {
  private baseURL: string
  private refreshPromise: Promise<string | null> | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private getToken(): string | null {
    return getStoredAccessToken()
  }

  private async parseError(response: Response): Promise<string> {
    let errorMessage = `HTTP ${response.status}`

    try {
      const error = await response.json()
      errorMessage = error.detail || errorMessage
    } catch {}

    return errorMessage
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
          clearAccessToken()
          return null
        }

        const data = await response.json()

        if (!data?.access_token) {
          clearAccessToken()
          return null
        }

        storeAccessToken(data.access_token, true)
        return data.access_token
      } catch {
        clearAccessToken()
        return null
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }

    const token = this.getToken()
    if (token) headers["Authorization"] = `Bearer ${token}`

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    })

    if (response.status === 401 && retry) {
      const newAccessToken = await this.refreshAccessToken()

      if (newAccessToken) {
        response = await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string>),
            Authorization: `Bearer ${newAccessToken}`,
          },
          credentials: "include",
        })
      }
    }

    if (!response.ok) {
      const errorMessage = await this.parseError(response)
      if (response.status === 401) clearAccessToken()
      throw new ApiError(errorMessage, response.status)
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return response.json()
    }

    return {} as T
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }

  async login(email: string, password: string) {
    return this.post<{ access_token: string; token_type?: string }>(
      "/api/auth/login",
      { username: email, password }
    )
  }

  async oauthLogin(
    provider: "kakao" | "google",
    code: string,
    redirectUri: string
  ) {
    return this.post<{ access_token: string; token_type?: string }>(
      "/api/auth/oauth/exchange",
      {
        provider,
        code,
        redirect_uri: redirectUri,
      }
    )
  }

  async refresh() {
    return this.post<{ access_token: string; token_type?: string }>(
      "/api/auth/refresh"
    )
  }

  async logout() {
    try {
      await this.post<{ message: string }>("/api/auth/logout")
    } finally {
      clearAccessToken()
    }
  }

  async getMe() {
    return this.get("/api/users/me")
  }

  async addPearls(amount: number) {
    return this.post("/api/users/me/add-pearls", { amount })
  }

  async getDashboard() {
    return this.get("/api/dashboard")
  }

  async getDiaries(month: string, diaryType?: DiaryType) {
    const params = new URLSearchParams()
    params.set("month", month)
    if (diaryType) params.set("diary_type", diaryType)

    return this.get(`/api/diary?${params.toString()}`)
  }

  async getDiaryByDate(date: string, diaryType: DiaryType = "free") {
    const params = new URLSearchParams()
    params.set("diary_type", diaryType)

    return this.get(`/api/diary/date/${date}?${params.toString()}`)
  }

  async getTodayDiary(diaryType: DiaryType = "free") {
    const params = new URLSearchParams()
    params.set("diary_type", diaryType)

    return this.get(`/api/diary/today?${params.toString()}`)
  }

  async getDiaryQuestion() {
    return this.get<{
      question: string
      model?: string
      source_type?: string
      entry_date?: string
      created_at?: string
      cached?: boolean
    }>("/api/diary/question")
  }

  async getQuestionHistory(paramsInput: {
    question_id?: string | null
    month_day?: string | null
  }) {
    const params = new URLSearchParams()

    if (paramsInput.question_id) {
      params.set("question_id", paramsInput.question_id)
    }

    if (paramsInput.month_day) {
      params.set("month_day", paramsInput.month_day)
    }

    return this.get<QuestionHistoryResponse>(
      `/api/diary/question-history?${params.toString()}`
    )
  }

  async createDiary(data: DiaryPayload) {
    return this.post("/api/diary/today", data)
  }

  async updateTodayDiary(data: DiaryPayload) {
    return this.put("/api/diary/today", data)
  }

  async updateDiary(date: string, data: DiaryPayload) {
    return this.put(`/api/diary/date/${date}`, data)
  }

  async deleteDiary(date: string, diaryType: DiaryType = "free") {
    const params = new URLSearchParams()
    params.set("diary_type", diaryType)

    return this.delete(`/api/diary/date/${date}?${params.toString()}`)
  }

  async generateMissingDiarySummaryTags() {
    return this.post<{
      message: string
      updated_count: number
      items: Array<{
        id: number
        entry_date: string
        diary_type?: DiaryType
        summary_tag: string
      }>
      failed_count?: number
      failed_items?: Array<{
        id: number
        entry_date: string
        reason: string
      }>
    }>("/api/diary/summary-tag/batch-missing")
  }

  async getLetters(month: string) {
    return this.get(`/api/letters?month=${month}`)
  }

  async getLatestLetter() {
    return this.get("/api/letters/latest")
  }

  async getTodayLetter() {
    return this.get("/api/letters/today")
  }

  async getLetterById(letterId: number) {
    return this.get(`/api/letters/${letterId}`)
  }

  async markLetterAsRead(letterId: number) {
    return this.patch(`/api/letters/${letterId}/read`)
  }

  async updateLetterFavorite(letterId: number, isFavorite: boolean) {
    return this.patch(`/api/letters/${letterId}/favorite`, {
      is_favorite: isFavorite,
    })
  }

  async generateLetter(targetDate?: string, force = false) {
    const params = new URLSearchParams()
    if (targetDate) params.set("target_date", targetDate)
    if (force) params.set("force", "true")

    const query = params.toString() ? `?${params.toString()}` : ""

    return this.post(`/api/letters/generate${query}`)
  }

  async generateLetterForDiary(targetDate: string) {
    const params = new URLSearchParams()
    params.set("target_date", targetDate)

    return this.post(`/api/letters/generate-with-pearl?${params.toString()}`)
  }

  async generateLetterWithPearl(targetDate: string) {
    return this.generateLetterForDiary(targetDate)
  }

  async generateTodayLetter() {
    return this.generateLetterForDiary(this.getTodayDateString())
  }

  private getTodayDateString() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  async getTodayFortune() {
    return this.get("/api/fortune/today")
  }

  async getFortunes(fromDate: string, toDate: string) {
    return this.get(`/api/fortune?from_date=${fromDate}&to_date=${toDate}`)
  }

  async getBirthProfile() {
    return this.get("/api/profile/birth")
  }

  async updateBirthProfile(data: BirthProfilePayload) {
    return this.put("/api/profile/birth", data)
  }

  async getNotificationSettings() {
    return this.get("/api/settings/notifications")
  }

  async updateNotificationSettings(data: any) {
    return this.put("/api/settings/notifications", data)
  }

  async getWebPushPublicKey() {
    return this.get<{ public_key: string }>("/api/web-push/public-key")
  }

  async subscribeWebPush(data: {
    subscription: PushSubscriptionJSON
    user_agent?: string
  }) {
    return this.post("/api/web-push/subscribe", data)
  }

  async unsubscribeWebPush(data: { endpoint: string }) {
    return this.post("/api/web-push/unsubscribe", data)
  }

  async sendWebPushTest(data: { title: string; body: string; url: string }) {
    return this.post("/api/web-push/test", data)
  }

  async getShopItems(itemType?: string) {
    const query = itemType ? `?item_type=${itemType}` : ""
    return this.get(`/api/shop/items${query}`)
  }

  async purchaseItem(itemId: number) {
    return this.post(`/api/shop/purchase/${itemId}`)
  }

  async getUserPurchases() {
    return this.get("/api/shop/purchases")
  }
}

export const apiClient = new ApiClient(API_BASE_URL)