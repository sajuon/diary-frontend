"use client"

import { useState } from "react"
import { useUserPearls } from "../hooks/use-user-pearls"

interface PearlShopScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
}

const packages = [
  { id: 1, pearls: 100, price: "5,000원", tag: null },
  { id: 2, pearls: 150, price: "7,000원", tag: null },
  { id: 3, pearls: 200, price: "9,000원", tag: "인기" },
  { id: 4, pearls: 250, price: "11,000원", tag: null },
  { id: 5, pearls: 300, price: "13,000원", tag: "가장 많이" }
];

const PearlIcon = ({ size = 28 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    aria-hidden="true"
  >
    <circle
      cx="14"
      cy="14"
      r="13"
      fill="url(#pearl-grad)"
      stroke="#D4A96A"
      strokeWidth="0.8"
    />
    <ellipse cx="10.5" cy="10" rx="4" ry="2.5" fill="white" opacity="0.45" />
    <defs>
      <radialGradient id="pearl-grad" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#EDD5A0" />
        <stop offset="100%" stopColor="#C9A060" />
      </radialGradient>
    </defs>
  </svg>
)

function PearlShopScreen({ onNavigate }: PearlShopScreenProps) {
  const pearls = useUserPearls()
  const [purchased, setPurchased] = useState<number | null>(null)

  const handlePurchase = (pkg: typeof packages[0]) => {
    setPurchased(pkg.id)
    // setBalance((prev) => prev + pkg.pearls) // 만약 setBalance가 필요하다면 정의 필요
    setTimeout(() => setPurchased(null), 1600)
  }

  return (
    <div
      className="flex flex-col h-full font-sans"
      style={{ background: "#F8F6F2", animation: "slideInRight 0.24s ease-out" }}
    >
      {/* Status bar spacer */}
      <div style={{ height: "50px" }} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-1 pb-4">
        <button
          onClick={() => onNavigate("home")}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
          aria-label="뒤로 가기"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3D3530"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <h1 className="text-base font-extrabold" style={{ color: "#3D3530" }}>
          진주 상점
        </h1>

        {/* Current balance */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
        >
          <PearlIcon size={16} />
          <span className="text-sm font-bold" style={{ color: "#3D3530" }}>
            {pearls}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">

        {/* Description card */}
        <div
          className="rounded-2xl p-4 mb-6 flex items-center gap-3"
          style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
        >
          <PearlIcon size={36} />
          <div>
            <p className="text-sm font-bold leading-snug" style={{ color: "#3D3530" }}>
              진주로 해도리 방을 꾸며보세요
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#9A8F87" }}>
              벽지, 가구, 소품을 상점에서 구매할 수 있어요
            </p>
          </div>
        </div>

        {/* Package list */}
        <div className="space-y-3">
          {packages.map((pkg) => {
            const isActive = purchased === pkg.id
            return (
              <div
                key={pkg.id}
                className="rounded-2xl px-4 py-4 flex items-center gap-4 transition-all"
                style={{
                  background: isActive ? "#FFF5EC" : "#FFFCF8",
                  border: isActive ? "1.5px solid #F2C4A8" : "1.5px solid #E5DDD5",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  transform: isActive ? "scale(0.98)" : "scale(1)",
                }}
              >
                {/* Pearl icon */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#F5EDD8" }}
                >
                  <PearlIcon size={28} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold" style={{ color: "#3D3530" }}>
                      {pkg.pearls} 진주
                    </span>
                    {pkg.tag && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "#F2C4A8", color: "#C9856A" }}
                      >
                        {pkg.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: "#9A8F87" }}>
                    {pkg.price}
                  </p>
                </div>

                {/* Purchase button */}
                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={isActive}
                  className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
                  style={{
                    background: isActive ? "#A8BBA5" : "#C9856A",
                    color: "#FFFCF8",
                    boxShadow: isActive ? "none" : "0 2px 8px rgba(201,133,106,0.25)",
                  }}
                  aria-label={`${pkg.pearls} 진주 구매`}
                >
                  {isActive ? "완료" : "구매"}
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <p
          className="text-center text-xs mt-6 leading-relaxed"
          style={{ color: "#C4B8B0" }}
        >
          진주는 환불되지 않아요.{"\n"}결제 문의는 설정 {">"} 고객 지원에서 도와드려요.
        </p>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default PearlShopScreen
