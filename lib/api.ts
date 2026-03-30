const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("access_token")
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }

    const token = this.getToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`

      try {
        const error = await response.json()
        errorMessage = error.detail || errorMessage
      } catch {
        // ignore
      }

      throw new ApiError(errorMessage, response.status)
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return response.json()
    }

    return {} as T
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "GET",
    })
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
    return this.request<T>(endpoint, {
      method: "DELETE",
    })
  }

  async login(email: string, password: string) {
    return this.post<{ access_token: string }>("/api/auth/login", {
      username: email,
      password,
    })
  }

  async oauthLogin(
    provider: "kakao" | "google",
    code: string,
    redirectUri: string
  ) {
    return this.post<{ access_token: string }>("/api/auth/oauth/exchange", {
      provider,
      code,
      redirect_uri: redirectUri,
    })
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

  async getDiaries(month: string) {
    return this.get(`/api/diary?month=${month}`)
  }

  async getDiaryByDate(date: string) {
    return this.get(`/api/diary/date/${date}`)
  }

  async getTodayDiary() {
    return this.get("/api/diary/today")
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

  async createDiary(data: {
    content: string
    weather: string
    mood_tags: string[]
  }) {
    return this.post("/api/diary/today", data)
  }

  async updateTodayDiary(data: {
    content: string
    weather: string
    mood_tags: string[]
  }) {
    return this.put("/api/diary/today", data)
  }

  async updateDiary(
    date: string,
    data: { content: string; weather: string; mood_tags: string[] }
  ) {
    return this.put(`/api/diary/date/${date}`, data)
  }

  async deleteDiary(date: string) {
    return this.delete(`/api/diary/date/${date}`)
  }

  async generateMissingDiarySummaryTags() {
    return this.post<{
      message: string
      updated_count: number
      items: Array<{
        id: number
        entry_date: string
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

  async generateTodayLetter() {
    return this.generateLetter()
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

  async updateBirthProfile(data: any) {
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