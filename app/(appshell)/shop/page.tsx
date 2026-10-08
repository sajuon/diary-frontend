"use client"

import { useRouter } from "next/navigation"
import ShopScreen from "@/components/shop-screen"
import { goBack } from "@/lib/navigation"

export default function ShopPage() {
  const router = useRouter()

  const navigate = (screen: string) => {
    if (screen === "back") {
      goBack(router, "/home")
    } else {
      router.push(`/${screen}`)
    }
  }

  return <ShopScreen onNavigate={navigate} />
}
