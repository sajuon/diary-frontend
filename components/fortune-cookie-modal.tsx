"use client"

import { useEffect, useRef, useState } from "react"
import { apiClient } from "@/lib/api"
import { notifyPearlBalance } from "@/lib/pearl-events"

export type CookieKind = "free" | "paid"

export type CookieResult = {
  kind: CookieKind
  reward: number
  is_jackpot: boolean
  message: string
  price?: number
  balance?: number
}

type Phase = "idle" | "shaking" | "cracking" | "revealed"

interface FortuneCookieModalProps {
  kind: CookieKind
  /** 오늘 이미 연 쿠키를 다시 볼 때: 애니메이션 없이 쪽지를 펼친 상태로 보여준다 */
  viewResult?: CookieResult | null
  onClose: () => void
  onOpened: (result: CookieResult) => void
}

const MIN_SHAKE_MS = 900
const CRACK_MS = 1500

const LEFT_HALF =
  "M12,92 Q18,22 100,30 L95,42 L104,52 L96,62 L103,72 L100,82 Q52,112 12,92 Z"
const RIGHT_HALF =
  "M188,92 Q182,22 100,30 L95,42 L104,52 L96,62 L103,72 L100,82 Q148,112 188,92 Z"

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function FortuneCookieModal({
  kind,
  viewResult,
  onClose,
  onOpened,
}: FortuneCookieModalProps) {
  const [phase, setPhase] = useState<Phase>(viewResult ? "revealed" : "idle")
  const [result, setResult] = useState<CookieResult | null>(viewResult ?? null)
  const [error, setError] = useState<string | null>(null)
  const replay = Boolean(viewResult)
  const busy = useRef(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (phase === "idle" || phase === "revealed")) onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, onClose])

  const handleTapCookie = async () => {
    if (phase !== "idle" || busy.current) return
    busy.current = true
    setError(null)
    setPhase("shaking")
    try {
      const [res] = await Promise.all([
        kind === "free" ? apiClient.openFreeFortuneCookie() : apiClient.buyFortuneCookie(),
        wait(MIN_SHAKE_MS),
      ])
      setResult(res)
      setPhase("cracking")
      await wait(CRACK_MS)
      setPhase("revealed")
      // 진주 숫자는 쪽지가 펼쳐진 뒤에 바꿔서 결과를 미리 보여주지 않는다
      if (typeof res.balance === "number") notifyPearlBalance(res.balance)
      onOpened(res)
    } catch (err: any) {
      setError(err?.message || "포춘쿠키를 열지 못했어요.")
      setPhase("idle")
    } finally {
      busy.current = false
    }
  }

  const canClose = phase === "idle" || phase === "revealed"
  const opened = phase === "cracking" || phase === "revealed"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(61,53,48,0.45)" }}
      onClick={() => canClose && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={kind === "free" ? "오늘의 포춘쿠키" : "포춘쿠키"}
    >
      <div
        className="w-full max-w-xs rounded-3xl px-5 pt-6 pb-5 text-center"
        style={{ background: "#FFFCF8", boxShadow: "0 12px 40px rgba(61,53,48,0.22)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-bold" style={{ color: "#C9856A" }}>
          {kind === "free" ? "오늘의 포춘쿠키" : "상점 포춘쿠키"}
        </p>

        <div className="fc-stage" aria-live="polite">
          {/* 쪽지 */}
          <div
            className={`fc-slip ${phase === "cracking" ? "fc-slip-out" : ""} ${
              phase === "revealed" ? (replay ? "fc-slip-static" : "fc-slip-done") : ""
            }`}
          >
            <p className={`fc-slip-text ${phase === "revealed" ? "fc-text-in" : ""}`}>
              {result?.message ?? ""}
            </p>
          </div>

          {/* 쿠키 */}
          <button
            type="button"
            onClick={handleTapCookie}
            disabled={phase !== "idle"}
            className={`fc-cookie ${phase === "idle" ? "fc-bob" : ""} ${
              phase === "shaking" ? "fc-shake" : ""
            } ${opened ? "fc-opened" : ""} ${replay ? "fc-instant" : ""}`}
            aria-label="포춘쿠키 열기"
          >
            <svg viewBox="0 0 200 120" width="190" height="114" aria-hidden="true" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="fc-dough" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F3C98B" />
                  <stop offset="70%" stopColor="#E3A55E" />
                  <stop offset="100%" stopColor="#C9853F" />
                </linearGradient>
              </defs>
              <g className="fc-half fc-left">
                <path d={LEFT_HALF} fill="url(#fc-dough)" stroke="#B9763A" strokeWidth="2" strokeLinejoin="round" />
                <path d="M30,80 Q40,44 88,40" fill="none" stroke="#FBE3B8" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
              </g>
              <g className="fc-half fc-right">
                <path d={RIGHT_HALF} fill="url(#fc-dough)" stroke="#B9763A" strokeWidth="2" strokeLinejoin="round" />
                <path d="M170,80 Q162,48 118,40" fill="none" stroke="#FBE3B8" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
              </g>
            </svg>
            {phase === "cracking" && !replay && (
              <span className="fc-crumbs" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <i key={i} style={{ ["--i" as string]: i }} />
                ))}
              </span>
            )}
          </button>
        </div>

        <div style={{ minHeight: 64 }}>
          {phase === "idle" && !error && (
            <p className="text-sm font-bold" style={{ color: "#6B6059" }}>
              쿠키를 톡 눌러서 열어보세요
            </p>
          )}
          {phase === "shaking" && (
            <p className="text-sm font-bold" style={{ color: "#9A8F87" }}>
              쿠키가 흔들리고 있어요…
            </p>
          )}
          {error && (
            <p className="text-sm font-bold" style={{ color: "#C9856A" }}>
              {error}
            </p>
          )}
          {phase === "revealed" && result && (
            <div className={replay ? "" : "fc-reward-in"}>
              {result.is_jackpot && (
                <p className="text-xs font-extrabold" style={{ color: "#C9856A" }}>
                  ✨ 대박! ✨
                </p>
              )}
              <p
                className={`text-2xl font-extrabold ${result.is_jackpot ? "fc-jackpot" : ""}`}
                style={{ color: "#3D3530" }}
              >
                +{result.reward} 진주
              </p>
              {typeof result.balance === "number" && !replay && (
                <p className="text-xs mt-1" style={{ color: "#9A8F87" }}>
                  보유 진주 {result.balance}개
                </p>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={!canClose}
          className="w-full mt-3 py-3 rounded-2xl text-sm font-bold disabled:opacity-40"
          style={{ background: "#EDE8E0", color: "#6B6059" }}
        >
          닫기
        </button>
      </div>

      <style>{`
        .fc-stage {
          position: relative;
          height: 210px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          margin-top: 4px;
        }
        .fc-cookie {
          position: relative;
          z-index: 2;
          background: none;
          border: 0;
          padding: 0 0 18px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .fc-cookie:disabled { cursor: default; }
        .fc-half {
          transform-box: fill-box;
          transition: transform 0.55s cubic-bezier(.2,.9,.3,1.2);
        }
        .fc-left { transform-origin: 100% 100%; }
        .fc-right { transform-origin: 0% 100%; }
        .fc-opened .fc-left { transform: translate(-18px, 6px) rotate(-12deg); }
        .fc-opened .fc-right { transform: translate(18px, 6px) rotate(12deg); }
        .fc-instant .fc-half { transition: none; }

        .fc-bob { animation: fcBob 2.4s ease-in-out infinite; }
        .fc-shake { animation: fcShake 0.42s ease-in-out infinite; }

        .fc-crumbs { position: absolute; left: 50%; top: 52%; pointer-events: none; }
        .fc-crumbs i {
          position: absolute;
          width: 5px; height: 5px;
          border-radius: 2px;
          background: #D9974F;
          animation: fcCrumb 0.8s ease-in forwards;
          animation-delay: calc(var(--i) * 40ms);
        }

        .fc-slip {
          position: absolute;
          z-index: 1;
          left: 50%;
          bottom: 66px;
          width: 240px;
          min-height: 64px;
          margin-left: -120px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FFFFFF;
          border: 1px solid #EADFD3;
          border-radius: 4px;
          box-shadow: 0 4px 14px rgba(61,53,48,0.12);
          opacity: 0;
          transform: translateY(40px) scaleX(0.12);
        }
        .fc-slip::before, .fc-slip::after {
          content: "";
          position: absolute;
          top: 8px; bottom: 8px;
          width: 1px;
          background: #F0C9B6;
        }
        .fc-slip::before { left: 6px; }
        .fc-slip::after { right: 6px; }
        .fc-slip-out { animation: fcSlipUp 0.6s 0.35s ease-out forwards; }
        .fc-slip-done { opacity: 1; transform: translateY(-46px) scaleX(1); animation: fcSlipOpen 0.5s ease-out; }
        .fc-slip-static { opacity: 1; transform: translateY(-46px) scaleX(1); }

        .fc-slip-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 600;
          color: #3D3530;
          word-break: keep-all;
          opacity: 0;
        }
        .fc-slip-static .fc-slip-text { opacity: 1; }
        .fc-text-in { animation: fcFade 0.4s 0.35s ease-out forwards; }

        .fc-reward-in { animation: fcPop 0.45s 0.6s ease-out both; }
        .fc-jackpot { animation: fcGlow 1.2s ease-in-out infinite; }

        @keyframes fcBob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(-2deg); }
        }
        @keyframes fcShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-7deg) translateX(-3px); }
          75% { transform: rotate(7deg) translateX(3px); }
        }
        @keyframes fcCrumb {
          0% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
          100% {
            opacity: 0;
            transform: translate(calc((var(--i) - 2.5) * 16px), 60px) rotate(140deg);
          }
        }
        @keyframes fcSlipUp {
          0% { opacity: 0; transform: translateY(40px) scaleX(0.12); }
          100% { opacity: 1; transform: translateY(-46px) scaleX(0.12); }
        }
        @keyframes fcSlipOpen {
          from { transform: translateY(-46px) scaleX(0.12); }
          to { transform: translateY(-46px) scaleX(1); }
        }
        @keyframes fcFade { to { opacity: 1; } }
        @keyframes fcPop {
          0% { opacity: 0; transform: scale(0.7); }
          70% { opacity: 1; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fcGlow {
          0%, 100% { text-shadow: 0 0 0 rgba(201,133,106,0); }
          50% { text-shadow: 0 0 14px rgba(201,133,106,0.75); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fc-bob, .fc-shake, .fc-jackpot { animation: none; }
        }
      `}</style>
    </div>
  )
}
