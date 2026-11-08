import type { Context } from 'hono'
import { CreditError } from '../services/local-credits.js'
import { badRequest } from './response.js'

export function handleRouteError(c: Context, err: unknown) {
  if (err instanceof CreditError) {
    return c.json({
      code: err.status,
      message: err.message,
      data: {
        remaining_credits: err.remaining_credits,
        credits_needed: err.credits_needed,
      },
    }, err.status as 401 | 402 | 403 | 500 | 503)
  }
  const message = err instanceof Error ? err.message : '请求失败'
  return badRequest(c, message)
}
