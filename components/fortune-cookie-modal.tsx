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
const CRACK_MS = 1300

const COOKIE_SRC = "/fortune-cookie/cookie.png"
const SLIP_SRC = "/fortune-cookie/slip.png"

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
  const stageClass = [
    "fc-stage",
    `fc-${phase}`,
    replay ? "fc-replay" : "",
  ].join(" ")

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

        <div className={stageClass} aria-live="polite">
          {/* 쪽지: 쿠키가 좌우로 벌어지면 그 사이에서 가로로 길게 나온다 */}
          <div className="fc-slip" style={{ backgroundImage: `url(${SLIP_SRC})` }}>
            <p className="fc-slip-text">{result?.message ?? ""}</p>
          </div>

          {/* 쿠키: 같은 그림을 가운데 접힌 선 기준으로 좌우 반씩 잘라 보여준다 */}
          <button
            type="button"
            onClick={handleTapCookie}
            disabled={phase !== "idle"}
            className="fc-cookie"
            aria-label="포춘쿠키 열기"
          >
            <span className="fc-wobble">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={COOKIE_SRC} alt="" className="fc-half fc-left" draggable={false} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={COOKIE_SRC} alt="" className="fc-half fc-right" draggable={false} />
            </span>
            {phase === "cracking" && (
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
        /* 무대: 쿠키 그림은 700x582 → 가로 190px이면 세로 158px */
        .fc-stage {
          position: relative;
          height: 250px;
          margin-top: 4px;
        }

        /* ---------- 쿠키 ---------- */
        .fc-cookie {
          position: absolute;
          left: 50%;
          top: 76px;
          width: 190px;
          height: 158px;
          margin-left: -95px;
          z-index: 2;
          padding: 0;
          background: none;
          border: 0;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .fc-cookie:disabled { cursor: default; }
        .fc-wobble { position: absolute; inset: 0; display: block; }
        .fc-half {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          user-select: none;
          pointer-events: none;
          transition: transform 0.6s cubic-bezier(.2,.9,.3,1.15);
        }
        /* 접힌 선(가로 50%)을 기준으로 좌우를 자른다 */
        .fc-left  { clip-path: inset(0 50% 0 0); }
        .fc-right { clip-path: inset(0 0 0 50%); }

        .fc-idle .fc-wobble { animation: fcBob 2.4s ease-in-out infinite; }
        .fc-shaking .fc-wobble { animation: fcShake 0.4s ease-in-out infinite; }
        /* 그림 그대로 좌우로만 벌어진다 */
        .fc-cracking .fc-left, .fc-revealed .fc-left { transform: translateX(-48px); }
        .fc-cracking .fc-right, .fc-revealed .fc-right { transform: translateX(48px); }
        .fc-replay .fc-half { transition: none; }

        .fc-crumbs { position: absolute; left: 50%; top: 40%; pointer-events: none; }
        .fc-crumbs i {
          position: absolute;
          width: 6px; height: 5px;
          border-radius: 2px;
          background: #E2A866;
          animation: fcCrumb 0.8s ease-in forwards;
          animation-delay: calc(var(--i) * 40ms);
        }

        /* ---------- 쪽지 ---------- */
        /* 쪽지 그림은 900x229 (약 3.9:1) */
        .fc-slip {
          position: absolute;
          left: 50%;
          top: 120px;
          width: 270px;
          min-height: 69px;
          margin-left: -135px;
          padding: 12px 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-size: 100% 100%;
          background-repeat: no-repeat;
          z-index: 3;
          pointer-events: none;
          /* 처음엔 숨어 있다가, 쿠키가 벌어진 사이에서 가로로 길게 나온다 */
          opacity: 0;
          transform: scaleX(0.04);
        }
        .fc-cracking .fc-slip { animation: fcSlipOut 0.8s 0.4s cubic-bezier(.2,.8,.3,1) forwards; }
        .fc-revealed .fc-slip { opacity: 1; transform: scaleX(1); }

        .fc-slip-text {
          margin: 0;
          font-size: 13.5px;
          line-height: 1.45;
          font-weight: 700;
          color: #6B4A35;
          word-break: keep-all;
          opacity: 0;
        }
        .fc-revealed .fc-slip-text { animation: fcFade 0.4s 0.05s ease-out forwards; }
        .fc-replay .fc-slip-text { animation: none; opacity: 1; }

        .fc-reward-in { animation: fcPop 0.45s 0.3s ease-out both; }
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
          100% { opacity: 0; transform: translate(calc((var(--i) - 2.5) * 18px), 90px) rotate(140deg); }
        }
        @keyframes fcSlipOut {
          0%   { opacity: 1; transform: scaleX(0.04); }
          100% { opacity: 1; transform: scaleX(1); }
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
          .fc-wobble, .fc-jackpot { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
