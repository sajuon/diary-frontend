//변환 끝
// /home/dori/diary-frontend/components/signup-profile-screen.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSignupDraft, storeSignupDraft } from "@/lib/auth-storage"

export default function SignupProfileScreen() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [birthTime, setBirthTime] = useState("")
  const [birthPlace, setBirthPlace] = useState("")

  useEffect(() => {
    const draft = getSignupDraft()
    if (!draft) return

    setName(draft.name || "")
    setBirthDate(draft.birthDate || "")
    setBirthTime(draft.birthTime || "")
    setBirthPlace(draft.birthPlace || "")
  }, [])

  const handleNext = () => {
    if (!name.trim()) {
      alert("성함을 입력해줘.")
      return
    }

    if (!birthDate) {
      alert("생년월일을 입력해줘.")
      return
    }

    if (!birthTime) {
      alert("태어난 시를 입력해줘.")
      return
    }

    if (!birthPlace.trim()) {
      alert("태어난 장소를 입력해줘.")
      return
    }

    storeSignupDraft({
      name: name.trim(),
      birthDate,
      birthTime,
      birthPlace: birthPlace.trim(),
    })

    router.push("/signup/social")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F6F2] px-6 py-10">
      <div className="w-full max-w-md rounded-[28px] bg-[#FFFCF8] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.06)]">
        <div className="mb-6">
          <p className="text-sm font-semibold text-[#C9856A]">회원가입 1/2</p>
          <h1 className="mt-2 text-2xl font-extrabold text-[#3D3530]">
            기본 정보를 입력해줘
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#8F837C]">
            먼저 사주와 홈 화면 구성에 필요한 기본 정보를 받을게.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#5E514A]">성함</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력해줘"
              className="w-full rounded-2xl border border-[#E8DED6] bg-white px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#5E514A]">생년월일</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-2xl border border-[#E8DED6] bg-white px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#5E514A]">태어난 시</label>
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="w-full rounded-2xl border border-[#E8DED6] bg-white px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#5E514A]">태어난 장소</label>
            <input
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              placeholder="예: 부산, 서울, 대구"
              className="w-full rounded-2xl border border-[#E8DED6] bg-white px-4 py-3 outline-none"
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleNext}
            className="w-full rounded-2xl py-4 text-[0.95rem] font-bold text-[#3D3530]"
            style={{
              background: "#F4C97A",
              boxShadow: "0 3px 12px rgba(244,201,122,0.4)",
            }}
          >
            다음 화면으로
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full py-2 text-sm text-[#9A8F87]"
          >
            이전으로
          </button>
        </div>
      </div>
    </div>
  )
}