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

  async login(email: string, password: string) {
    return this.request<{ access_token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: email, password }),
    })
  }

  async oauthLogin(
    provider: "kakao" | "google",
    code: string,
    redirectUri: string
  ) {
    return this.request<{ access_token: string }>("/api/auth/oauth/exchange", {
      method: "POST",
      body: JSON.stringify({
        provider,
        code,
        redirect_uri: redirectUri,
      }),
    })
  }

  async getMe() {
    return this.request("/api/users/me")
  }

  async addPearls(amount: number) {
    return this.request("/api/users/me/add-pearls", {
      method: "POST",
      body: JSON.stringify({ amount }),
    })
  }

  async getDashboard() {
    return this.request("/api/dashboard")
  }

  async getDiaries(month: string) {
    return this.request(`/api/diary?month=${month}`)
  }

  async getDiaryByDate(date: string) {
    return this.request(`/api/diary/date/${date}`)
  }

  async getTodayDiary() {
    return this.request("/api/diary/today")
  }

  async getDiaryQuestion() {
    return this.request<{
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
    return this.request("/api/diary/today", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateTodayDiary(data: {
    content: string
    weather: string
    mood_tags: string[]
  }) {
    return this.request("/api/diary/today", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async updateDiary(
    date: string,
    data: { content: string; weather: string; mood_tags: string[] }
  ) {
    return this.request(`/api/diary/date/${date}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteDiary(date: string) {
    return this.request(`/api/diary/date/${date}`, {
      method: "DELETE",
    })
  }

  async getLetters(month: string) {
    return this.request(`/api/letters?month=${month}`)
  }

  async getLatestLetter() {
    return this.request("/api/letters/latest")
  }

  async getTodayLetter() {
    return this.request("/api/letters/today")
  }

  async getLetterById(letterId: number) {
    return this.request(`/api/letters/${letterId}`)
  }

  async markLetterAsRead(letterId: number) {
    return this.request(`/api/letters/${letterId}/read`, {
      method: "PATCH",
    })
  }

  async generateLetter(targetDate?: string, force = false) {
    const params = new URLSearchParams()
    if (targetDate) params.set("target_date", targetDate)
    if (force) params.set("force", "true")

    const query = params.toString() ? `?${params.toString()}` : ""

    return this.request(`/api/letters/generate${query}`, {
      method: "POST",
    })
  }

  async generateTodayLetter() {
    return this.generateLetter()
  }

  async getTodayFortune() {
    return this.request("/api/fortune/today")
  }

  async getFortunes(fromDate: string, toDate: string) {
    return this.request(`/api/fortune?from_date=${fromDate}&to_date=${toDate}`)
  }

  async getBirthProfile() {
    return this.request("/api/profile/birth")
  }

  async updateBirthProfile(data: any) {
    return this.request("/api/profile/birth", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async getNotificationSettings() {
    return this.request("/api/settings/notifications")
  }

  async updateNotificationSettings(data: any) {
    return this.request("/api/settings/notifications", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async getWebPushPublicKey() {
    return this.request<{ public_key: string }>("/api/web-push/public-key")
  }

  async subscribeWebPush(data: {
    subscription: PushSubscriptionJSON
    user_agent?: string
  }) {
    return this.request("/api/web-push/subscribe", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async unsubscribeWebPush(data: { endpoint: string }) {
    return this.request("/api/web-push/unsubscribe", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async sendWebPushTest(data: { title: string; body: string; url: string }) {
    return this.request("/api/web-push/test", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getShopItems(itemType?: string) {
    const query = itemType ? `?item_type=${itemType}` : ""
    return this.request(`/api/shop/items${query}`)
  }

  async purchaseItem(itemId: number) {
    return this.request(`/api/shop/purchase/${itemId}`, {
      method: "POST",
    })
  }

  async getUserPurchases() {
    return this.request("/api/shop/purchases")
  }
}

export const apiClient = new ApiClient(API_BASE_URL)