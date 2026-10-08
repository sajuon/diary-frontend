"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { apiClient } from "@/lib/api"
import {
  DEFAULT_PAPER_KEY,
  LETTER_LINE_HEIGHT,
  getLetterPaper,
  readCachedPaperKey,
  writeCachedPaperKey,
  type LetterPaper,
} from "@/lib/letter-papers"

/** 적용 중인 편지지 키. 캐시로 먼저 그리고 서버 값으로 맞춘다. */
export function useLetterPaperKey() {
  const [key, setKey] = useState(DEFAULT_PAPER_KEY)
  useEffect(() => {
    setKey(readCachedPaperKey())
    apiClient
      .getRoom()
      .then((room) => {
        setKey(room.letter_paper_key)
        writeCachedPaperKey(room.letter_paper_key)
      })
      .catch((err) => console.warn("Failed to load letter paper:", err))
  }, [])
  return key
}

/** 편지 종이. 본문은 children으로 넣는다. */
export function LetterPaperCard({
  paper,
  children,
  compact = false,
}: {
  paper: LetterPaper
  children: ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl ${compact ? "px-4 py-4" : "px-5 py-6"}`}
      style={{
        background: paper.background,
        border: paper.border,
        boxShadow: paper.shadow,
        color: paper.text,
      }}
    >
      {paper.pattern && (
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage: paper.pattern.image,
            backgroundSize: paper.pattern.size,
            backgroundPosition: paper.pattern.position,
          }}
        />
      )}

      {paper.corners?.topLeft && (
        <span className="pointer-events-none absolute left-2.5 top-2 text-base opacity-80" aria-hidden="true">
          {paper.corners.topLeft}
        </span>
      )}
      {paper.corners?.bottomRight && (
        <span className="pointer-events-none absolute bottom-2 right-3 text-base opacity-80" aria-hidden="true">
          {paper.corners.bottomRight}
        </span>
      )}

      {paper.stamp && (
        <div
          className={`pointer-events-none absolute right-3 top-3 flex rotate-6 items-center justify-center rounded-sm ${compact ? "h-7 w-6 text-sm" : "h-10 w-9 text-lg"}`}
          aria-hidden="true"
          style={{ background: paper.stamp.background, border: paper.stamp.border }}
        >
          {paper.stamp.emoji}
        </div>
      )}

      <div
        className={`relative ${paper.stamp ? (compact ? "pr-6" : "pr-9") : ""} ${paper.corners?.topLeft ? "pt-3" : ""}`}
      >
        {children}
      </div>
    </div>
  )
}

/** 편지 본문 텍스트 (줄노트 줄 간격에 맞춤) */
export function LetterText({ children, small = false }: { children: ReactNode; small?: boolean }) {
  return (
    <p
      className={`whitespace-pre-line ${small ? "text-[11px]" : "text-sm"}`}
      style={{ lineHeight: `${LETTER_LINE_HEIGHT}px` }}
    >
      {children}
    </p>
  )
}

/** 적용 중인 편지지로 편지를 보여준다 */
export default function AppliedLetterPaper({ children }: { children: ReactNode }) {
  const key = useLetterPaperKey()
  return <LetterPaperCard paper={getLetterPaper(key)}>{children}</LetterPaperCard>
}
