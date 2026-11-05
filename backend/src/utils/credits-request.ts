import type { Context } from 'hono'

export function getRequestCookie(c: Context): string | undefined {
  return c.req.header('cookie') || undefined
}
