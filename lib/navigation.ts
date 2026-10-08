// 뒤로가기: 앱 안에서 들어온 경우 이전 화면으로, 바로 열린 경우(새 탭·링크)는 fallback으로.
type RouterLike = { back: () => void; push: (href: string) => void }

export function goBack(router: RouterLike, fallback: string) {
  if (typeof window !== "undefined" && window.history.length > 1) {
    router.back()
  } else {
    router.push(fallback)
  }
}
