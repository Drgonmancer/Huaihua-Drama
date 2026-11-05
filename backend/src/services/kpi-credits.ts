import {
  AGENT_CHAT_CREDITS,
  IMAGE_CREDITS_COST,
  VIDEO_CREDITS_PER_SECOND_MINI,
  VIDEO_DEFAULT_TASK_CREDITS,
  videoPricingSummary,
} from '../config/pricing.js'

export class CreditError extends Error {
  status: number
  remaining_credits?: number
  credits_needed?: number

  constructor(message: string, opts: { status?: number; remaining_credits?: number; credits_needed?: number } = {}) {
    super(message)
    this.name = 'CreditError'
    this.status = opts.status ?? 402
    this.remaining_credits = opts.remaining_credits
    this.credits_needed = opts.credits_needed
  }
}

function resolveKpiBase() {
  const explicit = (process.env.KPI_INTERNAL_URL || process.env.KPI_PUBLIC_URL || '').trim()
  if (explicit) return explicit.replace(/\/+$/, '')
  return 'https://kpi.longgonghuohuo.com'
}

const KPI_BASE = resolveKpiBase()
export const SKIP_CREDITS = process.env.HUOBAO_SKIP_CREDITS === '1'
const CREDITS_PATH = '/api/huobao-drama/credits'

async function kpiJson(path: string, cookie: string | undefined, init: RequestInit = {}) {
  let res: Response
  try {
    res = await fetch(`${KPI_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
    })
  } catch {
    throw new CreditError('积分服务暂不可用，请稍后重试', { status: 503 })
  }

  let data: Record<string, unknown> = {}
  try {
    data = await res.json() as Record<string, unknown>
  } catch {
    data = {}
  }
  return { res, data }
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
  videoMiniApiCostPerSec?: number
  creditRmbValue?: number
  agentMargin?: number
  videoMiniTiers?: Array<{
    maxSeconds: number
    label: string
    listCredits: number
    chargeCredits: number
    discountRate?: number
  }>
  skipCredits?: boolean
}

function buildCreditsInfo(data: Record<string, unknown>, pricing: ReturnType<typeof videoPricingSummary>, skipCredits: boolean): CreditsInfo {
  return {
    username: String(data.username || (skipCredits ? process.env.HUOBAO_MOCK_USERNAME : '用户') || '用户'),
    credits: Number(data.credits) || (skipCredits ? Number(process.env.HUOBAO_MOCK_CREDITS || 9999) : 0),
    creditsAvailable: skipCredits ? true : Boolean(data.creditsAvailable),
    agentCost: Number(data.agentCost) || AGENT_CHAT_CREDITS,
    imageCost: Number(data.imageCost) || IMAGE_CREDITS_COST,
    videoMiniPerSecond: Number(data.videoMiniPerSecond) || VIDEO_CREDITS_PER_SECOND_MINI,
    videoDefaultCost: Number(data.videoDefaultCost) || VIDEO_DEFAULT_TASK_CREDITS,
    videoMiniFromCredits: Number(data.videoMiniFromCredits) || pricing.videoMiniFromCredits,
    videoMiniListCredits: Number(data.videoMiniListCredits) || pricing.videoMiniListCredits,
    videoPricingMode: (data.videoPricingMode as CreditsInfo['videoPricingMode']) || pricing.mode,
    videoListMargin: Number(data.videoListMargin) || pricing.videoListMargin,
    videoChargeMargin: Number(data.videoChargeMargin) || pricing.videoChargeMargin,
    videoDiscountRate: Number(data.videoDiscountRate) || pricing.videoDiscountRate,
    videoDiscountLabel: String(data.videoDiscountLabel || pricing.videoDiscountLabel),
    videoListCreditsPerSecond: Number(data.videoListCreditsPerSecond) || pricing.videoListCreditsPerSecond,
    videoChargeCreditsPerSecond: Number(data.videoChargeCreditsPerSecond) || pricing.videoChargeCreditsPerSecond,
    videoMiniApiCostPerSec: Number(data.videoMiniApiCostPerSec) || pricing.videoMiniApiCostPerSec,
    creditRmbValue: Number(data.creditRmbValue) || pricing.creditRmbValue,
    agentMargin: Number(data.agentMargin) || pricing.agentMargin,
    videoMiniTiers: Array.isArray(data.videoMiniTiers)
      ? data.videoMiniTiers as CreditsInfo['videoMiniTiers']
      : pricing.videoMiniTiers,
    skipCredits,
  }
}

export async function getCredits(cookie?: string): Promise<CreditsInfo> {
  const pricing = videoPricingSummary()
  if (SKIP_CREDITS) {
    return buildCreditsInfo({}, pricing, true)
  }
  if (!cookie) {
    throw new CreditError('请先登录后再使用槐花短剧', { status: 401 })
  }

  const { res, data } = await kpiJson(CREDITS_PATH, cookie, { method: 'GET' })
  if (res.status === 401) {
    throw new CreditError('请先登录后再使用槐花短剧', { status: 401 })
  }
  if (!res.ok) {
    throw new CreditError(String(data.error || data.message || '积分查询失败'), { status: res.status })
  }

  return buildCreditsInfo(data, pricing, false)
}

export async function ensureCredits(cookie: string | undefined, amount: number) {
  const info = await getCredits(cookie)
  if (!info.creditsAvailable && !SKIP_CREDITS) {
    throw new CreditError('积分同步中，请稍后重试', { status: 503 })
  }
  if (info.credits < amount) {
    throw new CreditError(`积分不足！当前积分: ${info.credits}，需要: ${amount}`, {
      remaining_credits: info.credits,
      credits_needed: amount,
    })
  }
  return info
}

export async function deductCredits(
  cookie: string | undefined,
  amount: number,
  reason: string,
  idempotencyKey: string,
) {
  if (SKIP_CREDITS) {
    return { remaining_credits: Number(process.env.HUOBAO_MOCK_CREDITS || 9999) }
  }
  if (!cookie) throw new CreditError('请先登录后再使用槐花短剧', { status: 401 })

  const { res, data } = await kpiJson(`${CREDITS_PATH}/deduct`, cookie, {
    method: 'POST',
    body: JSON.stringify({ amount, reason, idempotency_key: idempotencyKey }),
  })

  if (res.status === 401) throw new CreditError('请先登录后再使用槐花短剧', { status: 401 })
  if (!res.ok) {
    throw new CreditError(String(data.error || '扣费失败'), {
      status: res.status,
      remaining_credits: typeof data.remaining_credits === 'number' ? data.remaining_credits : undefined,
      credits_needed: typeof data.credits_needed === 'number' ? data.credits_needed : amount,
    })
  }
  return data
}
