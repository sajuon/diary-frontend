const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  /**
   * 🔥 매 요청마다 최신 토큰을 가져오도록 수정
   * (기존에는 constructor에서 한 번만 읽어서 로그인 이후에도 null일 수 있었음)
   */
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
      credentials: "include", // 혹시 쿠키 인증도 대비
    })

    // 🔥 401 처리 (토큰 만료 대응)
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token")
        window.location.href = "/login"
      }
      throw new Error("인증이 필요합니다.")
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`

      try {
        const error = await response.json()
        errorMessage = error.detail || errorMessage
      } catch {
        // JSON 아닐 경우 무시
      }

      throw new Error(errorMessage)
    }

    // JSON 없는 응답 대비
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return response.json()
    }

    return {} as T
  }

  // ======================
  // Auth
  // ======================

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
    return this.request<{ access_token: string }>(
      "/api/auth/oauth/exchange",
      {
        method: "POST",
        body: JSON.stringify({
          provider,
          access_token: code,
          redirect_uri: redirectUri,
        }),
      }
    )
  }

  // ======================
  // User
  // ======================

  async getMe() {
    return this.request("/api/users/me")
  }

  async addPearls(amount: number) {
    return this.request("/api/users/me/add-pearls", {
      method: "POST",
      body: JSON.stringify({ amount }),
    })
  }

  // ======================
  // Dashboard
  // ======================

  async getDashboard() {
    return this.request("/api/dashboard")
  }

  // ======================
  // Diary
  // ======================

  async getDiaries(month: string) {
    return this.request(`/api/diary?month=${month}`)
  }

  async getDiaryByDate(date: string) {
    return this.request(`/api/diary/date/${date}`)
  }

  async createDiary(data: { content: string; mood_tags: string[] }) {
    return this.request("/api/diary/today", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateDiary(
    date: string,
    data: { content: string; mood_tags: string[] }
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

  // ======================
  // Letters
  // ======================

  async getLetters(month: string) {
    return this.request(`/api/letters?month=${month}`)
  }

  async getLetterById(letterId: number) {
    return this.request(`/api/letters/${letterId}`)
  }

  async generateTodayLetter() {
    return this.request("/api/letters/generate/today", {
      method: "POST",
    })
  }

  // ======================
  // Fortune
  // ======================

  async getTodayFortune() {
    return this.request("/api/fortune/today")
  }

  async getFortunes(fromDate: string, toDate: string) {
    return this.request(
      `/api/fortune?from_date=${fromDate}&to_date=${toDate}`
    )
  }

  // ======================
  // Profile
  // ======================

  async getBirthProfile() {
    return this.request("/api/profile/birth")
  }

  async updateBirthProfile(data: any) {
    return this.request("/api/profile/birth", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // ======================
  // Settings
  // ======================

  async getNotificationSettings() {
    return this.request("/api/settings/notifications")
  }

  async updateNotificationSettings(data: any) {
    return this.request("/api/settings/notifications", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // ======================
  // Shop
  // ======================

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