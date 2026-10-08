"use client"

import { useEffect, useState } from "react"
import { onPearlReward, type PearlReward } from "@/lib/pearl-events"

type ToastItem = PearlReward & { key: number }

/** 진주 보상 토스트. (appshell) 레이아웃에 한 번만 둔다. */
export default function PearlToaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    let seq = 0
    return onPearlReward((reward) => {
      const key = ++seq
      setItems((prev) => [...prev, { ...reward, key }])
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.key !== key))
      }, 2600)
    })
  }, [])

  if (!items.length) return null

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-6 z-[1000] flex -translate-x-1/2 flex-col items-center gap-2"
      aria-live="polite"
    >
      {items.map((t) => (
        <div
          key={t.key}
          className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-extrabold"
          style={{
            background: "#FFFCF8",
            color: "#3D3530",
            border: "1.5px solid #E5DDD5",
            boxShadow: "0 6px 20px rgba(61,53,48,0.14)",
            animation: "pearlToastIn 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full"
            style={{ background: "#D4AF8A" }}
            aria-hidden="true"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FFFCF8" }} />
          </span>
          <span>{t.label}</span>
          <span style={{ color: "#C9856A" }}>+{t.amount} 진주</span>
        </div>
      ))}
      <style>{`
        @keyframes pearlToastIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
