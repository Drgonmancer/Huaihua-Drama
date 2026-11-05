/**
 * 槐花短剧积分定价
 *
 * - 文案 Agent / 生图：默认 10 积分/次（可用 HUOBAO_AGENT_CREDITS / HUOBAO_IMAGE_CREDITS 覆盖）
 * - 视频 Mini：火山官方直连成本 0.4 元/秒；标价 16 积分/秒（4×），实扣 12 积分/秒（3×，75 折）
 */

export const DEFAULT_AGENT_CREDITS = 10
export const DEFAULT_IMAGE_CREDITS = 10

export const CREDIT_RMB_VALUE = Number(process.env.HUOBAO_CREDIT_RMB_VALUE || 0.09)

export const AGENT_API_COST_RMB = Number(process.env.HUOBAO_AGENT_API_COST_RMB || 0.054)
export const AGENT_MARGIN = Number(process.env.HUOBAO_AGENT_MARGIN || 5)

export function creditsFromCostRmb(costRmb: number, margin: number): number {
  if (CREDIT_RMB_VALUE <= 0) return 1
  return Math.max(1, Math.ceil((costRmb * margin) / CREDIT_RMB_VALUE))
}

const agentOverride = process.env.HUOBAO_AGENT_CREDITS
export const AGENT_CHAT_CREDITS = agentOverride
  ? Number(agentOverride)
  : DEFAULT_AGENT_CREDITS

export const IMAGE_API_COST_RMB = Number(process.env.HUOBAO_IMAGE_API_COST_RMB || 0.09)
export const IMAGE_MARGIN = Number(process.env.HUOBAO_IMAGE_MARGIN || 5)
const imageOverride = process.env.HUOBAO_IMAGE_CREDITS
export const IMAGE_CREDITS_COST = imageOverride
  ? Number(imageOverride)
  : DEFAULT_IMAGE_CREDITS

export const VIDEO_MAX_DURATION_SEC = Number(process.env.HUOBAO_VIDEO_MAX_DURATION || 15)

/** Mini 标价：16 积分/秒（0.4 元/秒 × 4× ÷ 0.10 元/积分） */
export const VIDEO_LIST_CREDITS_PER_SECOND_MINI = Number(
  process.env.HUOBAO_VIDEO_LIST_CREDITS_PER_SECOND || 16,
)
/** Mini 实扣：12 积分/秒（0.4 元/秒 × 3× ÷ 0.10 元/积分） */
export const VIDEO_CHARGE_CREDITS_PER_SECOND_MINI = Number(
  process.env.HUOBAO_VIDEO_CHARGE_CREDITS_PER_SECOND || 12,
)
/** Pro 标价（默认 Mini 的 2 倍） */
export const VIDEO_LIST_CREDITS_PER_SECOND_PRO = Number(
  process.env.HUOBAO_VIDEO_PRO_LIST_CREDITS_PER_SECOND || VIDEO_LIST_CREDITS_PER_SECOND_MINI * 2,
)

/** 展示 4× / 实扣 3× → 75 折 */
export const VIDEO_LIST_MARGIN = Number(process.env.HUOBAO_VIDEO_LIST_MARGIN || 4)
export const VIDEO_CHARGE_MARGIN = Number(process.env.HUOBAO_VIDEO_CHARGE_MARGIN || 3)
export const VIDEO_DISCOUNT_RATE = Number(
  process.env.HUOBAO_VIDEO_DISCOUNT_RATE || VIDEO_CHARGE_MARGIN / VIDEO_LIST_MARGIN,
)
export const VIDEO_DISCOUNT_LABEL = process.env.HUOBAO_VIDEO_DISCOUNT_LABEL || '75折'

/** 参考 API 成本（元/秒），仅用于运营对照，不参与扣费公式 */
export const VIDEO_MINI_API_COST_PER_SEC = Number(process.env.HUOBAO_VIDEO_MINI_API_COST_RMB || 0.4)
export const VIDEO_PRO_API_COST_PER_SEC = Number(process.env.HUOBAO_VIDEO_PRO_API_COST_RMB || 0.85)

export interface VideoCreditTier {
  maxSeconds: number
  label: string
  listCredits: number
  chargeCredits: number
  discountRate: number
  listCreditsPerSecond: number
  chargeCreditsPerSecond: number
}

export interface VideoPricingQuote {
  durationSeconds: number
  listCredits: number
  chargeCredits: number
  listCreditsPerSecond: number
  chargeCreditsPerSecond: number
  discountRate: number
  discountLabel: string
}

export const AGENT_LABELS: Record<string, string> = {
  script_rewriter: '剧本改写',
  extractor: '角色场景提取',
  storyboard_breaker: '分镜拆解',
  voice_assigner: '音色分配',
  grid_prompt_generator: '宫格提示词',
}

function clampDuration(seconds: number): number {
  return Math.max(1, Math.min(VIDEO_MAX_DURATION_SEC, Math.ceil(Number(seconds) || 5)))
}

function isMiniModel(model?: string | null): boolean {
  const name = String(model || 'mini').toLowerCase()
  if (!model) return true
  return name.includes('mini')
}

function listCreditsPerSecond(model?: string | null): number {
  return isMiniModel(model)
    ? VIDEO_LIST_CREDITS_PER_SECOND_MINI
    : VIDEO_LIST_CREDITS_PER_SECOND_PRO
}

export function videoQuoteForDuration(seconds: number, model?: string | null): VideoPricingQuote {
  const secs = clampDuration(seconds)
  const listPerSec = listCreditsPerSecond(model)
  const chargePerSecFixed = isMiniModel(model)
    ? VIDEO_CHARGE_CREDITS_PER_SECOND_MINI
    : Math.round(VIDEO_CHARGE_CREDITS_PER_SECOND_MINI * (listPerSec / VIDEO_LIST_CREDITS_PER_SECOND_MINI) * 10) / 10
  const listCredits = Math.max(1, secs * listPerSec)
  const chargeCredits = Math.max(1, secs * chargePerSecFixed)
  const chargePerSec = Math.round((chargeCredits / secs) * 10) / 10
  return {
    durationSeconds: secs,
    listCredits,
    chargeCredits,
    listCreditsPerSecond: listPerSec,
    chargeCreditsPerSecond: chargePerSec,
    discountRate: VIDEO_DISCOUNT_RATE,
    discountLabel: VIDEO_DISCOUNT_LABEL,
  }
}

export function videoCreditsForDuration(seconds: number, model?: string | null): number {
  return videoQuoteForDuration(seconds, model).chargeCredits
}

export function videoListCreditsForDuration(seconds: number, model?: string | null): number {
  return videoQuoteForDuration(seconds, model).listCredits
}

function parseTierEnv(raw: string | undefined, listPerSec: number): VideoCreditTier[] | null {
  const text = String(raw || '').trim()
  if (!text) return null
  const labels = ['短视频', '标准镜', '长镜头', '超长镜']
  const parsed: VideoCreditTier[] = []
  for (const chunk of text.split(',')) {
    const parts = chunk.split(':')
    const maxSeconds = Number(parts[0])
    const chargeCredits = Number(parts[parts.length - 1])
    const listCredits = parts.length >= 3
      ? Number(parts[1])
      : Math.max(1, maxSeconds * listPerSec)
    if (!Number.isFinite(maxSeconds) || !Number.isFinite(chargeCredits) || maxSeconds <= 0 || chargeCredits <= 0) continue
    parsed.push({
      maxSeconds,
      label: labels[parsed.length] || `≤${maxSeconds}秒`,
      listCredits,
      chargeCredits,
      discountRate: VIDEO_DISCOUNT_RATE,
      listCreditsPerSecond: listPerSec,
      chargeCreditsPerSecond: Math.round((chargeCredits / maxSeconds) * 10) / 10,
    })
  }
  return parsed.length ? parsed : null
}

function buildTiersFromFormula(listPerSec: number, breakpoints: number[]): VideoCreditTier[] {
  const labels = ['短视频', '标准镜', '长镜头', '超长镜']
  return breakpoints.map((maxSeconds, i) => {
    const quote = videoQuoteForDuration(maxSeconds, listPerSec === VIDEO_LIST_CREDITS_PER_SECOND_MINI ? 'mini' : 'pro')
    return {
      maxSeconds,
      label: `${labels[i] || '视频'}(≤${maxSeconds}秒)`,
      listCredits: quote.listCredits,
      chargeCredits: quote.chargeCredits,
      discountRate: VIDEO_DISCOUNT_RATE,
      listCreditsPerSecond: quote.listCreditsPerSecond,
      chargeCreditsPerSecond: quote.chargeCreditsPerSecond,
    }
  })
}

const TIER_BREAKPOINTS = [5, 8, 12, VIDEO_MAX_DURATION_SEC]
const miniTierOverride = parseTierEnv(process.env.HUOBAO_VIDEO_MINI_TIERS, VIDEO_LIST_CREDITS_PER_SECOND_MINI)
const proTierOverride = parseTierEnv(process.env.HUOBAO_VIDEO_PRO_TIERS, VIDEO_LIST_CREDITS_PER_SECOND_PRO)

export const VIDEO_MINI_TIERS = miniTierOverride ?? buildTiersFromFormula(VIDEO_LIST_CREDITS_PER_SECOND_MINI, TIER_BREAKPOINTS)
export const VIDEO_PRO_TIERS = proTierOverride ?? buildTiersFromFormula(VIDEO_LIST_CREDITS_PER_SECOND_PRO, TIER_BREAKPOINTS)

export const VIDEO_DEFAULT_TASK_CREDITS = videoCreditsForDuration(5, 'mini')
export const VIDEO_LIST_DEFAULT_CREDITS = videoListCreditsForDuration(5, 'mini')

/** 展示：Mini 实扣 12 积分/秒 */
export const VIDEO_CREDITS_PER_SECOND_MINI = VIDEO_CHARGE_CREDITS_PER_SECOND_MINI

export function videoCreditsTierLabel(seconds: number, model?: string | null): string {
  const secs = clampDuration(seconds)
  const tiers = isMiniModel(model) ? VIDEO_MINI_TIERS : VIDEO_PRO_TIERS
  const sorted = [...tiers].sort((a, b) => a.maxSeconds - b.maxSeconds)
  for (const tier of sorted) {
    if (secs <= tier.maxSeconds) return tier.label
  }
  return sorted[sorted.length - 1]?.label ?? '视频镜头'
}

export function videoBillingReason(seconds: number, model?: string | null): string {
  const quote = videoQuoteForDuration(seconds, model)
  return `槐花短剧 - 视频${quote.durationSeconds}s·${VIDEO_DISCOUNT_LABEL}`
}

export function videoPricingSummary() {
  const quote5 = videoQuoteForDuration(5, 'mini')
  return {
    mode: 'list_charge_discount' as const,
    creditRmbValue: CREDIT_RMB_VALUE,
    agentCost: AGENT_CHAT_CREDITS,
    agentMargin: AGENT_MARGIN,
    imageCost: IMAGE_CREDITS_COST,
    videoListMargin: VIDEO_LIST_MARGIN,
    videoChargeMargin: VIDEO_CHARGE_MARGIN,
    videoDiscountRate: VIDEO_DISCOUNT_RATE,
    videoDiscountLabel: VIDEO_DISCOUNT_LABEL,
    videoListCreditsPerSecond: VIDEO_LIST_CREDITS_PER_SECOND_MINI,
    videoChargeCreditsPerSecond: VIDEO_CREDITS_PER_SECOND_MINI,
    videoMiniFromCredits: quote5.chargeCredits,
    videoMiniListCredits: quote5.listCredits,
    videoMiniPerSecond: VIDEO_CREDITS_PER_SECOND_MINI,
    videoDefaultCost: VIDEO_DEFAULT_TASK_CREDITS,
    videoMiniApiCostPerSec: VIDEO_MINI_API_COST_PER_SEC,
    videoMiniTiers: VIDEO_MINI_TIERS,
    videoProTiers: VIDEO_PRO_TIERS,
  }
}
