export interface PendingBilling {
  cookie?: string
  amount: number
  reason: string
  idempotencyKey: string
}

const imageBilling = new Map<number, PendingBilling>()
const videoBilling = new Map<number, PendingBilling>()

export function setImageBilling(id: number, billing: PendingBilling) {
  imageBilling.set(id, billing)
}

export function takeImageBilling(id: number): PendingBilling | undefined {
  const billing = imageBilling.get(id)
  imageBilling.delete(id)
  return billing
}

export function setVideoBilling(id: number, billing: PendingBilling) {
  videoBilling.set(id, billing)
}

export function takeVideoBilling(id: number): PendingBilling | undefined {
  const billing = videoBilling.get(id)
  videoBilling.delete(id)
  return billing
}
