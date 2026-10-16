// /home/dori/diary-frontend/app/(appshell)/intro/page.tsx
// 역할: 첫 사용자 소개 화면 라우트
// - /intro            : 앱 진입 시 자동 노출 (루트·로그인 페이지에서 이동)
// - /intro?mode=manual : 프로필 > 사용법 다시 보기 (완료 상태는 그대로 유지)
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import OnboardingIntro, {
  type OnboardingFinishAction,
} from "@/components/onboarding-intro"
import {
  getResumeStep,
  markOnboardingCompleted,
  markOnboardingSkipped,
  saveOnboardingStep,
  storePostAuthDest,
} from "@/lib/onboarding"
import {
  getStoredAccessToken,
  getStoredRefreshToken,
} from "@/lib/auth-storage"

function hasStoredSession() {
  return Boolean(getStoredAccessToken() || getStoredRefreshToken())
}

export default function IntroPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") === "manual" ? "manual" : "auto"

  // 저장된 단계는 브라우저에서만 읽을 수 있어 마운트 후 결정
  const [initialStep, setInitialStep] = useState<number | null>(null)

  useEffect(() => {
    setInitialStep(mode === "manual" ? 1 : getResumeStep())
    // 자동 노출로 처음 들어왔으면 '진행 중'으로 기록
    if (mode === "auto") saveOnboardingStep(getResumeStep())
  }, [mode])

  const handleFinish = (action: OnboardingFinishAction) => {
    if (mode === "manual") {
      // 다시 보기: 상태는 바꾸지 않는다. 닫으면 출발한 화면으로
      if (action === "first-diary") {
        router.push("/diary")
        return
      }
      if (action === "home") {
        router.push("/home")
        return
      }
      if (window.history.length > 1) router.back()
      else router.replace("/profile")
      return
    }

    // 자동 노출: 저장이 실패해도 진입은 막지 않는다 (이번 실행에서는 다시 안 띄움)
    if (action === "skip") markOnboardingSkipped()
    else markOnboardingCompleted()

    const loggedIn = hasStoredSession()

    if (action === "first-diary") {
      if (loggedIn) {
        router.replace("/diary")
      } else {
        // 로그인·회원가입을 마치면 일기 화면으로 이어간다
        storePostAuthDest("/diary")
        router.replace("/login")
      }
      return
    }

    // 세션이 유효하지 않으면 홈 화면이 로그인으로 돌려보낸다
    router.replace(loggedIn ? "/home" : "/login")
  }

  if (initialStep == null) {
    return <div className="fixed inset-0" style={{ background: "#F8F6F2" }} />
  }

  return (
    <OnboardingIntro
      mode={mode}
      initialStep={initialStep}
      onStepChange={mode === "auto" ? saveOnboardingStep : undefined}
      onFinish={handleFinish}
    />
  )
}
