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

  const [message, setMessage] = useState(messages[0])

  const changeMessage = () => {
    const candidates = messages.filter((m) => m !== message)
    const next = candidates[Math.floor(Math.random() * candidates.length)]
    setMessage(next)
  }

  const menuItems = [
    {
      label: "간식상점",
      image: "/images/icons/snackmarket.png",
      path: "/shop",
    },
    {
      label: "해도리 답장",
      image: "/images/icons/mailbox.png",
      path: "/letter",
    },
    {
      label: "진주상점",
      image: "/images/icons/pearlshop.png",
      path: "/pearl-shop",
    },
  ]

  return (
    <div
      className="relative h-[100dvh] overflow-hidden px-5 pt-12 pb-8"
      style={{
        background:
          "linear-gradient(180deg, #FFF7EF 0%, #F8E6D3 55%, #E9D9C9 100%)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg active:scale-95 transition-all"
          style={{
            background: "rgba(255,255,255,0.82)",
            border: "1.5px solid #E5D1C3",
            color: "#3D3530",
          }}
          aria-label="뒤로가기"
        >
          ‹
        </button>

        <h1 className="text-lg font-extrabold" style={{ color: "#3D3530" }}>
          해도리
        </h1>

        <div className="w-10" />
      </div>

      <div className="relative h-[calc(100dvh-96px)]">
        {/* 우측 상단 세로 메뉴 아이콘 */}
        <div className="absolute right-0 top-4 z-30 flex flex-col items-center gap-4">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-1 active:scale-95 transition-all"
              style={{
                background: "transparent",
                border: "none",
              }}
              aria-label={item.label}
            >
              <img
                src={item.image}
                alt={item.label}
                className="w-16 h-16 object-contain drop-shadow-xl"
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
        <div className="absolute left-1/2 top-[10%] -translate-x-1/2 z-20 w-[82%] max-w-[280px]">
          <div
            className="relative px-5 py-4 rounded-[24px] text-sm font-bold leading-6 text-center"
            style={{
              background: "#FFFCF8",
              color: "#3D3530",
              border: "1.5px solid #E5D1C3",
              boxShadow: "0 8px 20px rgba(61,53,48,0.10)",
            }}
          >
            {message}

            <div
              className="absolute left-1/2 -bottom-2 w-4 h-4"
              style={{
                background: "#FFFCF8",
                borderRight: "1.5px solid #E5D1C3",
                borderBottom: "1.5px solid #E5D1C3",
                transform: "translateX(-50%) rotate(45deg)",
              }}
            />
          </div>
        </div>

        {/* 해도리 */}
        <button
          onClick={changeMessage}
          className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 z-10 active:scale-95 transition-all"
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
          }}
          aria-label="해도리 말 걸기"
        >
          <div
            className="relative w-64 h-64 rounded-full flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle, rgba(255,252,248,0.94) 0%, rgba(255,225,190,0.52) 58%, rgba(255,255,255,0) 72%)",
            }}
          >
            <img
              src="/images/haedori-body.png"
              alt="해도리"
              className="w-52 h-52 object-contain drop-shadow-xl"
            />
          </div>
        </button>

        {/* 그림자 */}
        <div
          className="absolute left-1/2 bottom-[22%] -translate-x-1/2 w-[70%] h-10 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, rgba(61,53,48,0.18) 0%, rgba(61,53,48,0.08) 45%, rgba(61,53,48,0) 72%)",
          }}
        />
      </div>
    </div>
  )
}