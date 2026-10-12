// /home/dori/diary-frontend/components/diary-screen.tsx
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { apiClient } from "@/lib/api"
import { handlePearlReward } from "@/lib/pearl-events"
import { getDailyQuestion } from "@/lib/daily-questions"
import { getQuestionUserKeyFromStorage } from "@/lib/question-user-key"
import {
  getDiaryMonthKeyFromDate,
  invalidateDiaryMonth,
} from "@/lib/diary-cache"
import {
  loadDraft,
  saveDraft,
  removeDraft,
  pruneOldDrafts,
  type DiaryDraft,
} from "@/lib/diary-draft"
import {
  EmotionStonePicker,
  isEmotionKey,
  FALLBACK_EMOTION,
  type EmotionKey,
} from "@/components/emotion-stone"
import {
  WeatherTilePicker,
  isWeatherKey,
  FALLBACK_WEATHER,
  type WeatherKey,
} from "@/components/weather-tile"

interface DiaryScreenProps {
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
  initialQuestion?: string
  initialQuestionDate?: string
  initialQuestionSource?: string
}

type DiaryType = "question" | "free"

// 탭(질문형/자유형)별로 화면에 입력 중인 상태를 보관한다.
// 탭을 바꿔도 저장 안 한 글이 서버 내용으로 덮어써지지 않게 하기 위함.
type TabForm = {
  text: string
  weather: WeatherKey
  mood: EmotionKey
  isEdit: boolean
}

// 서버에서 불러온(또는 아직 없는) 일기 원본. 입력 내용이 바뀌었는지 비교하는 기준.
type ServerBase = {
  entryId: number | null
  updatedAt: string | null
  content: string
  weather: string
  mood: string
}

type DraftStatus = "idle" | "pending" | "saved" | "error"

const AUTOSAVE_DELAY_MS = 2500

function formatDraftTime(savedAt: number) {
  const d = new Date(savedAt)
  const hour = d.getHours()
  const ampm = hour < 12 ? "오전" : "오후"
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${ampm} ${h12}:${min}`
}

type DiarySaveResponse = {
  id?: number
  user_id?: number
  entry_date?: string
  content?: string
  weather?: string | null
  mood_tags?: string[] | null
  summary_tag?: string | null
  diary_type?: DiaryType | null
  question_id?: string | null
  question_text?: string | null
  created_at?: string
  updated_at?: string
}

function getTodayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function isValidDateString(value: string | null): value is string {
  if (!value) return false
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function formatKoreanDate(dateString: string) {
  const [, month, day] = dateString.split("-")
  return `${Number(month)}월 ${Number(day)}일 일기`
}

function dateStringToLocalDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function getQuestionIdFromDate(dateString: string) {
  const [, month, day] = dateString.split("-")
  return `${month}-${day}`
}

export default function DiaryScreen({
  onNavigate,
  initialQuestion,
  initialQuestionDate,
}: DiaryScreenProps) {
  const searchParams = useSearchParams()

  const selectedDate = useMemo<string>(() => {
    const dateParam = searchParams.get("date")
    return isValidDateString(dateParam) ? dateParam : getTodayDateString()
  }, [searchParams])

  const initialDiaryType = useMemo<DiaryType>(() => {
    return searchParams.get("diary_type") === "free" ? "free" : "question"
  }, [searchParams])

  const isToday = selectedDate === getTodayDateString()

  const [activeTab, setActiveTab] = useState<DiaryType>(initialDiaryType)
  const [isEdit, setIsEdit] = useState(false)
  const [canEdit, setCanEdit] = useState(true)

  const [text, setText] = useState("")
  const [selectedWeather, setSelectedWeather] =
    useState<WeatherKey>(FALLBACK_WEATHER)
  const [selectedMood, setSelectedMood] =
    useState<EmotionKey>(FALLBACK_EMOTION)
  const [question, setQuestion] = useState("오늘의 질문을 준비하고 있어요...")

  const [loading, setLoading] = useState(false)
  const [showTypeInfo, setShowTypeInfo] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const typeLabel = activeTab === "question" ? "질문형" : "자유형"

  // key: `${날짜}:${탭}` → 그 탭에서 입력 중이던 내용
  const tabFormsRef = useRef<Record<string, TabForm>>({})
  const formKey = (tab: DiaryType) => `${selectedDate}:${tab}`

  // ---------- 자동 임시저장 ----------
  const [userId, setUserId] = useState<string | null>(null)
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("idle")
  const [pendingDraft, setPendingDraft] = useState<{
    draft: DiaryDraft
    conflict: boolean
  } | null>(null)

  // key: `${날짜}:${탭}` → 서버 원본
  const baseRef = useRef<Record<string, ServerBase>>({})
  // 지금 화면의 입력 내용이 어느 날짜·탭의 것인지 (불러오는 중이면 null)
  const formOwnerRef = useRef<{ date: string; tab: DiaryType } | null>(null)
  // 복구 안내를 이미 확인한 날짜·탭
  const draftCheckedRef = useRef<Set<string>>(new Set())
  const submittedRef = useRef(false)

  // 언마운트·백그라운드 전환 시점에 최신 값을 읽기 위한 ref
  const latestRef = useRef({
    text,
    weather: selectedWeather as string,
    mood: selectedMood as string,
    userId,
    pendingDraft,
  })
  latestRef.current = {
    text,
    weather: selectedWeather,
    mood: selectedMood,
    userId,
    pendingDraft,
  }

  // 지금 입력 내용을 바로 기기에 저장 (원본과 같으면 초안 삭제)
  const persistDraftNow = () => {
    const { text: t, weather, mood, userId: uid, pendingDraft: pd } =
      latestRef.current
    const owner = formOwnerRef.current

    if (!uid || !owner || submittedRef.current || pd) return

    const base = baseRef.current[`${owner.date}:${owner.tab}`]
    if (!base) return

    const changed =
      t !== base.content || weather !== base.weather || mood !== base.mood

    if (!changed || !t.trim()) {
      // 복구 안내 확인 전에는 지우지 않는다 (불러온 직후 초안이 삭제되는 것 방지)
      if (draftCheckedRef.current.has(`${owner.date}:${owner.tab}`)) {
        removeDraft(uid, owner.date, owner.tab)
      }
      setDraftStatus("idle")
      return
    }

    const ok = saveDraft({
      userId: uid,
      entryDate: owner.date,
      diaryType: owner.tab,
      mode: base.entryId ? "edit" : "new",
      entryId: base.entryId,
      baseUpdatedAt: base.updatedAt,
      content: t,
      weather,
      mood,
    })

    setDraftStatus(ok ? "saved" : "error")
  }

  const persistDraftRef = useRef(persistDraftNow)
  persistDraftRef.current = persistDraftNow

  // 사용자 ID 확보 (초안 키에 사용) + 오래된 초안 정리
  useEffect(() => {
    pruneOldDrafts()

    let cancelled = false
    apiClient
      .getMe()
      .then((me: any) => {
        if (!cancelled && me?.id != null) setUserId(String(me.id))
      })
      .catch(() => {
        // 사용자 정보를 못 받으면 임시저장 없이 기존처럼 동작
      })

    return () => {
      cancelled = true
    }
  }, [])

  // 입력을 멈추고 2.5초 지나면 저장
  useEffect(() => {
    const owner = formOwnerRef.current
    if (!userId || fetching || pendingDraft || !owner) return
    if (owner.date !== selectedDate || owner.tab !== activeTab) return

    const base = baseRef.current[`${owner.date}:${owner.tab}`]
    if (!base) return

    const changed =
      text !== base.content ||
      selectedWeather !== base.weather ||
      selectedMood !== base.mood

    if (!changed) {
      if (draftCheckedRef.current.has(`${owner.date}:${owner.tab}`)) {
        removeDraft(userId, owner.date, owner.tab)
      }
      setDraftStatus("idle")
      return
    }

    setDraftStatus("pending")
    const timer = setTimeout(() => persistDraftRef.current(), AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [
    text,
    selectedWeather,
    selectedMood,
    userId,
    fetching,
    pendingDraft,
    activeTab,
    selectedDate,
  ])

  // 앱이 백그라운드로 가거나 화면을 떠날 때 바로 저장
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") persistDraftRef.current()
    }
    const onPageHide = () => persistDraftRef.current()

    document.addEventListener("visibilitychange", onHidden)
    window.addEventListener("pagehide", onPageHide)

    return () => {
      document.removeEventListener("visibilitychange", onHidden)
      window.removeEventListener("pagehide", onPageHide)
      // 다른 화면으로 이동(언마운트)할 때
      persistDraftRef.current()
    }
  }, [])

  // 불러오기가 끝나면 이 날짜·탭의 초안이 있는지 확인하고 복구 안내
  useEffect(() => {
    if (!userId || fetching) return

    const key = `${selectedDate}:${activeTab}`
    const owner = formOwnerRef.current
    if (!owner || owner.date !== selectedDate || owner.tab !== activeTab) return
    if (draftCheckedRef.current.has(key)) return

    const base = baseRef.current[key]
    if (!base) return

    draftCheckedRef.current.add(key)

    const draft = loadDraft(userId, selectedDate, activeTab)
    if (!draft) return

    const sameAsServer =
      draft.content === base.content &&
      draft.weather === base.weather &&
      draft.mood === base.mood

    if (sameAsServer || !draft.content.trim()) {
      removeDraft(userId, selectedDate, activeTab)
      return
    }

    // 초안을 만든 뒤 서버 일기가 새로 생겼거나 바뀐 경우
    const conflict =
      base.entryId != null &&
      (draft.mode === "new" || draft.baseUpdatedAt !== base.updatedAt)

    setPendingDraft({ draft, conflict })
  }, [userId, fetching, activeTab, selectedDate])

  const resumeDraft = () => {
    if (!pendingDraft) return
    const { draft } = pendingDraft

    setText(draft.content)
    setSelectedWeather(
      isWeatherKey(draft.weather) ? draft.weather : FALLBACK_WEATHER
    )
    setSelectedMood(isEmotionKey(draft.mood) ? draft.mood : FALLBACK_EMOTION)
    setPendingDraft(null)
    setDraftStatus("saved")
  }

  const discardDraft = () => {
    if (!pendingDraft) return
    const { draft } = pendingDraft
    removeDraft(draft.userId, draft.entryDate, draft.diaryType)
    setPendingDraft(null)
    setDraftStatus("idle")
  }

  const switchTab = (nextTab: DiaryType) => {
    if (nextTab === activeTab) return

    // 떠나는 탭의 입력 내용은 기기에도 바로 저장
    persistDraftRef.current()
    // 복구 안내에 답하지 않고 탭을 바꾸면, 돌아왔을 때 다시 물어본다
    if (pendingDraft) {
      draftCheckedRef.current.delete(`${selectedDate}:${activeTab}`)
    }
    formOwnerRef.current = null
    setPendingDraft(null)
    setDraftStatus("idle")

    // 불러오는 중이 아닐 때만 현재 탭 입력 상태를 보관 (불러오기 전 빈 화면을 저장하지 않게)
    if (!fetching) {
      tabFormsRef.current[formKey(activeTab)] = {
        text,
        weather: selectedWeather,
        mood: selectedMood,
        isEdit,
      }
    }

    setActiveTab(nextTab)
  }

  const resetForm = () => {
    setIsEdit(false)
    setText("")
    setSelectedWeather(FALLBACK_WEATHER)
    setSelectedMood(FALLBACK_EMOTION)
  }

  // 23시 컷오프 제거: 하루 중 언제든 작성 가능
  // (유예 시간 도입 시 이 자리에서 다시 판단)
  useEffect(() => {
    setCanEdit(true)
  }, [isToday])

  useEffect(() => {
    setActiveTab(initialDiaryType)
  }, [initialDiaryType])

  useEffect(() => {
    // 응답이 늦게 와서 이미 다른 탭으로 넘어간 경우, 그 응답으로 화면을 덮지 않는다
    let cancelled = false

    // 이 탭에서 입력하던 내용이 있으면 서버에서 다시 불러오지 않고 그대로 복원
    const kept = tabFormsRef.current[`${selectedDate}:${activeTab}`]
    if (kept) {
      setText(kept.text)
      setSelectedWeather(kept.weather)
      setSelectedMood(kept.mood)
      setIsEdit(kept.isEdit)
      setError(null)
      setFetching(false)
      formOwnerRef.current = { date: selectedDate, tab: activeTab }
      return
    }

    formOwnerRef.current = null

    async function fetchDiaryByType() {
      try {
        setFetching(true)
        setError(null)

        let data: DiarySaveResponse

        if (isToday) {
          data = (await apiClient.getTodayDiary(activeTab)) as DiarySaveResponse
        } else {
          data = (await apiClient.getDiaryByDate(
            selectedDate,
            activeTab
          )) as DiarySaveResponse
        }

        if (cancelled) return

        // 구버전이나 알 수 없는 값이 들어와도 화면이 깨지지 않게 방어
        const loadedWeather = isWeatherKey(data.weather)
          ? data.weather
          : FALLBACK_WEATHER
        const savedMood = data.mood_tags?.[0]
        const loadedMood = isEmotionKey(savedMood) ? savedMood : FALLBACK_EMOTION

        baseRef.current[`${selectedDate}:${activeTab}`] = {
          entryId: data.id ?? null,
          updatedAt: data.updated_at ?? null,
          content: data.content || "",
          weather: loadedWeather,
          mood: loadedMood,
        }
        formOwnerRef.current = { date: selectedDate, tab: activeTab }

        setText(data.content || "")
        setSelectedWeather(loadedWeather)
        setSelectedMood(loadedMood)

        if (activeTab === "question" && data.question_text) {
          setQuestion(data.question_text)
        }

        setIsEdit(true)
      } catch (e: any) {
        if (cancelled) return

        const message = e?.message || ""

        if (
          message.includes("일기가 없습니다") ||
          message.includes("HTTP 404")
        ) {
          baseRef.current[`${selectedDate}:${activeTab}`] = {
            entryId: null,
            updatedAt: null,
            content: "",
            weather: FALLBACK_WEATHER,
            mood: FALLBACK_EMOTION,
          }
          formOwnerRef.current = { date: selectedDate, tab: activeTab }
          resetForm()
          return
        }

        setError(message || `${typeLabel} 일기를 불러오지 못했어요.`)
      } finally {
        if (!cancelled) setFetching(false)
      }
    }

    fetchDiaryByType()

    return () => {
      cancelled = true
    }
  }, [activeTab, selectedDate, isToday, typeLabel])

  useEffect(() => {
    if (activeTab !== "question") return
    if (isEdit && question.trim()) return

    if (
      initialQuestion &&
      (!initialQuestionDate || initialQuestionDate === selectedDate)
    ) {
      setQuestion(initialQuestion)
      return
    }

    const dailyQuestion = getDailyQuestion({
      userKey: getQuestionUserKeyFromStorage(),
      date: dateStringToLocalDate(selectedDate),
    })

    setQuestion(dailyQuestion)
  }, [
    activeTab,
    initialQuestion,
    initialQuestionDate,
    selectedDate,
    isEdit,
    question,
  ])

  async function handleSaveDiary() {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        entry_date: selectedDate,
        content: text,
        weather: selectedWeather,
        mood_tags: [selectedMood],
        diary_type: activeTab,
        question_id:
          activeTab === "question" ? getQuestionIdFromDate(selectedDate) : null,
        question_text: activeTab === "question" ? question : null,
      }

      let saved: DiarySaveResponse

      if (isEdit && isToday) {
        saved = (await apiClient.updateTodayDiary(payload)) as DiarySaveResponse
      } else if (isEdit) {
        saved = (await apiClient.updateDiary(
          selectedDate,
          payload
        )) as DiarySaveResponse
      } else {
        saved = (await apiClient.createDiary(payload)) as DiarySaveResponse
        handlePearlReward(saved)
      }

      // 정식 저장 성공 → 이 날짜·탭의 임시저장 삭제, 화면을 떠날 때 다시 저장하지 않게 표시
      if (userId) removeDraft(userId, selectedDate, activeTab)
      submittedRef.current = true

      const entryDate: string = saved?.entry_date || selectedDate
      const monthKey = getDiaryMonthKeyFromDate(entryDate)
      invalidateDiaryMonth(monthKey)

      onNavigate("calendar")
    } catch (e: any) {
      setError(e?.message || (isEdit ? "수정 실패" : "저장 실패"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#F8F6F2" }}>
      <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0">
        <button
          onClick={() => onNavigate("calendar")}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ background: "#FFFCF8", border: "1.5px solid #E5DDD5" }}
          type="button"
        >
          ←
        </button>

        <h2 className="text-base font-extrabold" style={{ color: "#3D3530" }}>
          {isToday ? "오늘 일기" : formatKoreanDate(selectedDate)}
        </h2>

        <div className="w-9" />
      </div>

      {!isToday && (
        <div className="px-5 mb-4">
          <div
            className="rounded-2xl px-4 py-3 text-sm font-bold"
            style={{
              background: "#FFFCF8",
              color: "#8A7E76",
              border: "1.5px solid #E5DDD5",
            }}
          >
            선택한 날짜: {selectedDate}
          </div>
        </div>
      )}

      <div className="px-5 mb-4">
        <div className="flex items-center gap-2">
          <div
            className="flex flex-1 rounded-2xl p-1"
            style={{ background: "#EDE8E0" }}
          >
            {(["question", "free"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: activeTab === tab ? "#FFFCF8" : "transparent",
                  color: activeTab === tab ? "#C9856A" : "#9A8F87",
                  boxShadow:
                    activeTab === tab ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                }}
                type="button"
              >
                {tab === "question" ? "질문형" : "자유형"}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowTypeInfo((v) => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-extrabold transition-all active:scale-95"
            style={{
              background: showTypeInfo ? "#C9856A" : "#FFFCF8",
              color: showTypeInfo ? "#FFFCF8" : "#9A8F87",
              border: showTypeInfo
                ? "1.5px solid #C9856A"
                : "1.5px solid #E5DDD5",
            }}
            type="button"
            aria-expanded={showTypeInfo}
            aria-controls="diary-type-info"
            aria-label="일기 종류 안내"
          >
            i
          </button>
        </div>

        {showTypeInfo && (
          <div
            id="diary-type-info"
            className="mt-2.5 rounded-2xl px-4 py-3"
            style={{
              background: "#FFF9F0",
              border: "1.5px solid rgba(242,196,168,0.55)",
            }}
          >
            <p
              className="text-xs font-bold leading-relaxed"
              style={{ color: "#3D3530" }}
            >
              자유형 일기는 해도리 피드백과 답장을 받을 수 있어요.
            </p>
            <p className="text-xs mt-1" style={{ color: "#9A8F87" }}>
              질문형 일기는 기록용으로만 저장돼요.
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-28">
        {fetching && (
          <div
            className="rounded-2xl px-4 py-3 text-sm font-bold text-center"
            style={{
              background: "#FFFCF8",
              color: "#9A8F87",
              border: "1.5px solid #E5DDD5",
            }}
          >
            {typeLabel} 일기를 확인하는 중...
          </div>
        )}

        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold"
          style={{
            background: activeTab === "question" ? "#FFF3E8" : "#EEF3EC",
            color: activeTab === "question" ? "#C9856A" : "#7D967A",
            border:
              activeTab === "question"
                ? "1.5px solid rgba(201,133,106,0.22)"
                : "1.5px solid rgba(125,150,122,0.22)",
          }}
        >
          <span>{activeTab === "question" ? "💬" : "✍️"}</span>
          {isEdit ? `작성된 ${typeLabel} 일기` : `새 ${typeLabel} 일기`}
        </div>

        {activeTab === "question" && (
          <div className="space-y-2">
            <div className="flex items-end gap-3">
              <div
                className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
                style={{ boxShadow: "0 2px 8px rgba(201,133,106,0.15)" }}
              >
                <Image
                  src="/images/haedori-character.png"
                  alt="해도리"
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              </div>

              <div
                className="relative flex-1 px-4 py-3 rounded-2xl rounded-bl-sm"
                style={{
                  background: "#FFFCF8",
                  border: "1.5px solid #E5DDD5",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <p
                  className="text-sm font-bold leading-relaxed"
                  style={{ color: "#3D3530" }}
                >
                  {question}
                </p>

                <div
                  className="absolute left-0 bottom-3 w-0 h-0"
                  style={{
                    borderTop: "6px solid transparent",
                    borderBottom: "6px solid transparent",
                    borderRight: "8px solid #FFFCF8",
                    marginLeft: "-8px",
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{
                  background: "#FFFCF8",
                  border: "1.5px solid #E5DDD5",
                  color: "#9A8F87",
                }}
              >
                오늘의 질문
              </span>
            </div>
          </div>
        )}

        {pendingDraft && (
          <div
            className="rounded-2xl px-4 py-3.5"
            style={{
              background: "#FFF3E8",
              border: "1.5px solid #E5DDD5",
            }}
          >
            <p className="text-sm font-extrabold" style={{ color: "#3D3530" }}>
              작성 중인 일기를 이어 쓸까요?
            </p>
            <p className="text-xs mt-1" style={{ color: "#9A8F87" }}>
              {formatDraftTime(pendingDraft.draft.savedAt)}에 임시저장된 글 ·{" "}
              {pendingDraft.draft.content.length}자
            </p>
            {pendingDraft.conflict && (
              <p className="text-xs mt-1 font-bold" style={{ color: "#C9856A" }}>
                저장된 일기가 그 뒤에 바뀌었어요. 이어 쓰고 저장하면 지금 저장된
                내용을 덮어써요.
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={resumeDraft}
                className="flex-1 py-2 rounded-xl text-sm font-extrabold transition-all active:scale-95"
                style={{ background: "#C9856A", color: "#FFFCF8" }}
              >
                이어 쓰기
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{
                  background: "#FFFCF8",
                  color: "#9A8F87",
                  border: "1.5px solid #E5DDD5",
                }}
              >
                지우기
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-bold mb-2.5" style={{ color: "#9A8F87" }}>
            오늘의 날씨
          </p>

          <WeatherTilePicker
            value={selectedWeather}
            onChange={setSelectedWeather}
            disabled={fetching || Boolean(pendingDraft)}
          />
        </div>

        <div>
          <p className="text-xs font-bold mb-2.5" style={{ color: "#9A8F87" }}>
            오늘의 감정 돌
          </p>

          <EmotionStonePicker
            value={selectedMood}
            onChange={setSelectedMood}
            disabled={fetching || Boolean(pendingDraft)}
          />
        </div>

        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "#FFFCF8",
            border: "1.5px solid #E5DDD5",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={Boolean(pendingDraft)}
            placeholder={
              activeTab === "question"
                ? "질문에 대한 답을 솔직하게 적어봐요..."
                : "오늘 하루를 자유롭게 기록해요..."
            }
            className="w-full h-44 px-5 pt-4 text-sm leading-relaxed resize-none outline-none"
            style={{
              background: "transparent",
              color: "#3D3530",
              fontFamily: "inherit",
            }}
          />

          <div className="px-5 pb-3 flex justify-between items-center">
            <span
              className="text-xs"
              style={{ color: draftStatus === "error" ? "#D9534F" : "#C4B8B0" }}
              aria-live="polite"
            >
              {draftStatus === "pending" && "저장 중..."}
              {draftStatus === "saved" && "임시저장 완료"}
              {draftStatus === "error" && "임시저장 실패"}
            </span>
            <span className="text-xs" style={{ color: "#C4B8B0" }}>
              {text.length}자
            </span>
          </div>
        </div>
      </div>

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm px-5 pb-8 pt-4"
        style={{
          background: "linear-gradient(to top, #F8F6F2 80%, transparent)",
        }}
      >
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

        <button
          className="w-full py-4 rounded-2xl font-extrabold text-base transition-all active:scale-95"
          style={{
            background: "#C9856A",
            color: "#FFFCF8",
            boxShadow: "0 4px 16px rgba(201,133,106,0.35)",
            opacity:
              loading ||
              fetching ||
              !text.trim() ||
              !canEdit ||
              Boolean(pendingDraft)
                ? 0.6
                : 1,
          }}
          onClick={handleSaveDiary}
          disabled={
            loading ||
            fetching ||
            !text.trim() ||
            !canEdit ||
            Boolean(pendingDraft)
          }
          type="button"
        >
          {loading
            ? "저장 중..."
            : isEdit
              ? `${typeLabel} 일기 수정하기`
              : `${typeLabel} 일기 저장하기`}
        </button>
      </div>
    </div>
  )
}