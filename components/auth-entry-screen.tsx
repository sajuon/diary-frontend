//변환 끝
// /home/dori/diary-frontend/components/auth-entry-screen.tsx
"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"

export default function AuthEntryScreen() {
  const router = useRouter()

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-between px-6 pb-10 pt-16"
      style={{ background: "#F8F6F2" }}
    >
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full" style={{ background: "#F2C4A8" }} />
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#F4C97A" }} />
        <div className="h-2 w-2 rounded-full" style={{ background: "#B8D8C8" }} />
      </div>

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-7">
        <div
          className="relative h-60 w-60 overflow-hidden rounded-3xl"
          style={{ boxShadow: "0 8px 32px rgba(201,133,106,0.15)" }}
        >
          <Image
            src="/images/haedori-room.jpg"
            alt="해도리의 아늑한 방"
            fill
            className="object-cover"
          />
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background:
                "linear-gradient(to bottom, transparent 55%, rgba(248,246,242,0.25))",
            }}
          />
        </div>

        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold" style={{ color: "#C9856A" }}>
            안녕하세요
          </p>
          <h1
            className="text-[1.6rem] font-extrabold leading-snug text-balance"
            style={{ color: "#3D3530" }}
          >
            해도리와 하루를
            <br />
            시작해볼까요?
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#9A8F87" }}>
            오늘의 감정을 기록하고, 나를 돌아봐요
          </p>
        </div>
      </div>

      <div className="w-full space-y-3">
        <button
          onClick={() => router.push("/login")}
          className="w-full rounded-2xl py-4 text-[0.95rem] font-bold transition-all active:scale-[0.97]"
          style={{
            background: "#F4C97A",
            color: "#3D3530",
            boxShadow: "0 3px 12px rgba(244,201,122,0.4)",
          }}
        >
          로그인하기
        </button>

        <button
          onClick={() => router.push("/signup")}
          className="w-full rounded-2xl py-4 text-[0.95rem] font-bold transition-all active:scale-[0.97]"
          style={{
            background: "#FFFCF8",
            color: "#3D3530",
            border: "1.5px solid #E5DDD5",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          회원가입하기
        </button>

        <p className="pt-2 text-center text-xs leading-relaxed" style={{ color: "#C4B8B0" }}>
          계속 진행하면{" "}
          <span style={{ borderBottom: "1px solid #C4B8B0" }}>개인정보처리방침</span> 및{" "}
          <span style={{ borderBottom: "1px solid #C4B8B0" }}>이용약관</span>에 동의하는 것으로 간주됩니다
        </p>
      </div>
    </div>
  )
}