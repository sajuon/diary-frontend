"use client"

import { useState } from "react"

interface LetterboxScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
}

interface Letter {
  id: number
  date: string
  preview: string
  body: string
  starred: boolean
  unread: boolean
}

const initialLetters: Letter[] = [
  {
    id: 1,
    date: "2월 26일",
    preview: "오늘 하루도 정말 잘 버텼어요. 그 작은 용기가 해도리 눈엔 참 반짝여 보였거든요.",
    body: `오늘 하루도 정말 잘 버텼어요.\n그 작은 용기가 해도리 눈엔 참 반짝여 보였거든요.\n\n때로는 아무것도 안 한 것 같아도, 그냥 하루를 살아낸 것만으로도 충분해요. 정말이에요.\n\n내일도 해도리가 옆에 있을게요.`,
    starred: false,
    unread: true,
  },
  {
    id: 2,
    date: "2월 25일",
    preview: "빗소리 들으며 책을 읽었다고 했죠? 그 고요한 시간이 참 좋아 보였어요.",
    body: `빗소리 들으며 책을 읽었다고 했죠?\n그 고요한 시간이 참 좋아 보였어요.\n\n혼자만의 시간을 소중히 여기는 당신이 해도리는 정말 좋아요.\n그 평온함이 오래오래 이어지길 바랄게요.`,
    starred: true,
    unread: false,
  },
  {
    id: 3,
    date: "2월 23일",
    preview: "좋은 일이 생겼다고 했을 때, 해도리도 같이 두근거렸어요. 당신의 기쁨이 전해졌거든요.",
    body: `좋은 일이 생겼다고 했을 때,\n해도리도 같이 두근거렸어요.\n\n당신의 기쁨이 이쪽까지 전해졌거든요.\n기쁜 날은 충분히 기뻐해도 괜찮아요. 마음껏 누려요.`,
    starred: false,
    unread: false,
  },
  {
    id: 4,
    date: "2월 21일",
    preview: "일이 많았던 날, 다 끝내고 일기를 써준 거잖아요. 그게 쉽지 않은 일인데.",
    body: `일이 많았던 날, 다 끝내고 일기를 써준 거잖아요.\n그게 쉽지 않은 일인데.\n\n지치고 피곤한 하루 끝에도 자기 자신을 들여다보려는 그 마음, 해도리가 꼭 기억할게요.`,
    starred: false,
    unread: false,
  },
  {
    id: 5,
    date: "2월 19일",
    preview: "새 책을 샀다고요! 어떤 책인지 궁금해요. 읽고 나서 꼭 알려줘요.",
    body: `새 책을 샀다고요!\n어떤 책인지 궁금해요. 읽고 나서 꼭 알려줘요.\n\n새로운 것에 설레는 마음, 그게 삶을 풍성하게 만드는 것 같아요. 해도리도 덩달아 기대가 생겼어요.`,
    starred: false,
    unread: false,
  },
]

interface LetterboxScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
}

export default function LetterboxScreen({ onNavigate }: LetterboxScreenProps) {
  const [letters, setLetters] = useState<Letter[]>(initialLetters)

  const toggleStar = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setLetters((prev) =>
      prev.map((l) => (l.id === id ? { ...l, starred: !l.starred } : l))
    )
  }

  const openLetter = (letter: Letter) => {
    setLetters((prev) =>
      prev.map((l) => (l.id === letter.id ? { ...l, unread: false } : l))
    )
    onNavigate("letter-detail", { letter })
  }

  return (
    <div className="flex flex-col h-full font-sans" style={{ background: "#F8F6F2" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-5 flex-shrink-0">
        <button
          onClick={() => onNavigate("calendar")}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
          aria-label="뒤로 가기"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D3530" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="text-center">
          <h2 className="text-base font-extrabold" style={{ color: "#3D3530" }}>
            해도리 편지함
          </h2>
          <p className="text-xs font-medium" style={{ color: "#9A8F87" }}>
            해도리가 남긴 편지들
          </p>
        </div>
        <div className="w-9" />
      </div>

      {/* Unread count badge */}
      {letters.some((l) => l.unread) && (
        <div className="px-5 mb-4 flex-shrink-0">
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-2xl"
            style={{ background: "#F2C4A830", border: "1.5px solid #F2C4A870" }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: "#C9856A" }}
            />
            <p className="text-xs font-semibold" style={{ color: "#C9856A" }}>
              읽지 않은 편지 {letters.filter((l) => l.unread).length}개가 있어요
            </p>
          </div>
        </div>
      )}

      {/* Letter list */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
        {letters.map((letter) => (
          <button
            key={letter.id}
            onClick={() => openLetter(letter)}
            className="w-full text-left transition-all active:scale-[0.98]"
          >
            <div
              className="flex items-start gap-3 px-4 py-4 rounded-2xl"
              style={{
                background: letter.unread ? "#FFFCF8" : "#FDFAF7",
                border: letter.unread ? "1.5px solid #F2C4A870" : "1.5px solid #E5DDD5",
                boxShadow: letter.unread
                  ? "0 3px 12px rgba(201,133,106,0.10)"
                  : "0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              {/* Avatar */}
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-xl"
                style={{ background: "#EDE8E0" }}
                aria-hidden="true"
              >
                🦦
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: "#3D3530" }}>
                      해도리
                    </span>
                    {letter.unread && (
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "#C9856A" }}
                      />
                    )}
                  </div>
                  <span className="text-xs" style={{ color: "#C4B8B0" }}>
                    {letter.date}
                  </span>
                </div>
                <p
                  className="text-xs leading-relaxed"
                  style={{
                    color: "#6B6059",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {letter.preview}
                </p>
              </div>

              {/* Right: star + chevron */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0 self-center ml-1">
                <span
                  onClick={(e) => toggleStar(letter.id, e)}
                  className="w-7 h-7 flex items-center justify-center rounded-full transition-all active:scale-90 cursor-pointer"
                  style={{ background: letter.starred ? "#FFF3D0" : "transparent" }}
                  aria-label={letter.starred ? "즐겨찾기 해제" : "즐겨찾기"}
                  role="button"
                  tabIndex={0}
                >
                  {letter.starred ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#F4C97A" stroke="#C9A060" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C4B8B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4B8B0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
