// /home/dori/diary-frontend/lib/question-user-key.ts
// 역할: 홈화면과 일기쓰기 화면에서 같은 질문을 뽑기 위해 userKey를 통일하는 유틸 파일

export function getQuestionUserKeyFromStorage() {
  if (typeof window === "undefined") return "guest"

  return (
    window.localStorage.getItem("user_id") ||
    window.localStorage.getItem("dori_user_id") ||
    window.localStorage.getItem("profile_user_id") ||
    window.localStorage.getItem("userId") ||
    "guest"
  )
}

export function getQuestionUserKeyFromDashboard(dashboardData?: any) {
  return (
    dashboardData?.user?.id ??
    dashboardData?.user_id ??
    dashboardData?.profile?.id ??
    dashboardData?.profile?.user_id ??
    dashboardData?.profile?.userId ??
    dashboardData?.id ??
    getQuestionUserKeyFromStorage()
  )
}