"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import LetterDetailScreen from "@/components/letter-detail-screen"
import { apiClient } from "@/lib/api"

export default function LetterDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [letter, setLetter] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLetter = async () => {
      try {
        const data = await apiClient.getLetterById(Number(id))
        setLetter(data)
      } catch (error) {
        console.error('Failed to load letter:', error)
        setLetter(null)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadLetter()
    }
  }, [id])

  const navigate = (screen: string, params?: Record<string, unknown>) => {
    if (screen === "diary-detail" && params?.date) {
      router.push(`/diary-detail/${params.date}`)
    } else if (screen === "letter-detail" && params?.letter) {
      // Assuming letter has an id
      const letterId = (params.letter as any).id || params.letter
      router.push(`/letter-detail/${letterId}`)
    } else {
      router.push(`/${screen}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">로딩 중...</p>
        </div>
      </div>
    )
  }

  return <LetterDetailScreen onNavigate={navigate} letter={letter as never} />
}