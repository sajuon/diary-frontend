// /home/dori/diary-frontend/app/(appshell)/haedori/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const messages = [
  "오늘도 와줘서 고마워!",
  "간식 먹으면 더 힘낼 수 있어!",
  "오늘 하루는 어땠어?",
  "해도리가 네 이야기를 기다리고 있어.",
  "무리하지 말고 천천히 가도 돼.",
  "오늘도 여기까지 온 것만으로 충분해.",
  "해도리는 항상 네 편이야.",
  "마음이 복잡하면 천천히 말해줘.",
]

export default function HaedoriPage() {
  const router = useRouter()
  const [message, setMessage] = useState(messages[2])

  const changeMessage = () => {
    const candidates = messages.filter((m) => m !== message)
    const next = candidates[Math.floor(Math.random() * candidates.length)]
    setMessage(next)
  }

  const menuItems = [
    { label: "간식상점", image: "/images/icons/snackmarket.png", path: "/shop" },
    { label: "해도리 답장", image: "/images/icons/mailbox.png", path: "/letterbox" },
    { label: "진주상점", image: "/images/icons/pearlshop.png", path: "/pearl-shop" },
  ]

  return (
    <div
      className="relative h-[100dvh] overflow-hidden px-5 pt-5 pb-0"
      style={{
        background:
          "linear-gradient(180deg, #FFF8F0 0%, #F8E8D8 58%, #E9CBB0 100%)",
      }}
    >
      {/* 왼쪽 밝은 커튼 */}
      <div
        className="absolute left-0 top-0 h-full w-[72px] pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.38) 55%, rgba(255,255,255,0) 100%)",
        }}
      />

      {/* 벽 */}
      <div
        className="absolute left-0 right-0 top-0 h-[74%] pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,251,246,0.58) 0%, rgba(255,241,226,0.16) 100%)",
        }}
      />

      {/* 바닥 */}
      <div
        className="absolute bottom-0 left-0 h-[30%] w-full pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, #F1D5B9 0%, #E7BE9C 100%)",
          borderTop: "1px solid rgba(202,158,120,0.3)",
        }}
      />

      {/* 바닥 라인 */}
      <div className="absolute bottom-[25%] left-0 h-px w-full bg-[#D3A983]/30" />
      <div className="absolute bottom-[18%] left-0 h-px w-full bg-[#D3A983]/24" />
      <div className="absolute bottom-[10%] left-0 h-px w-full bg-[#D3A983]/20" />

      {/* 왼쪽 식물 */}
      <div className="absolute left-[-10px] bottom-[11%] z-[1] h-40 w-32 pointer-events-none">
        <div className="absolute bottom-0 left-5 h-14 w-16 rounded-b-[24px] rounded-t-md bg-[#C99867]" />
        <div className="absolute bottom-10 left-[54px] h-24 w-2 rounded-full bg-[#87A96B] -rotate-6" />
        <div className="absolute bottom-[104px] left-5 h-8 w-14 rounded-full bg-[#8FB173] -rotate-[22deg]" />
        <div className="absolute bottom-[88px] left-[55px] h-8 w-14 rounded-full bg-[#9BBC7D] rotate-[16deg]" />
        <div className="absolute bottom-[70px] left-2 h-7 w-12 rounded-full bg-[#7FA365] rotate-[28deg]" />
        <div className="absolute bottom-[122px] left-[58px] h-7 w-11 rounded-full bg-[#A6C68A] rotate-[42deg]" />
      </div>

      {/* 벽 메모 */}
      <div className="absolute left-[19%] top-[37%] z-[1] pointer-events-none opacity-60">
        <div className="absolute h-10 w-9 rotate-[-6deg] rounded-sm bg-[#F3D9BA] shadow-sm" />
        <div className="absolute left-8 top-9 h-9 w-14 rotate-[4deg] rounded-sm bg-[#F1D8B8] shadow-sm" />
        <div className="absolute left-1 top-[88px] h-10 w-10 rotate-[3deg] rounded-sm bg-[#F5DDC5] shadow-sm" />
        <div className="absolute left-[14px] top-2 text-[14px] text-[#9DBB7D]">⌁</div>
        <div className="absolute left-[52px] top-[50px] text-[9px] font-bold text-[#C9A47D]">
          Today
        </div>
        <div className="absolute left-[15px] top-[100px] text-[15px] text-[#E7A686]">♥</div>
      </div>

      {/* 오른쪽 조명 */}
      <div className="absolute right-[-4px] bottom-[11%] z-[1] pointer-events-none">
        <div
          className="mx-auto h-12 w-16 rounded-t-full"
          style={{
            background:
              "linear-gradient(180deg, #FFE9B8 0%, #FFD99E 100%)",
            boxShadow: "0 0 22px rgba(255,211,142,0.35)",
          }}
        />
        <div className="mx-auto h-10 w-2 bg-[#C89968]" />
        <div className="h-4 w-20 rounded-full bg-[#C99C70]" />
      </div>

      {/* 오른쪽 책/컵 */}
      <div className="absolute right-1 bottom-[2%] z-[1] pointer-events-none opacity-90">
        <div className="absolute right-0 bottom-0 h-5 w-20 rounded-sm bg-[#8AA4A1]" />
        <div className="absolute right-2 bottom-5 h-5 w-20 rounded-sm bg-[#F1B28F]" />
        <div className="absolute right-4 bottom-10 h-5 w-20 rounded-sm bg-[#F5D1A4]" />
        <div className="absolute right-[78px] bottom-0 h-8 w-7 rounded-b-lg rounded-t-sm border-2 border-[#C9A47D] bg-[#FFF7EF]" />
      </div>

      {/* 왼쪽 쿠션 */}
      <div
        className="absolute left-[-24px] bottom-[-10px] z-[1] h-20 w-32 rounded-[45%] pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, #E7A47E 0%, #CF7F62 100%)",
          boxShadow: "0 8px 18px rgba(139,81,59,0.16)",
        }}
      />

      {/* 헤더 */}
      <div className="relative z-20 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex h-11 w-11 items-center justify-center rounded-full text-lg active:scale-95 transition-all"
          style={{
            background: "rgba(255,255,255,0.88)",
            border: "1.5px solid #E5D1C3",
            color: "#3D3530",
            boxShadow: "0 4px 12px rgba(61,53,48,0.05)",
          }}
          aria-label="뒤로가기"
        >
          ‹
        </button>

        <h1 className="text-lg font-extrabold" style={{ color: "#3D3530" }}>
          해도리
        </h1>

        <div className="w-11" />
      </div>

      <div className="relative z-10 h-[calc(100dvh-64px)]">
        {/* 우측 메뉴 */}
        <div className="absolute right-0 top-[64px] z-30 flex flex-col items-center gap-5">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-1 active:scale-95 transition-all"
              style={{ background: "transparent", border: "none" }}
              aria-label={item.label}
            >
              <img
                src={item.image}
                alt={item.label}
                className="h-14 w-14 object-contain drop-shadow-xl"
              />

              <span
                className="text-[10px] font-extrabold whitespace-nowrap"
                style={{
                  color: "#FFF7EF",
                  textShadow: "0 2px 6px rgba(0,0,0,0.55)",
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* 말풍선 */}
        <div className="absolute left-1/2 top-[14%] z-20 w-[82%] max-w-[300px] -translate-x-1/2">
          <div
            className="relative rounded-[28px] px-5 py-4 text-center text-sm font-extrabold leading-6"
            style={{
              background: "rgba(255,252,248,0.96)",
              color: "#3D3530",
              border: "1.5px solid #E5D1C3",
              boxShadow: "0 8px 20px rgba(61,53,48,0.09)",
            }}
          >
            {message}

            <div
              className="absolute left-1/2 -bottom-2 h-4 w-4"
              style={{
                background: "rgba(255,252,248,0.96)",
                borderRight: "1.5px solid #E5D1C3",
                borderBottom: "1.5px solid #E5D1C3",
                transform: "translateX(-50%) rotate(45deg)",
              }}
            />
          </div>
        </div>

        {/* 러그 */}
        <div
          className="absolute left-1/2 bottom-[13%] z-[2] h-20 w-[78%] -translate-x-1/2 rounded-[999px]"
          style={{
            background:
              "radial-gradient(ellipse, #FFF8EE 0%, #F7E9D8 58%, rgba(216,174,136,0.36) 100%)",
            boxShadow: "0 14px 26px rgba(124,82,52,0.12)",
          }}
        />

        {/* 해도리 */}
        <button
          onClick={changeMessage}
          className="absolute left-1/2 top-[52%] z-20 -translate-x-1/2 -translate-y-1/2 active:scale-95 transition-all"
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
          }}
          aria-label="해도리 말 걸기"
        >
          <img
            src="/images/haedori-body.png"
            alt="해도리"
            className="h-52 w-52 object-contain drop-shadow-xl"
          />
        </button>

        {/* 해도리 그림자 */}
        <div
          className="absolute left-1/2 bottom-[22%] z-[3] h-7 w-[48%] -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, rgba(61,53,48,0.14) 0%, rgba(61,53,48,0.06) 48%, rgba(61,53,48,0) 74%)",
          }}
        />
      </div>
    </div>
  )
}