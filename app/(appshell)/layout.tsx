"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        window.innerWidth < 1024
      setIsMobile(mobile)
      setMounted(true)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  if (!mounted) {
    return null
  }

  if (isMobile) {
    return <>{children}</>
  }

  return (
    <div className="h-screen w-full flex bg-[#F3F0EB] overflow-hidden">
      {/* 왼쪽 브랜딩 영역 */}
      <section className="w-1/2 h-full flex flex-col justify-center px-16 bg-[#F8F6F2]">
        <div className="max-w-xl mx-auto w-full">
          <div className="mb-8">
            <Image
              src="/images/haedori-character.png"
              alt="해도리"
              width={72}
              height={72}
              className="mb-5 rounded-2xl"
            />
            <h1
              className="text-5xl font-extrabold leading-tight"
              style={{ color: "#3D3530" }}
            >
              오늘의 마음을 기록하고
              <br />
              해도리의 답장을 받아보세요
            </h1>
            <p
              className="mt-5 text-lg leading-relaxed"
              style={{ color: "#8C8178" }}
            >
              하루 한 줄 기록,
              <br />
              하루 한 번 나를 돌아보는 시간.
            </p>
          </div>

          <div
            className="rounded-[28px] px-6 py-5 flex items-center gap-5"
            style={{
              background: "#1F2937",
              color: "#FFFCF8",
              boxShadow: "0 12px 32px rgba(0,0,0,0.14)",
            }}
          >
            <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
              {/* QR 이미지 있으면 교체 */}
              <Image
                src="/images/haedori-qr.png"
                alt="해도리 QR"
                width={96}
                height={96}
                className="object-cover"
              />
            </div>

            <div>
              <p className="text-xl font-bold leading-snug">
                모바일에서 더 편하게
                <br />
                해도리를 만나보세요.
              </p>
              <p className="mt-2 text-sm text-[#D8D3CC]">
                QR을 스캔하면 바로 앱으로 이동해요.
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-3 rounded-2xl font-bold transition-all active:scale-95"
              style={{
                background: "#C9856A",
                color: "#FFFCF8",
                boxShadow: "0 8px 20px rgba(201,133,106,0.25)",
              }}
            >
              웹으로 시작하기
            </button>

            <button
              onClick={() => router.push("/home")}
              className="px-6 py-3 rounded-2xl font-bold border transition-all active:scale-95"
              style={{
                background: "#FFFCF8",
                color: "#3D3530",
                borderColor: "#E5DDD5",
              }}
            >
              홈 미리보기
            </button>
          </div>
        </div>
      </section>

      {/* 오른쪽 앱 영역 */}
      <section className="w-1/2 h-full flex items-center justify-center bg-[#EEE7DE] px-8">
        <div
          className="w-full max-w-[430px] h-[92vh] rounded-[34px] overflow-hidden"
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E5DDD5",
            boxShadow: "0 24px 48px rgba(61,53,48,0.16)",
          }}
        >
          <div
            className="h-full overflow-hidden"
            style={{ background: "#F8F6F2" }}
          >
            {children}
          </div>
        </div>
      </section>
    </div>
  )
}