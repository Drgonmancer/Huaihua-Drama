export interface VideoCreditTier {
  maxSeconds: number
  label: string
  listCredits: number
  chargeCredits: number
  discountRate?: number
  credits?: number
}

export interface CreditsInfo {
  username: string
  credits: number
  creditsAvailable: boolean
  agentCost: number
  imageCost: number
  videoMiniPerSecond: number
  videoDefaultCost: number
  videoMiniFromCredits: number
  videoMiniListCredits?: number
  videoPricingMode: 'list_charge_discount' | 'cost_based_tier' | 'per_shot_tier' | 'per_second'
  videoListMargin?: number
  videoChargeMargin?: number
  videoDiscountRate?: number
  videoDiscountLabel?: string
  videoListCreditsPerSecond?: number
  videoChargeCreditsPerSecond?: number
  creditRmbValue?: number
  agentMargin?: number
  videoMiniTiers?: VideoCreditTier[]
  skipCredits?: boolean
}

export interface VideoQuote {
  durationSeconds: number
  listCredits: number
  chargeCredits: number
  discountRate: number
  discountLabel: string
}

const creditsState = reactive<{
  info: CreditsInfo | null
  loading: boolean
}>({
  info: null,
  loading: false,
})

import { apiBasePath } from '~/utils/api-base'

export function useCredits() {
  const { t, locale } = useLocale()

  /** 折扣展示：zh 沿用后端标签（如「75折」），en 换算为百分比 */
  function discountDisplay(rate: number | undefined, label: string | undefined): string {
    if (locale.value !== 'en') return label || '75折'
    const r = rate || 0.75
    return `${Math.round((1 - r) * 100)}% off`
  }
  async function refresh() {
    creditsState.loading = true
    try {
      const resp = await fetch(`${apiBasePath()}/credits`, { credentials: 'include' })
      const json = await resp.json()
      const payload = json?.data ?? (json?.credits != null ? json : null)
      if (resp.ok && payload) {
        creditsState.info = payload as CreditsInfo
        return creditsState.info
      }
      if (resp.status === 401) {
        creditsState.info = {
          username: '',
          credits: 0,
          creditsAvailable: false,
          agentCost: 10,
          imageCost: 10,
          videoMiniPerSecond: 12,
          videoDefaultCost: 60,
          videoMiniFromCredits: 60,
          videoPricingMode: 'list_charge_discount',
        }
      }
    } catch {
      /* ignore */
    } finally {
      creditsState.loading = false
    }
    return creditsState.info
  }

  function applyRemaining(remaining: number | undefined) {
    if (remaining != null && creditsState.info) {
      creditsState.info = { ...creditsState.info, credits: remaining }
    }
  }

  function quoteVideo(seconds: number): VideoQuote | null {
    const info = creditsState.info
    const maxDur = 15
    const secs = Math.max(1, Math.min(maxDur, Math.ceil(Number(seconds) || 5)))
    const listPerSec = info?.videoListCreditsPerSecond ?? 16
    const chargePerSec = info?.videoChargeCreditsPerSecond ?? info?.videoMiniPerSecond ?? 12
    const listCredits = Math.max(1, secs * listPerSec)
    const chargeCredits = Math.max(1, secs * chargePerSec)
    const discountRate = info?.videoDiscountRate ?? (listPerSec > 0 ? chargePerSec / listPerSec : 0.75)
    return {
      durationSeconds: secs,
      listCredits,
      chargeCredits,
      discountRate,
      discountLabel: info?.videoDiscountLabel ?? '75折',
    }
  }

  function formatVideoPrice(seconds: number): string {
    const q = quoteVideo(seconds)
    if (!q) return t('credits.video.perShotBilling')
    return `${q.listCredits}→${q.chargeCredits} ${t('credits.point')} · ${discountDisplay(q.discountRate, q.discountLabel)}`
  }

  /** 按钮旁展示：实扣积分，有折扣时显示 标价→实扣 */
  function formatVideoButtonCredits(seconds: number): string {
    const q = quoteVideo(seconds)
    if (!q) return ''
    if (q.listCredits !== q.chargeCredits) {
      return `${q.listCredits}→${q.chargeCredits} ${t('credits.point')}`
    }
    return `${q.chargeCredits} ${t('credits.point')}`
  }

  function sumVideoChargeCredits(items: Array<{ duration?: number | null }>): number {
    return items.reduce((sum, item) => {
      const q = quoteVideo(Number(item.duration || 5))
      return sum + (q?.chargeCredits ?? 0)
    }, 0)
  }

  const agentCost = computed(() => creditsState.info?.agentCost ?? 10)
  const imageCost = computed(() => creditsState.info?.imageCost ?? 10)

  function creditTag(amount: number): string {
    return `${amount} ${t('credits.point')}`
  }

  function freeTag(): string {
    return t('credits.free')
  }

  const videoPricingHint = computed(() => {
    const info = creditsState.info
    if (!info) return t('credits.video.perShotBilling')
    if (info.videoPricingMode === 'list_charge_discount') {
      const listPerSec = info.videoListCreditsPerSecond ?? 16
      const chargePerSec = info.videoChargeCreditsPerSecond ?? info.videoMiniPerSecond ?? 12
      const label = discountDisplay(info.videoDiscountRate, info.videoDiscountLabel)
      return t('credits.video.listCharge', { a: listPerSec, b: chargePerSec, d: label })
    }
    if (info.videoPricingMode === 'cost_based_tier' || info.videoPricingMode === 'per_shot_tier') {
      const from = info.videoMiniFromCredits ?? info.videoDefaultCost
      return t('credits.video.fromPerShot', { n: from })
    }
    return t('credits.video.perSecond', { n: info.videoMiniPerSecond })
  })

  return {
    info: computed(() => creditsState.info),
    loading: computed(() => creditsState.loading),
    agentCost,
    imageCost,
    videoPricingHint,
    quoteVideo,
    formatVideoPrice,
    formatVideoButtonCredits,
    sumVideoChargeCredits,
    creditTag,
    freeTag,
    refresh,
    applyRemaining,
  }
}
