import { IMAGE_CREDITS_COST } from '../config/pricing.js'
import { ensureCredits, deductCredits } from './local-credits.js'
import { setImageBilling, takeImageBilling, setVideoBilling, takeVideoBilling } from './billing-context.js'

export async function reserveImageBilling(
  cookie: string | undefined,
  generationId: number,
  reason: string,
) {
  await ensureCredits(cookie, IMAGE_CREDITS_COST)
  setImageBilling(generationId, {
    cookie,
    amount: IMAGE_CREDITS_COST,
    reason,
    idempotencyKey: `huaihua-img-${generationId}`,
  })
}

export async function settleImageBilling(generationId: number) {
  const billing = takeImageBilling(generationId)
  if (!billing?.cookie) return null
  return deductCredits(billing.cookie, billing.amount, billing.reason, billing.idempotencyKey)
}

export function releaseImageBilling(generationId: number) {
  takeImageBilling(generationId)
}

export async function reserveVideoBilling(
  cookie: string | undefined,
  generationId: number,
  amount: number,
  reason: string,
) {
  await ensureCredits(cookie, amount)
  setVideoBilling(generationId, {
    cookie,
    amount,
    reason,
    idempotencyKey: `huaihua-vid-${generationId}`,
  })
}

export async function settleVideoBilling(generationId: number) {
  const billing = takeVideoBilling(generationId)
  if (!billing?.cookie) return null
  return deductCredits(billing.cookie, billing.amount, billing.reason, billing.idempotencyKey)
}

export function releaseVideoBilling(generationId: number) {
  takeVideoBilling(generationId)
}
