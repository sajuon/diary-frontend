// 진주 보상/잔액 변경을 화면 어디서든 알리기 위한 작은 이벤트 버스.
// - PearlToaster가 보상 이벤트를 받아 "+2 진주" 토스트를 띄운다.
// - useUserPearls가 잔액 이벤트를 받아 화면의 진주 숫자를 갱신한다.

export type PearlReward = {
  amount: number
  reason: string
  label: string
  balance: number
}

const REWARD_EVENT = "haedori:pearl-reward"
const BALANCE_EVENT = "haedori:pearl-balance"

export function notifyPearlBalance(balance: number) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(BALANCE_EVENT, { detail: balance }))
}

export function notifyPearlReward(reward: PearlReward) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(REWARD_EVENT, { detail: reward }))
  notifyPearlBalance(reward.balance)
}

/** API 응답에 pearl_reward가 있으면 토스트를 띄운다. */
export function handlePearlReward(response: unknown) {
  const reward = (response as { pearl_reward?: PearlReward | null } | null)?.pearl_reward
  if (reward && typeof reward.amount === "number") {
    notifyPearlReward(reward)
  }
}

export function onPearlReward(listener: (reward: PearlReward) => void) {
  const handler = (e: Event) => listener((e as CustomEvent<PearlReward>).detail)
  window.addEventListener(REWARD_EVENT, handler)
  return () => window.removeEventListener(REWARD_EVENT, handler)
}

export function onPearlBalance(listener: (balance: number) => void) {
  const handler = (e: Event) => listener((e as CustomEvent<number>).detail)
  window.addEventListener(BALANCE_EVENT, handler)
  return () => window.removeEventListener(BALANCE_EVENT, handler)
}
