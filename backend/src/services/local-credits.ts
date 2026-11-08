/**
 * 本地积分服务 — 独立运行模式
 * 积分余额来自本地配置，不依赖任何外部账号体系；
 * 用于生成前的额度校验与界面定价展示。接入真实计费后端时在 deductCredits 内扩展。
 */
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
  /** 本地模式固定为 true：前端据此显示「本地积分」文案 */
  skipCredits: boolean
}

function localCredits(): number {
  const n = Number(process.env.HUAIHUA_LOCAL_CREDITS)
  return Number.isFinite(n) && n > 0 ? n : 9999
}

function buildCreditsInfo(pricing: ReturnType<typeof videoPricingSummary>): CreditsInfo {
  return {
    username: String(process.env.HUAIHUA_LOCAL_USERNAME || '本地用户'),
    credits: localCredits(),
    creditsAvailable: true,
    agentCost: AGENT_CHAT_CREDITS,
    imageCost: IMAGE_CREDITS_COST,
    videoMiniPerSecond: VIDEO_CREDITS_PER_SECOND_MINI,
    videoDefaultCost: VIDEO_DEFAULT_TASK_CREDITS,
    videoMiniFromCredits: pricing.videoMiniFromCredits,
    videoMiniListCredits: pricing.videoMiniListCredits,
    videoPricingMode: pricing.mode,
    videoListMargin: pricing.videoListMargin,
    videoChargeMargin: pricing.videoChargeMargin,
    videoDiscountRate: pricing.videoDiscountRate,
    videoDiscountLabel: pricing.videoDiscountLabel,
    videoListCreditsPerSecond: pricing.videoListCreditsPerSecond,
    videoChargeCreditsPerSecond: pricing.videoChargeCreditsPerSecond,
    videoMiniApiCostPerSec: pricing.videoMiniApiCostPerSec,
    creditRmbValue: pricing.creditRmbValue,
    agentMargin: pricing.agentMargin,
    videoMiniTiers: pricing.videoMiniTiers,
    skipCredits: true,
  }
}

export async function getCredits(_cookie?: string): Promise<CreditsInfo> {
  return buildCreditsInfo(videoPricingSummary())
}

export async function ensureCredits(_cookie: string | undefined, amount: number) {
  const info = await getCredits()
  if (info.credits < amount) {
    throw new CreditError(`积分不足！当前积分: ${info.credits}，需要: ${amount}`, {
      remaining_credits: info.credits,
      credits_needed: amount,
    })
  }
  return info
}

export async function deductCredits(
  _cookie: string | undefined,
  _amount: number,
  _reason: string,
  _idempotencyKey: string,
) {
  // 本地模式：余额固定，不持久化扣费流水；签名保留以便未来接入计费后端
  return { remaining_credits: localCredits() }
}
