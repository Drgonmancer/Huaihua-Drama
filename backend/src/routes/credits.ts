import { Hono } from 'hono'

import { CreditError, getCredits } from '../services/kpi-credits.js'

import { getRequestCookie } from '../utils/credits-request.js'

import { videoQuoteForDuration } from '../config/pricing.js'

import { success } from '../utils/response.js'



const app = new Hono()



app.get('/', async (c) => {

  try {

    const info = await getCredits(getRequestCookie(c))

    return c.json({ code: 200, data: info, message: 'success' })

  } catch (err: any) {

    if (err instanceof CreditError) {

      const status = (err.status >= 400 && err.status < 600 ? err.status : 500) as 401 | 402 | 403 | 500 | 503

      return c.json({ code: err.status, message: err.message, data: null }, status)

    }

    return c.json({ code: 500, message: err.message || '积分查询失败' }, 500)

  }

})



app.get('/video-quote', async (c) => {

  const seconds = Number(c.req.query('seconds') || 5)

  const model = c.req.query('model') || undefined

  return success(c, videoQuoteForDuration(seconds, model))

})



export default app

