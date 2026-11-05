import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db, schema } from '../db/index.js'
import { success, created, badRequest, now } from '../utils/response.js'
import { generateImage } from '../services/image-generation.js'
import { logTaskError, logTaskStart, logTaskSuccess } from '../utils/task-logger.js'
import { getRequestCookie } from '../utils/credits-request.js'
import { handleRouteError } from '../utils/credit-response.js'
import { saveUploadedFile } from '../utils/storage.js'

const app = new Hono()

// POST /scenes
app.post('/', async (c) => {
  const body = await c.req.json()
  const ts = now()
  const res = db.insert(schema.scenes).values({
    dramaId: body.drama_id,
    episodeId: body.episode_id,
    location: body.location,
    time: body.time || '',
    prompt: body.prompt || body.location,
    createdAt: ts,
    updatedAt: ts,
  }).run()
  const [result] = db.select().from(schema.scenes)
    .where(eq(schema.scenes.id, Number(res.lastInsertRowid))).all()
  return created(c, result)
})

// PUT /scenes/:id
app.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  const updates: Record<string, any> = { updatedAt: now() }
  if (body.location !== undefined) updates.location = body.location
  if (body.time !== undefined) updates.time = body.time
  if (body.prompt !== undefined) updates.prompt = body.prompt
  if (body.image_url !== undefined) updates.imageUrl = body.image_url
  if (body.local_path !== undefined) updates.localPath = body.local_path
  db.update(schema.scenes).set(updates).where(eq(schema.scenes.id, id)).run()
  return success(c)
})

// POST /scenes/:id/generate-image
app.post('/:id/generate-image', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  const [scene] = db.select().from(schema.scenes).where(eq(schema.scenes.id, id)).all()
  if (!scene) return badRequest(c, 'Scene not found')
  if (!body.episode_id) return badRequest(c, 'episode_id is required')
  const [ep] = db.select().from(schema.episodes).where(eq(schema.episodes.id, Number(body.episode_id))).all()
  if (!ep) return badRequest(c, 'Episode not found')

  const prompt = scene.prompt || `${scene.location}, ${scene.time || ''}, 高质量场景, 电影感`
  try {
    const cookie = getRequestCookie(c)
    logTaskStart('SceneImage', 'generate', { sceneId: id, episodeId: ep.id, dramaId: scene.dramaId, location: scene.location })
    db.update(schema.scenes).set({ status: 'processing', updatedAt: now() }).where(eq(schema.scenes.id, id)).run()
    const genId = await generateImage({
      sceneId: id,
      dramaId: scene.dramaId,
      prompt,
      configId: ep.imageConfigId ?? undefined,
      billingCookie: cookie,
      billingReason: '槐花短剧 - 场景图片',
    })
    logTaskSuccess('SceneImage', 'generate', { sceneId: id, generationId: genId })
    return success(c, { image_generation_id: genId })
  } catch (err: any) {
    logTaskError('SceneImage', 'generate', { sceneId: id, error: err.message })
    db.update(schema.scenes).set({ status: 'failed', updatedAt: now() }).where(eq(schema.scenes.id, id)).run()
    return handleRouteError(c, err)
  }
})

// POST /scenes/:id/upload-image — 本地上传场景图（不扣积分）
app.post('/:id/upload-image', async (c) => {
  const id = Number(c.req.param('id'))
  const [scene] = db.select().from(schema.scenes).where(eq(schema.scenes.id, id)).all()
  if (!scene) return badRequest(c, 'Scene not found')

  const body = await c.req.parseBody()
  const file = body['file']
  if (!file || !(file instanceof File)) return badRequest(c, 'file is required')

  const mime = file.type || ''
  if (!mime.startsWith('image/')) return badRequest(c, '只支持图片文件')
  if (file.size > 20 * 1024 * 1024) return badRequest(c, '图片不能超过 20MB')

  try {
    const buffer = await file.arrayBuffer()
    const localPath = await saveUploadedFile(buffer, 'scenes', file.name)
    const ts = now()
    db.update(schema.scenes).set({
      imageUrl: localPath,
      localPath,
      status: 'completed',
      updatedAt: ts,
    }).where(eq(schema.scenes.id, id)).run()
    logTaskSuccess('SceneImage', 'upload', { sceneId: id, localPath, fileName: file.name })
    return success(c, { image_url: localPath, local_path: localPath })
  } catch (err: any) {
    logTaskError('SceneImage', 'upload', { sceneId: id, error: err.message })
    return badRequest(c, err.message || '上传失败')
  }
})

// DELETE /scenes/:id
app.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  db.delete(schema.scenes).where(eq(schema.scenes.id, id)).run()
  return success(c)
})

export default app
